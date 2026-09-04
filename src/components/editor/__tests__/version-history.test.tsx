import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { VersionHistory } from '@/components/editor/version-history'
import { DocumentVersion } from '@/types'

function makeVersion(overrides?: Partial<DocumentVersion>): DocumentVersion {
  return {
    id: 'v1',
    documentId: 'doc-1',
    blocks: [],
    createdBy: 'user-1',
    message: 'Initial version',
    createdAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('VersionHistory', () => {
  const defaultProps = {
    versions: [
      makeVersion({ id: 'v1', message: 'First version', createdAt: '2024-01-01T00:00:00Z' }),
      makeVersion({ id: 'v2', message: 'Second version', createdAt: '2024-01-02T00:00:00Z' }),
    ],
    currentVersionId: 'v2',
    onRestore: jest.fn(),
    onCompare: jest.fn(),
    onClose: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the version history', () => {
    render(<VersionHistory {...defaultProps} />)
    expect(screen.getByTestId('version-history')).toBeInTheDocument()
  })

  it('displays versions', () => {
    render(<VersionHistory {...defaultProps} />)
    expect(screen.getByText('First version')).toBeInTheDocument()
    expect(screen.getByText('Second version')).toBeInTheDocument()
  })

  it('shows empty state when no versions', () => {
    render(<VersionHistory {...defaultProps} versions={[]} />)
    expect(screen.getByTestId('version-empty')).toBeInTheDocument()
  })

  it('renders list and compare view buttons', () => {
    render(<VersionHistory {...defaultProps} />)
    expect(screen.getByTestId('view-list')).toBeInTheDocument()
    expect(screen.getByTestId('view-compare')).toBeInTheDocument()
  })

  it('shows current badge for current version', () => {
    render(<VersionHistory {...defaultProps} />)
    expect(screen.getByTestId('current-badge')).toBeInTheDocument()
  })

  it('calls onRestore when restore clicked', () => {
    render(<VersionHistory {...defaultProps} />)
    fireEvent.click(screen.getByTestId('restore-v1'))
    expect(defaultProps.onRestore).toHaveBeenCalledWith('v1')
  })

  it('calls onClose when close clicked', () => {
    render(<VersionHistory {...defaultProps} />)
    fireEvent.click(screen.getByTestId('close-version-history'))
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('shows version metadata', () => {
    render(<VersionHistory {...defaultProps} />)
    expect(screen.getByText('user-1')).toBeInTheDocument()
    expect(screen.getByText('0 blocks')).toBeInTheDocument()
  })

  it('switches to compare mode', () => {
    render(<VersionHistory {...defaultProps} />)
    fireEvent.click(screen.getByTestId('view-compare'))
    expect(screen.queryByTestId('restore-v1')).not.toBeInTheDocument()
  })

  it('selects versions in compare mode', () => {
    render(<VersionHistory {...defaultProps} />)
    fireEvent.click(screen.getByTestId('view-compare'))
    fireEvent.click(screen.getByTestId('select-version-v1'))
    fireEvent.click(screen.getByTestId('select-version-v2'))
    expect(screen.getByTestId('compare-button')).toBeInTheDocument()
  })

  it('calls onCompare when compare button clicked', () => {
    render(<VersionHistory {...defaultProps} />)
    fireEvent.click(screen.getByTestId('view-compare'))
    fireEvent.click(screen.getByTestId('select-version-v1'))
    fireEvent.click(screen.getByTestId('select-version-v2'))
    fireEvent.click(screen.getByTestId('compare-button'))
    expect(defaultProps.onCompare).toHaveBeenCalledWith('v1', 'v2')
  })

  it('limits selection to 2 versions', () => {
    const props = {
      ...defaultProps,
      versions: [
        makeVersion({ id: 'v1' }),
        makeVersion({ id: 'v2' }),
        makeVersion({ id: 'v3' }),
      ],
    }
    render(<VersionHistory {...props} />)
    fireEvent.click(screen.getByTestId('view-compare'))
    fireEvent.click(screen.getByTestId('select-version-v1'))
    fireEvent.click(screen.getByTestId('select-version-v2'))
    fireEvent.click(screen.getByTestId('select-version-v3'))
    expect(screen.getByTestId('select-version-v1')).not.toBeChecked()
  })

  it('renders version stats', () => {
    render(<VersionHistory {...defaultProps} />)
    expect(screen.getByTestId('version-stats')).toBeInTheDocument()
    expect(screen.getByText('2 versions')).toBeInTheDocument()
  })

  it('displays contributor count', () => {
    const props = {
      ...defaultProps,
      versions: [
        makeVersion({ id: 'v1', createdBy: 'user-1' }),
        makeVersion({ id: 'v2', createdBy: 'user-2' }),
      ],
    }
    render(<VersionHistory {...props} />)
    expect(screen.getByText('2 contributors')).toBeInTheDocument()
  })

  it('sorts versions by date descending', () => {
    render(<VersionHistory {...defaultProps} />)
    const versionItems = screen.getAllByTestId(/^version-/)
    expect(versionItems[0]).toHaveAttribute('data-testid', 'version-v2')
    expect(versionItems[1]).toHaveAttribute('data-testid', 'version-v1')
  })
})
