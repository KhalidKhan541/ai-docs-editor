import { generateId } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TextAnchor = {
  /** Offset from the start of the document in UTF-16 code units */
  offset: number;
  /** Length of the anchored text in UTF-16 code units */
  length: number;
  /** The original text content at anchor time (for drift detection) */
  content: string;
};

export type SelectionAnchor = {
  id: string;
  ranges: TextAnchor[];
  /** Stable fingerprint used to reconnect after edits */
  fingerprint: string;
};

export type PositionShift = {
  anchorId: string;
  oldOffset: number;
  newOffset: number;
  delta: number;
  driftDetected: boolean;
};

export type AnchorSnapshot = {
  anchorId: string;
  offsets: { rangeIndex: number; offset: number; length: number }[];
  timestamp: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeFingerprint(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    hash = ((hash << 5) - hash + ch) | 0;
  }
  return `fp_${Math.abs(hash).toString(36)}`;
}

function getTextSlice(doc: string, offset: number, length: number): string {
  if (offset < 0 || length <= 0) return "";
  const end = Math.min(offset + length, doc.length);
  return doc.slice(offset, end);
}

function isAnchorStable(anchor: TextAnchor, doc: string): boolean {
  const current = getTextSlice(doc, anchor.offset, anchor.length);
  return current === anchor.content;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class CommentPositioningService {
  private anchors: Map<string, SelectionAnchor> = new Map();

  /**
   * Create a new selection anchor from a list of ranges.
   * Each range is `[startOffset, endOffset]` in the document.
   */
  createAnchor(
    doc: string,
    ranges: { start: number; end: number }[],
    documentId: string
  ): SelectionAnchor {
    const anchors: TextAnchor[] = ranges.map((r) => ({
      offset: r.start,
      length: r.end - r.start,
      content: getTextSlice(doc, r.start, r.end - r.start),
    }));

    const fingerprint = anchors.map((a) => computeFingerprint(a.content)).join("|");

    const anchor: SelectionAnchor = {
      id: generateId(),
      ranges: anchors,
      fingerprint,
    };

    this.anchors.set(anchor.id, anchor);
    return anchor;
  }

  /**
   * Resolve an anchor to current offsets after document edits.
   * Returns null if the anchor has drifted beyond repair.
   */
  resolveAnchor(anchorId: string, doc: string): TextAnchor[] | null {
    const anchor = this.anchors.get(anchorId);
    if (!anchor) return null;

    const allStable = anchor.ranges.every((r) => isAnchorStable(r, doc));
    if (allStable) return [...anchor.ranges];

    return this.reconnectAnchor(anchor, doc);
  }

  /**
   * After an edit, recalculate all anchors in the document.
   * Returns the list of shifts that were applied.
   */
  recalculateAnchors(doc: string, editStart: number, editEnd: number, editDelta: number): PositionShift[] {
    const shifts: PositionShift[] = [];

    for (const anchor of this.anchors.values()) {
      for (const range of anchor.ranges) {
        const shift = this.shiftRange(range, editStart, editEnd, editDelta);
        if (shift) {
          shifts.push({
            anchorId: anchor.id,
            oldOffset: range.offset,
            newOffset: range.offset + shift.delta,
            delta: shift.delta,
            driftDetected: shift.driftDetected,
          });
        }
      }
    }

    return shifts;
  }

  /**
   * Insert text into the document and update all affected anchors.
   */
  applyInsert(doc: string, offset: number, text: string): { doc: string; shifts: PositionShift[] } {
    const newDoc = doc.slice(0, offset) + text + doc.slice(offset);
    const shifts = this.recalculateAnchors(newDoc, offset, offset, text.length);

    for (const anchor of this.anchors.values()) {
      for (const range of anchor.ranges) {
        if (range.offset >= offset) {
          range.offset += text.length;
        } else if (range.offset + range.length > offset) {
          range.length += text.length;
          const end = range.offset + range.length;
          range.content = getTextSlice(newDoc, range.offset, range.length);
          range.offset = Math.min(range.offset, newDoc.length);
        }
      }
      anchor.fingerprint = anchor.ranges.map((r) => computeFingerprint(r.content)).join("|");
    }

    return { doc: newDoc, shifts };
  }

  /**
   * Delete text from the document and update all affected anchors.
   */
  applyDelete(doc: string, start: number, end: number): { doc: string; shifts: PositionShift[] } {
    const deletedLength = end - start;
    const newDoc = doc.slice(0, start) + doc.slice(end);
    const shifts = this.recalculateAnchors(newDoc, start, end, -deletedLength);

    for (const anchor of this.anchors.values()) {
      const rangesToRemove: number[] = [];
      for (let i = 0; i < anchor.ranges.length; i++) {
        const range = anchor.ranges[i];
        if (!range) continue;

        if (range.offset >= end) {
          range.offset -= deletedLength;
        } else if (range.offset + range.length <= start) {
          // Fully before the deletion — no change
        } else if (range.offset < start && range.offset + range.length > end) {
          // Deletion is entirely within the anchor range — shrink
          range.length -= deletedLength;
        } else if (range.offset < start && range.offset + range.length > start) {
          // Overlaps start of deletion
          range.length = start - range.offset;
        } else if (range.offset >= start && range.offset < end) {
          // Overlaps end of deletion — clamp to deletion start
          range.offset = start;
          range.length = Math.max(0, range.offset + range.length - end);
        }

        range.offset = Math.max(0, Math.min(range.offset, newDoc.length));
        range.length = Math.max(0, Math.min(range.length, newDoc.length - range.offset));

        if (range.length === 0) {
          rangesToRemove.push(i);
        } else {
          range.content = getTextSlice(newDoc, range.offset, range.length);
        }
      }

      for (let i = rangesToRemove.length - 1; i >= 0; i--) {
        anchor.ranges.splice(rangesToRemove[i]!, 1);
      }

      if (anchor.ranges.length === 0) {
        this.anchors.delete(anchor.id);
      } else {
        anchor.fingerprint = anchor.ranges.map((r) => computeFingerprint(r.content)).join("|");
      }
    }

    return { doc: newDoc, shifts };
  }

  /**
   * Apply a batch of edits in order.
   */
  applyEdits(
    doc: string,
    edits: { start: number; end: number; text: string }[]
  ): { doc: string; shifts: PositionShift[] } {
    let current = doc;
    const allShifts: PositionShift[] = [];

    const sorted = [...edits].sort((a, b) => a.start - b.start);

    let offsetAdjustment = 0;
    for (const edit of sorted) {
      const adjustedStart = edit.start + offsetAdjustment;
      const adjustedEnd = edit.end + offsetAdjustment;
      const isDeletion = edit.text.length === 0;

      if (isDeletion) {
        const result = this.applyDelete(current, adjustedStart, adjustedEnd);
        current = result.doc;
        allShifts.push(...result.shifts);
        offsetAdjustment -= adjustedEnd - adjustedStart;
      } else if (edit.end === edit.start) {
        const result = this.applyInsert(current, adjustedStart, edit.text);
        current = result.doc;
        allShifts.push(...result.shifts);
        offsetAdjustment += edit.text.length;
      } else {
        const delResult = this.applyDelete(current, adjustedStart, adjustedEnd);
        current = delResult.doc;
        allShifts.push(...delResult.shifts);
        const insResult = this.applyInsert(current, adjustedStart, edit.text);
        current = insResult.doc;
        allShifts.push(...insResult.shifts);
        offsetAdjustment += edit.text.length - (adjustedEnd - adjustedStart);
      }
    }

    return { doc: current, shifts: allShifts };
  }

  /**
   * Get the offset for a specific anchor range in the current document.
   */
  getAnchorOffset(anchorId: string, rangeIndex: number, doc: string): { start: number; end: number } | null {
    const resolved = this.resolveAnchor(anchorId, doc);
    if (!resolved || !resolved[rangeIndex]) return null;
    const range = resolved[rangeIndex]!;
    return { start: range.offset, end: range.offset + range.length };
  }

  /**
   * Get all anchors for a document as a list with resolved positions.
   */
  getAnchorPositions(doc: string): AnchorSnapshot[] {
    const snapshots: AnchorSnapshot[] = [];
    for (const anchor of this.anchors.values()) {
      const resolved = this.resolveAnchor(anchor.id, doc);
      if (!resolved) continue;
      snapshots.push({
        anchorId: anchor.id,
        offsets: resolved.map((r, i) => ({ rangeIndex: i, offset: r.offset, length: r.length })),
        timestamp: new Date().toISOString(),
      });
    }
    return snapshots;
  }

  removeAnchor(anchorId: string): boolean {
    return this.anchors.delete(anchorId);
  }

  getAnchor(anchorId: string): SelectionAnchor | undefined {
    return this.anchors.get(anchorId);
  }

  listAnchors(): SelectionAnchor[] {
    return Array.from(this.anchors.values());
  }

  // ---- Private helpers ---------------------------------------------------

  private shiftRange(
    range: TextAnchor,
    editStart: number,
    editEnd: number,
    editDelta: number
  ): { delta: number; driftDetected: boolean } | null {
    if (range.offset >= editEnd) {
      return { delta: editDelta, driftDetected: false };
    }
    if (range.offset + range.length <= editStart) {
      return null;
    }
    const driftDetected = range.offset < editStart && range.offset + range.length > editEnd;
    return { delta: editDelta, driftDetected };
  }

  private reconnectAnchor(anchor: SelectionAnchor, doc: string): TextAnchor[] | null {
    const reconnected: TextAnchor[] = [];

    for (const range of anchor.ranges) {
      if (isAnchorStable(range, doc)) {
        reconnected.push(range);
        continue;
      }

      const idx = doc.indexOf(range.content);
      if (idx !== -1) {
        reconnected.push({ ...range, offset: idx });
        continue;
      }

      const searchRadius = Math.max(range.content.length, 50);
      const candidates = this.findFuzzyMatch(doc, range.content, searchRadius);
      if (candidates.length > 0) {
        const best = candidates[0]!;
        reconnected.push({ ...range, offset: best.offset, content: best.content });
        continue;
      }

      return null;
    }

    return reconnected;
  }

  private findFuzzyMatch(doc: string, target: string, radius: number): { offset: number; content: string; score: number }[] {
    if (target.length === 0) return [];

    const results: { offset: number; content: string; score: number }[] = [];
    const words = target.split(/\s+/).filter(Boolean);

    for (let i = 0; i <= doc.length - target.length + radius; i++) {
      const slice = doc.slice(i, i + target.length);
      const score = this.similarityScore(target, slice);
      if (score > 0.5) {
        results.push({ offset: i, content: slice, score });
      }
    }

    if (results.length === 0 && words.length > 0) {
      const firstWord = words[0]!;
      const wordIdx = doc.indexOf(firstWord);
      if (wordIdx !== -1) {
        const slice = doc.slice(wordIdx, Math.min(doc.length, wordIdx + target.length));
        results.push({ offset: wordIdx, content: slice, score: 0.6 });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  private similarityScore(a: string, b: string): number {
    if (a === b) return 1;
    if (a.length === 0 || b.length === 0) return 0;

    const maxLen = Math.max(a.length, b.length);
    if (maxLen === 0) return 1;

    let matches = 0;
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen; i++) {
      if (a[i] === b[i]) matches++;
    }

    const longerBonus = Math.min(a.length, b.length) / maxLen;
    return (matches / maxLen) * 0.7 + longerBonus * 0.3;
  }

  clear(): void {
    this.anchors.clear();
  }
}

export const commentPositioningService = new CommentPositioningService();
