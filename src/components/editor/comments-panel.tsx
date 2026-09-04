'use client'

import React, { useState } from 'react'
import { Comment } from '@/types'

interface CommentsPanelProps {
  comments: Comment[]
  currentUserId: string
  onAddComment?: (blockId: string, content: string) => void
  onReply?: (commentId: string, content: string) => void
  onResolve?: (commentId: string) => void
  onDelete?: (commentId: string) => void
  onNavigateToBlock?: (blockId: string) => void
}

export function CommentsPanel({
  comments,
  currentUserId,
  onAddComment,
  onReply,
  onResolve,
  onDelete,
  onNavigateToBlock,
}: CommentsPanelProps) {
  const [newComment, setNewComment] = useState('')
  const [selectedBlockId, setSelectedBlockId] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all')

  const filteredComments = comments.filter((c) => {
    if (filter === 'open') return !c.resolved
    if (filter === 'resolved') return c.resolved
    return true
  })

  const handleAddComment = () => {
    if (!newComment.trim() || !selectedBlockId) return
    onAddComment?.(selectedBlockId, newComment.trim())
    setNewComment('')
    setSelectedBlockId('')
  }

  const handleReply = (commentId: string) => {
    if (!replyContent.trim()) return
    onReply?.(commentId, replyContent.trim())
    setReplyContent('')
    setReplyingTo(null)
  }

  return (
    <div className="comments-panel" data-testid="comments-panel">
      <div className="comments-header">
        <h3>Comments</h3>
        <div className="comments-filter">
          <button
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
            data-testid="filter-all"
          >
            All
          </button>
          <button
            className={filter === 'open' ? 'active' : ''}
            onClick={() => setFilter('open')}
            data-testid="filter-open"
          >
            Open
          </button>
          <button
            className={filter === 'resolved' ? 'active' : ''}
            onClick={() => setFilter('resolved')}
            data-testid="filter-resolved"
          >
            Resolved
          </button>
        </div>
      </div>

      <div className="comments-list">
        {filteredComments.length === 0 && (
          <div className="comments-empty" data-testid="comments-empty">
            No comments
          </div>
        )}
        {filteredComments.map((comment) => (
          <div
            key={comment.id}
            className={`comment ${comment.resolved ? 'resolved' : ''}`}
            data-testid={`comment-${comment.id}`}
          >
            <div className="comment-header">
              <span className="comment-user">{comment.userId}</span>
              <span className="comment-date">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className="comment-block-link">
              <button
                onClick={() => onNavigateToBlock?.(comment.blockId)}
                data-testid={`navigate-block-${comment.id}`}
              >
                Go to block
              </button>
            </div>
            <div className="comment-content">{comment.content}</div>
            <div className="comment-actions">
              {!comment.resolved && (
                <button
                  onClick={() => onResolve?.(comment.id)}
                  data-testid={`resolve-comment-${comment.id}`}
                >
                  Resolve
                </button>
              )}
              {comment.userId === currentUserId && (
                <button
                  onClick={() => onDelete?.(comment.id)}
                  data-testid={`delete-comment-${comment.id}`}
                >
                  Delete
                </button>
              )}
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                data-testid={`reply-btn-${comment.id}`}
              >
                Reply
              </button>
            </div>
            {comment.replies.length > 0 && (
              <div className="comment-replies">
                {comment.replies.map((reply) => (
                  <div key={reply.id} className="comment-reply" data-testid={`reply-${reply.id}`}>
                    <div className="reply-header">
                      <span>{reply.userId}</span>
                      <span>{new Date(reply.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="reply-content">{reply.content}</div>
                  </div>
                ))}
              </div>
            )}
            {replyingTo === comment.id && (
              <div className="reply-form" data-testid={`reply-form-${comment.id}`}>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  data-testid={`reply-input-${comment.id}`}
                />
                <button
                  onClick={() => handleReply(comment.id)}
                  disabled={!replyContent.trim()}
                  data-testid={`submit-reply-${comment.id}`}
                >
                  Reply
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="comment-form">
        <select
          value={selectedBlockId}
          onChange={(e) => setSelectedBlockId(e.target.value)}
          data-testid="comment-block-select"
        >
          <option value="">Select block...</option>
          <option value="block-1">Block 1</option>
          <option value="block-2">Block 2</option>
        </select>
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add a comment..."
          data-testid="comment-input"
        />
        <button
          onClick={handleAddComment}
          disabled={!newComment.trim() || !selectedBlockId}
          data-testid="submit-comment"
        >
          Add Comment
        </button>
      </div>
    </div>
  )
}
