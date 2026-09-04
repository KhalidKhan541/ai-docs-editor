'use client'

import React, { useState } from 'react'
import { DocumentVersion } from '@/types'

interface VersionHistoryProps {
  versions: DocumentVersion[]
  currentVersionId?: string
  onRestore?: (versionId: string) => void
  onCompare?: (versionId1: string, versionId2: string) => void
  onClose?: () => void
}

export function VersionHistory({
  versions,
  currentVersionId,
  onRestore,
  onCompare,
  onClose,
}: VersionHistoryProps) {
  const [selectedVersions, setSelectedVersions] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'compare'>('list')

  const sortedVersions = [...versions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const handleSelectVersion = (versionId: string) => {
    if (viewMode === 'compare') {
      setSelectedVersions((prev) => {
        if (prev.includes(versionId)) {
          return prev.filter((id) => id !== versionId)
        }
        if (prev.length >= 2) return [prev[1]!, versionId]
        return [...prev, versionId]
      })
    }
  }

  const handleCompare = () => {
    if (selectedVersions.length === 2) {
      onCompare?.(selectedVersions[0]!, selectedVersions[1]!)
    }
  }

  return (
    <div className="version-history" data-testid="version-history">
      <div className="version-history-header">
        <h3>Version History</h3>
        <div className="version-history-controls">
          <button
            className={viewMode === 'list' ? 'active' : ''}
            onClick={() => {
              setViewMode('list')
              setSelectedVersions([])
            }}
            data-testid="view-list"
          >
            List
          </button>
          <button
            className={viewMode === 'compare' ? 'active' : ''}
            onClick={() => setViewMode('compare')}
            data-testid="view-compare"
          >
            Compare
          </button>
          {onClose && (
            <button onClick={onClose} data-testid="close-version-history">
              ×
            </button>
          )}
        </div>
      </div>

      {viewMode === 'compare' && selectedVersions.length === 2 && (
        <button
          className="compare-button"
          onClick={handleCompare}
          data-testid="compare-button"
        >
          Compare Selected
        </button>
      )}

      <div className="version-list">
        {sortedVersions.length === 0 && (
          <div className="version-empty" data-testid="version-empty">
            No versions yet
          </div>
        )}
        {sortedVersions.map((version) => (
          <div
            key={version.id}
            className={`version-item ${
              version.id === currentVersionId ? 'current' : ''
            } ${selectedVersions.includes(version.id) ? 'selected' : ''}`}
            onClick={() => handleSelectVersion(version.id)}
            data-testid={`version-${version.id}`}
          >
            <div className="version-info">
              <div className="version-message">{version.message}</div>
              <div className="version-meta">
                <span className="version-author">{version.createdBy}</span>
                <span className="version-date">
                  {new Date(version.createdAt).toLocaleString()}
                </span>
                <span className="version-blocks">
                  {version.blocks.length} blocks
                </span>
              </div>
            </div>
            {viewMode === 'list' && (
              <div className="version-actions">
                {version.id !== currentVersionId && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRestore?.(version.id)
                    }}
                    data-testid={`restore-${version.id}`}
                  >
                    Restore
                  </button>
                )}
                {version.id === currentVersionId && (
                  <span className="current-badge" data-testid="current-badge">
                    Current
                  </span>
                )}
              </div>
            )}
            {viewMode === 'compare' && (
              <input
                type="checkbox"
                checked={selectedVersions.includes(version.id)}
                onChange={() => handleSelectVersion(version.id)}
                data-testid={`select-version-${version.id}`}
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        ))}
      </div>

      <div className="version-stats" data-testid="version-stats">
        <span>{versions.length} versions</span>
        <span>
          {new Set(versions.map((v) => v.createdBy)).size} contributors
        </span>
      </div>
    </div>
  )
}
