// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DiffOperation = {
  type: "equal" | "insert" | "delete";
  text: string;
  oldStart?: number;
  oldEnd?: number;
  newStart?: number;
  newEnd?: number;
};

export type InlineDiffSegment = {
  type: "equal" | "addition" | "deletion";
  text: string;
  start: number;
  end: number;
};

export type BlockDiff = {
  blockIndex: number;
  blockType: string;
  operations: DiffOperation[];
  hasChanges: boolean;
};

export type SideBySideSegment = {
  left: string;
  right: string;
  type: "equal" | "modified" | "addition" | "deletion";
  leftLineStart: number;
  rightLineStart: number;
};

export type MergeConflict = {
  id: string;
  startLine: number;
  endLine: number;
  baseText: string;
  oursText: string;
  theirsText: string;
  resolvedText: string | null;
  resolvedBy: string | null;
};

export type MergeResult = {
  text: string;
  conflicts: MergeConflict[];
  resolved: boolean;
  autoResolvable: number;
};

export type ThreeWayMergeInput = {
  base: string;
  ours: string;
  theirs: string;
};

export type DiffStats = {
  additions: number;
  deletions: number;
  unchanged: number;
  totalLines: number;
  similarity: number;
};

// ---------------------------------------------------------------------------
// Myers Diff Algorithm Implementation
// ---------------------------------------------------------------------------

function myersDiff(a: string, b: string): DiffOperation[] {
  if (a === b) {
    return [{ type: "equal", text: a, oldStart: 0, oldEnd: a.length, newStart: 0, newEnd: b.length }];
  }
  if (a.length === 0) {
    return [{ type: "insert", text: b, newStart: 0, newEnd: b.length }];
  }
  if (b.length === 0) {
    return [{ type: "delete", text: a, oldStart: 0, oldEnd: a.length }];
  }

  const n = a.length;
  const m = b.length;
  const max = n + m;

  const v = new Map<number, number>();
  v.set(1, 0);

  const trace: Map<number, number>[] = [];

  for (let d = 0; d <= max; d++) {
    const newV = new Map(v);
    trace.push(new Map(v));

    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && (v.get(k - 1) ?? 0) < (v.get(k + 1) ?? 0))) {
        x = v.get(k + 1) ?? 0;
      } else {
        x = (v.get(k - 1) ?? 0) + 1;
      }
      let y = x - k;

      while (x < n && y < m && a[x] === b[y]) {
        x++;
        y++;
      }

      newV.set(k, x);

      if (x >= n && y >= m) {
        v.set(k, x);
        trace.push(new Map(v));
        return backtrack(trace, a, b);
      }
    }

    v.clear();
    for (const [key, value] of newV) {
      v.set(key, value);
    }
  }

  return [{ type: "delete", text: a, oldStart: 0, oldEnd: a.length },
    { type: "insert", text: b, newStart: 0, newEnd: b.length }];
}

function backtrack(trace: Map<number, number>[], a: string, b: string): DiffOperation[] {
  const ops: DiffOperation[] = [];
  let x = a.length;
  let y = b.length;

  for (let d = trace.length - 2; d >= 0; d--) {
    const v = trace[d]!;
    const k = x - y;
    let prevK: number;

    if (k === -d || (k !== d && (v.get(k - 1) ?? 0) < (v.get(k + 1) ?? 0))) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }

    const prevX = v.get(prevK) ?? 0;
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      x--;
      y--;
    }

    if (d > 0) {
      if (x === prevX) {
        if (y > prevY) {
          y--;
          ops.push({ type: "insert", text: b[y], newStart: y, newEnd: y + 1 });
        }
      } else {
        x--;
        ops.push({ type: "delete", text: a[x], oldStart: x, oldEnd: x + 1 });
      }
    }
  }

  ops.reverse();

  return mergeOperations(ops, a, b);
}

function mergeOperations(ops: DiffOperation[], a: string, b: string): DiffOperation[] {
  if (ops.length === 0) return ops;

  const merged: DiffOperation[] = [];
  let current = ops[0]!;

  for (let i = 1; i < ops.length; i++) {
    const next = ops[i]!;
    if (next.type === current.type) {
      current = {
        type: current.type,
        text: current.text + next.text,
        oldStart: current.oldStart,
        oldEnd: next.oldEnd ?? (current.oldEnd ? current.oldEnd + next.text.length : undefined),
        newStart: current.newStart,
        newEnd: next.newEnd ?? (current.newEnd ? current.newEnd + next.text.length : undefined),
      };
    } else {
      merged.push(current);
      current = next;
    }
  }
  merged.push(current);

  let oldPos = 0;
  let newPos = 0;
  const finalOps: DiffOperation[] = [];

  for (const op of merged) {
    if (op.type === "equal") {
      finalOps.push({ ...op, oldStart: oldPos, oldEnd: oldPos + op.text.length, newStart: newPos, newPos: newPos + op.text.length });
      oldPos += op.text.length;
      newPos += op.text.length;
    } else if (op.type === "delete") {
      finalOps.push({ ...op, oldStart: oldPos, oldEnd: oldPos + op.text.length });
      oldPos += op.text.length;
    } else {
      finalOps.push({ ...op, newStart: newPos, newEnd: newPos + op.text.length });
      newPos += op.text.length;
    }
  }

  return finalOps;
}

