import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommentsPanel } from '@/components/editor/comments-panel'
import { Comment } from '@/types'

function makeComment(overrides?: Partial<Comment>): Comment {
  return {
    id: 'comment-1',
    documentId: 'doc-1',
    blockId: 'block-1',
    userId: 'user-1',
    content: 'This is a comment',
    resolved: false,
    replies: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('CommentsPanel', () => {
  const defaultProps = {
    comments: [makeComment()],
    currentUserId: 'user-1',
    onAddComment: jest.fn(),
    onReply: jest.fn(),
    onResolve: jest.fn(),
    onDelete: jest.fn(),
    onNavigateToBlock: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders the comments panel', () => {
    render(<CommentsPanel {...defaultProps} />)
    expect(screen.getByTestId('comments-panel')).toBeInTheDocument()
  })

  it('displays comments', () => {
    render(<CommentsPanel {...defaultProps} />)
    expect(screen.getByText('This is a comment')).toBeInTheDocument()
  })

  it('shows empty state when no comments', () => {
    render(<CommentsPanel {...defaultProps} comments={[]} />)
    expect(screen.getByTestId('comments-empty')).toBeInTheDocument()
  })

  it('renders filter buttons', () => {
    render(<CommentsPanel {...defaultProps} />)
    expect(screen.getByTestId('filter-all')).toBeInTheDocument()
    expect(screen.getByTestId('filter-open')).toBeInTheDocument()
    expect(screen.getByTestId('filter-resolved')).toBeInTheDocument()
  })

  it('filters by open status', () => {
    const comments = [
      makeComment({ id: 'c1', resolved: false }),
      makeComment({ id: 'c2', resolved: true }),
    ]
    render(<CommentsPanel {...defaultProps} comments={comments} />)
    fireEvent.click(screen.getByTestId('filter-open'))
    expect(screen.getByTestId('comment-c1')).toBeInTheDocument()
    expect(screen.queryByTestId('comment-c2')).not.toBeInTheDocument()
  })

  it('filters by resolved status', () => {
    const comments = [
      makeComment({ id: 'c1', resolved: false }),
      makeComment({ id: 'c2', resolved: true }),
    ]
    render(<CommentsPanel {...defaultProps} comments={comments} />)
    fireEvent.click(screen.getByTestId('filter-resolved'))
    expect(screen.queryByTestId('comment-c1')).not.toBeInTheDocument()
    expect(screen.getByTestId('comment-c2')).toBeInTheDocument()
  })

  it('calls onResolve when resolve clicked', () => {
    render(<CommentsPanel {...defaultProps} />)
    fireEvent.click(screen.getByTestId('resolve-comment-comment-1'))
    expect(defaultProps.onResolve).toHaveBeenCalledWith('comment-1')
  })

  it('calls onDelete when delete clicked', () => {
    render(<CommentsPanel {...defaultProps} />)
    fireEvent.click(screen.getByTestId('delete-comment-comment-1'))
    expect(defaultProps.onDelete).toHaveBeenCalledWith('comment-1')
  })

  it('calls onNavigateToBlock', () => {
    render(<CommentsPanel {...defaultProps} />)
    fireEvent.click(screen.getByTestId('navigate-block-comment-1'))
    expect(defaultProps.onNavigateToBlock).toHaveBeenCalledWith('block-1')
  })

  it('shows reply form when reply clicked', () => {
    render(<CommentsPanel {...defaultProps} />)
    fireEvent.click(screen.getByTestId('reply-btn-comment-1'))
    expect(screen.getByTestId('reply-form-comment-1')).toBeInTheDocument()
  })

  it('calls onReply when reply submitted', () => {
    render(<CommentsPanel {...defaultProps} />)
    fireEvent.click(screen.getByTestId('reply-btn-comment-1'))
    fireEvent.change(screen.getByTestId('reply-input-comment-1'), {
      target: { value: 'Great point!' },
    })
    fireEvent.click(screen.getByTestId('submit-reply-comment-1'))
    expect(defaultProps.onReply).toHaveBeenCalledWith('comment-1', 'Great point!')
  })

  it('calls onAddComment when comment submitted', () => {
    render(<CommentsPanel {...defaultProps} />)
    fireEvent.change(screen.getByTestId('comment-input'), {
      target: { value: 'New comment' },
    })
    fireEvent.change(screen.getByTestId('comment-block-select'), {
      target: { value: 'block-1' },
    })
    fireEvent.click(screen.getByTestId('submit-comment'))
    expect(defaultProps.onAddComment).toHaveBeenCalledWith('block-1', 'New comment')
  })

  it('disables submit when content is empty', () => {
    render(<CommentsPanel {...defaultProps} />)
    expect(screen.getByTestId('submit-comment')).toBeDisabled()
  })

  it('disables submit when no block selected', () => {
    render(<CommentsPanel {...defaultProps} />)
    fireEvent.change(screen.getByTestId('comment-input'), {
      target: { value: 'Comment' },
    })
    expect(screen.getByTestId('submit-comment')).toBeDisabled()
  })

  it('renders comment author and date', () => {
    render(<CommentsPanel {...defaultProps} />)
    expect(screen.getByText('user-1')).toBeInTheDocument()
  })

  it('renders replies', () => {
    const comment = makeComment({
      replies: [
        {
          id: 'reply-1',
          userId: 'user-2',
          content: 'Reply content',
          createdAt: '2024-01-02T00:00:00Z',
        },
      ],
    })
    render(<CommentsPanel {...defaultProps} comments={[comment]} />)
    expect(screen.getByTestId('reply-reply-1')).toBeInTheDocument()
    expect(screen.getByText('Reply content')).toBeInTheDocument()
  })

  it('hides delete button for other users comments', () => {
    const comment = makeComment({ userId: 'other-user' })
    render(<CommentsPanel {...defaultProps} comments={[comment]} />)
    expect(screen.queryByTestId('delete-comment-comment-1')).not.toBeInTheDocument()
  })
})
