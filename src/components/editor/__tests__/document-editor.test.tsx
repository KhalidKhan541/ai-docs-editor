import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { DocumentEditor } from '@/components/editor/document-editor'
import { Document, User } from '@/types'
import { createBlock } from '@/lib/editor/block-schema'

function makeDocument(overrides?: Partial<Document>): Document {
  return {
    id: 'doc-1',
    title: 'Test Document',
    blocks: [
      createBlock('paragraph', { id: 'b1', content: [{ text: 'Hello world', styles: {} }] }),
      createBlock('heading', { id: 'h1', content: [{ text: 'Title', styles: {} }], props: { level: 1 } }),
    ],
    ownerId: 'user-1',
    collaborators: [],
    versions: [],
    comments: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    isPublished: false,
    ...overrides,
  }
}

const mockUser: User = {
  id: 'user-1',
  name: 'Test User',
  email: 'test@test.com',
  role: 'editor',
}

describe('DocumentEditor', () => {
  it('renders the editor', () => {
    render(<DocumentEditor document={makeDocument()} user={mockUser} />)
    expect(screen.getByTestId('document-editor')).toBeInTheDocument()
  })

  it('renders all blocks', () => {
    render(<DocumentEditor document={makeDocument()} user={mockUser} />)
    expect(screen.getByTestId('block-b1')).toBeInTheDocument()
    expect(screen.getByTestId('block-h1')).toBeInTheDocument()
  })

  it('displays block content', () => {
    render(<DocumentEditor document={makeDocument()} user={mockUser} />)
    expect(screen.getByText('Hello world')).toBeInTheDocument()
    expect(screen.getByText('Title')).toBeInTheDocument()
  })

  it('shows save button in edit mode', () => {
    render(<DocumentEditor document={makeDocument()} user={mockUser} />)
    expect(screen.getByTestId('save-button')).toBeInTheDocument()
  })

  it('hides save button in read-only mode', () => {
    render(<DocumentEditor document={makeDocument()} user={mockUser} isReadOnly />)
    expect(screen.queryByTestId('save-button')).not.toBeInTheDocument()
  })

  it('calls onSave when save is clicked', () => {
    const onSave = jest.fn()
    render(<DocumentEditor document={makeDocument()} user={mockUser} onSave={onSave} />)
    fireEvent.click(screen.getByTestId('save-button'))
    expect(onSave).toHaveBeenCalled()
  })

  it('shows block controls on click', () => {
    render(<DocumentEditor document={makeDocument()} user={mockUser} />)
    fireEvent.click(screen.getByTestId('block-b1'))
    expect(screen.getByLabelText('Move up')).toBeInTheDocument()
    expect(screen.getByLabelText('Move down')).toBeInTheDocument()
    expect(screen.getByLabelText('Delete block')).toBeInTheDocument()
  })

  it('removes block when delete is clicked', () => {
    render(<DocumentEditor document={makeDocument()} user={mockUser} />)
    fireEvent.click(screen.getByTestId('block-b1'))
    fireEvent.click(screen.getByLabelText('Delete block'))
    expect(screen.queryByTestId('block-b1')).not.toBeInTheDocument()
  })

  it('moves block up', () => {
    render(<DocumentEditor document={makeDocument()} user={mockUser} />)
    fireEvent.click(screen.getByTestId('block-h1'))
    fireEvent.click(screen.getByLabelText('Move up'))
    const blocks = screen.getAllByTestId(/^block-/)
    expect(blocks[0]).toHaveAttribute('data-testid', 'block-h1')
  })

  it('shows contenteditable on blocks in edit mode', () => {
    render(<DocumentEditor document={makeDocument()} user={mockUser} />)
    const blockContent = screen.getByText('Hello world')
    expect(blockContent.closest('[contenteditable]')).toHaveAttribute('contenteditable', 'true')
  })

  it('does not show contenteditable in read-only mode', () => {
    render(<DocumentEditor document={makeDocument()} user={mockUser} isReadOnly />)
    const blockContent = screen.getByText('Hello world')
    expect(blockContent.closest('[contenteditable]')).toHaveAttribute('contenteditable', 'false')
  })

  it('handles Enter key to create new block', () => {
    render(<DocumentEditor document={makeDocument()} user={mockUser} />)
    const block = screen.getByTestId('block-b1').querySelector('[contenteditable]')!
    fireEvent.keyDown(block, { key: 'Enter' })
    const blocks = screen.getAllByTestId(/^block-/)
    expect(blocks).toHaveLength(3)
  })

  it('handles Backspace on empty block to remove it', () => {
    const doc = makeDocument({
      blocks: [
        createBlock('paragraph', { id: 'empty', content: [{ text: '', styles: {} }] }),
        createBlock('paragraph', { id: 'b1', content: [{ text: 'Keep', styles: {} }] }),
      ],
    })
    render(<DocumentEditor document={doc} user={mockUser} />)
    const emptyBlock = screen.getByTestId('block-empty').querySelector('[contenteditable]')!
    fireEvent.keyDown(emptyBlock, { key: 'Backspace' })
    expect(screen.queryByTestId('block-empty')).not.toBeInTheDocument()
  })

  it('updates block content on input', () => {
    const onSave = jest.fn()
    render(<DocumentEditor document={makeDocument()} user={mockUser} onSave={onSave} />)
    const block = screen.getByTestId('block-b1').querySelector('[contenteditable]')!
    fireEvent.input(block, { target: { textContent: 'Updated' } })
    fireEvent.click(screen.getByTestId('save-button'))
    expect(onSave).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ content: [{ text: 'Updated', styles: {} }] })])
    )
  })

  it('does not show controls in read-only mode', () => {
    render(<DocumentEditor document={makeDocument()} user={mockUser} isReadOnly />)
    fireEvent.click(screen.getByTestId('block-b1'))
    expect(screen.queryByLabelText('Move up')).not.toBeInTheDocument()
  })
})