// ---------------------------------------------------------------------------
// Line-level diff
// ---------------------------------------------------------------------------

function splitLines(text: string): string[] {
  const lines = text.split("\n");
  if (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

function lineDiff(oldText: string, newText: string): DiffOperation[] {
  return myersDiff(oldText, newText);
}

function inlineDiff(oldText: string, newText: string): InlineDiffSegment[] {
  const ops = myersDiff(oldText, newText);
  const segments: InlineDiffSegment[] = [];
  let oldPos = 0;
  let newPos = 0;

  for (const op of ops) {
    if (op.type === "equal") {
      segments.push({ type: "equal", text: op.text, start: oldPos, end: oldPos + op.text.length });
      oldPos += op.text.length;
      newPos += op.text.length;
    } else if (op.type === "delete") {
      segments.push({ type: "deletion", text: op.text, start: oldPos, end: oldPos + op.text.length });
      oldPos += op.text.length;
    } else {
      segments.push({ type: "addition", text: op.text, start: newPos, end: newPos + op.text.length });
      newPos += op.text.length;
    }
  }

  return segments;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function computeDiff(oldText: string, newText: string): DiffOperation[] {
  return myersDiff(oldText, newText);
}

export function computeInlineDiff(oldText: string, newText: string): InlineDiffSegment[] {
  return inlineDiff(oldText, newText);
}

export function computeBlockDiff(
  oldBlocks: { type: string; text: string }[],
  newBlocks: { type: string; text: string }[]
): BlockDiff[] {
  const oldJoined = oldBlocks.map((b) => b.text).join("\n");
  const newJoined = newBlocks.map((b) => b.text).join("\n");

  const ops = myersDiff(oldJoined, newJoined);
  const oldLines = splitLines(oldJoined);
  const newLines = splitLines(newJoined);

  const blockDiffs: BlockDiff[] = [];

  const maxBlocks = Math.max(oldBlocks.length, newBlocks.length);
  for (let i = 0; i < maxBlocks; i++) {
    const oldBlock = oldBlocks[i];
    const newBlock = newBlocks[i];
    const hasChanges = oldBlock?.text !== newBlock?.text || oldBlock?.type !== newBlock?.type;

    blockDiffs.push({
      blockIndex: i,
      blockType: newBlock?.type ?? oldBlock?.type ?? "unknown",
      operations: hasChanges
        ? lineDiff(oldBlock?.text ?? "", newBlock?.text ?? "")
        : [{ type: "equal", text: oldBlock?.text ?? "" }],
      hasChanges,
    });
  }

  return blockDiffs;
}

export function computeSideBySide(oldText: string, newText: string): SideBySideSegment[] {
  const oldLines = splitLines(oldText);
  const newLines = splitLines(newText);
  const segments: SideBySideSegment[] = [];

  let oldIdx = 0;
  let newIdx = 0;

  while (oldIdx < oldLines.length || newIdx < newLines.length) {
    const oldLine = oldIdx < oldLines.length ? oldLines[oldIdx] : undefined;
    const newLine = newIdx < newLines.length ? newLines[newIdx] : undefined;

    if (oldLine === undefined) {
      segments.push({
        left: "",
        right: newLine ?? "",
        type: "addition",
        leftLineStart: oldIdx,
        rightLineStart: newIdx,
      });
      newIdx++;
    } else if (newLine === undefined) {
      segments.push({
        left: oldLine,
        right: "",
        type: "deletion",
        leftLineStart: oldIdx,
        rightLineStart: newIdx,
      });
      oldIdx++;
    } else if (oldLine === newLine) {
      segments.push({
        left: oldLine,
        right: newLine,
        type: "equal",
        leftLineStart: oldIdx,
        rightLineStart: newIdx,
      });
      oldIdx++;
      newIdx++;
    } else {
      segments.push({
        left: oldLine,
        right: newLine,
        type: "modified",
        leftLineStart: oldIdx,
        rightLineStart: newIdx,
      });
      oldIdx++;
      newIdx++;
    }
  }

  return segments;
}

export function computeDiffStats(oldText: string, newText: string): DiffStats {
  const ops = myersDiff(oldText, newText);
  let additions = 0;
  let deletions = 0;
  let unchanged = 0;

  for (const op of ops) {
    if (op.type === "insert") additions += op.text.length;
    else if (op.type === "delete") deletions += op.text.length;
    else unchanged += op.text.length;
  }

  const total = additions + deletions + unchanged;
  const similarity = total > 0 ? unchanged / total : 1;

  return {
    additions,
    deletions,
    unchanged,
    totalLines: splitLines(newText).length,
    similarity,
  };
}

// ---------------------------------------------------------------------------
// Merge Conflict Detection
// ---------------------------------------------------------------------------

export function detectMergeConflicts(
  base: string,
  ours: string,
  theirs: string
): MergeConflict[] {
  const conflicts: MergeConflict[] = [];
  const baseLines = splitLines(base);
  const oursLines = splitLines(ours);
  const theirsLines = splitLines(theirs);

  const baseOps = lineDiff("", base);
  const oursOps = lineDiff("", ours);
  const theirsOps = lineDiff("", theirs);

  const maxLen = Math.max(baseLines.length, oursLines.length, theirsLines.length);

  let i = 0;
  while (i < maxLen) {
    const baseLine = baseLines[i];
    const oursLine = oursLines[i];
    const theirsLine = theirsLines[i];

    const baseChanged = baseLine !== undefined && (oursLine !== baseLine || theirsLine !== baseLine);
    const oursChanged = oursLine !== baseLine;
    const theirsChanged = theirsLine !== baseLine;

    if (oursChanged && theirsChanged && oursLine !== theirsLine) {
      let endI = i;
      while (
        endI < maxLen &&
        ((oursLines[endI] !== baseLines[endI]) || (theirsLines[endI] !== baseLines[endI]))
      ) {
        endI++;
      }

      const conflict: MergeConflict = {
        id: generateId(),
        startLine: i,
        endLine: endI - 1,
        baseText: baseLines.slice(i, endI).join("\n"),
        oursText: oursLines.slice(i, endI).join("\n"),
        theirsText: theirsLines.slice(i, endI).join("\n"),
        resolvedText: null,
        resolvedBy: null,
      };

      if (conflict.oursText === conflict.theirsText) {
        conflict.resolvedText = conflict.oursText;
      }

      conflicts.push(conflict);
      i = endI;
    } else {
      i++;
    }
  }

  return conflicts;
}

export function resolveConflict(
  conflict: MergeConflict,
  resolution: string,
  resolverId: string
): MergeConflict {
  return {
    ...conflict,
    resolvedText: resolution,
    resolvedBy: resolverId,
  };
}

export function threeWayMerge(input: ThreeWayMergeInput): MergeResult {
  const conflicts = detectMergeConflicts(input.base, input.ours, input.theirs);
  const autoResolvable = conflicts.filter((c) => c.resolvedText !== null).length;

  if (autoResolvable === conflicts.length) {
    const result = applyAutoResolution(input, conflicts);
    return { text: result, conflicts, resolved: true, autoResolvable };
  }

  return { text: "", conflicts, resolved: false, autoResolvable };
}

function applyAutoResolution(input: ThreeWayMergeInput, conflicts: MergeConflict[]): string {
  const oursLines = splitLines(input.ours);
  const theirsLines = splitLines(input.theirs);
  const result: string[] = [];

  let conflictIdx = 0;
  let lineIdx = 0;
  const allConflicts = conflicts;

  while (lineIdx < Math.max(oursLines.length, theirsLines.length)) {
    const conflict = allConflicts[conflictIdx];

    if (conflict && lineIdx === conflict.startLine) {
      const resolved = conflict.resolvedText ?? conflict.oursText;
      result.push(resolved);
      lineIdx = conflict.endLine + 1;
      conflictIdx++;
    } else {
      result.push(oursLines[lineIdx] ?? theirsLines[lineIdx] ?? "");
      lineIdx++;
    }
  }

  return result.join("\n");
}

export function applyMergeResolution(text: string, conflicts: MergeConflict[]): string {
  const lines = splitLines(text);
  const result: string[] = [];

  let conflictIdx = 0;
  let i = 0;

  while (i < lines.length) {
    const conflict = conflicts[conflictIdx];
    if (conflict && i === conflict.startLine) {
      result.push(conflict.resolvedText ?? conflict.oursText);
      i = conflict.endLine + 1;
      conflictIdx++;
    } else {
      result.push(lines[i]!);
      i++;
    }
  }

  return result.join("\n");
}

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}
