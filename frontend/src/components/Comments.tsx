import { useState, useEffect } from 'react';
import { getComments, postComment, deleteComment, ApiError } from '../lib/api';
import type { Comment, CommentsResponse, CreateCommentDto } from '../types/announcement';
import './Comments.css';

interface CommentsProps {
  announcementId: string;
  commentCount: number;
  onCommentCountChange?: (announcementId: string, newCount: number) => void;
}

export default function Comments({ announcementId, commentCount, onCommentCountChange }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [localCommentCount, setLocalCommentCount] = useState(commentCount);
  const [loading, setLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [authorName, setAuthorName] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Update local state when props change (to handle external updates)
  useEffect(() => {
    setLocalCommentCount(commentCount);
  }, [commentCount]);

  const fetchComments = async (cursor?: string) => {
    if (!showComments) return;

    try {
      setLoading(true);
      setError('');
      const response = await getComments<CommentsResponse>(announcementId, cursor);

      if (cursor) {
        // If this is loading more, append to existing comments
        setComments(prev => [...prev, ...response.comments]);
      } else {
        // If this is initial load, replace all comments
        setComments(response.comments);
      }

      setNextCursor(response.nextCursor);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Failed to load comments: ${err.response.message}`);
      } else {
        setError('Failed to load comments');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreComments = async () => {
    if (nextCursor && !loading) {
      await fetchComments(nextCursor);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (deletingCommentId) return; // Prevent multiple deletes

    // Find comment to delete before the try block
    const commentToDelete = comments.find(c => c.id === commentId);
    if (!commentToDelete) return;

    try {
      setDeletingCommentId(commentId);
      setError('');

      // Optimistic update - remove immediately
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      const newCount = localCommentCount - 1;
      setLocalCommentCount(newCount);
      onCommentCountChange?.(announcementId, newCount);

      await deleteComment(announcementId, commentId);
    } catch (err) {
      // Revert optimistic update on error
      setComments(prev => [...prev, commentToDelete].sort((a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ));
      setLocalCommentCount(localCommentCount);
      onCommentCountChange?.(announcementId, localCommentCount);

      if (err instanceof ApiError) {
        setError(`Failed to delete comment: ${err.response.message}`);
      } else {
        setError('Failed to delete comment');
      }
      console.error(err);
    } finally {
      setDeletingCommentId(null);
    }
  };

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, announcementId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!authorName.trim() || !commentText.trim()) {
      setError('Both name and comment are required');
      return;
    }

    // Create optimistic comment for immediate UI feedback
    const optimisticComment: Comment = {
      id: `temp-${Date.now()}`,
      authorName: authorName.trim(),
      text: commentText.trim(),
      createdAt: new Date().toISOString(),
      announcementId: announcementId
    };

    try {
      setSubmitting(true);
      setError('');

      // Add optimistic comment immediately
      setComments(prev => [...prev, optimisticComment]);
      const newCount = localCommentCount + 1;
      setLocalCommentCount(newCount);
      onCommentCountChange?.(announcementId, newCount);

      // Reset form immediately for better UX
      const formData = {
        authorName: authorName.trim(),
        text: commentText.trim()
      };
      setAuthorName('');
      setCommentText('');
      setShowAddForm(false);

      const newComment: CreateCommentDto = {
        authorName: formData.authorName,
        text: formData.text,
      };

      const serverComment = await postComment<Comment>(announcementId, newComment);

      // Replace optimistic comment with server response
      setComments(prev =>
        prev.map(comment =>
          comment.id === optimisticComment.id ? serverComment : comment
        )
      );
    } catch (err) {
      // Revert optimistic update on error
      setComments(prev => prev.filter(comment => comment.id !== optimisticComment.id));
      setLocalCommentCount(localCommentCount);
      onCommentCountChange?.(announcementId, localCommentCount);

      // Restore form data on error
      setAuthorName(optimisticComment.authorName);
      setCommentText(optimisticComment.text);
      setShowAddForm(true);
      if (err instanceof ApiError) {
        // Handle specific API errors
        switch (err.response.code) {
          case 'VALIDATION_ERROR':
            setError(`Validation error: ${err.response.details?.join(', ') || err.response.message}`);
            break;
          case 'FORBIDDEN':
            setError(err.response.message); // Max 4 comments limit
            break;
          case 'TOO_MANY_REQUESTS':
            setError('Too many requests. Please wait before adding another comment.');
            break;
          default:
            setError(`Error: ${err.response.message}`);
        }
      } else {
        setError('Failed to add comment');
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="comments-section">
      <div className="comments-header">
        <button
          className="comments-toggle"
          onClick={() => setShowComments(!showComments)}
        >
          💬 {localCommentCount} {localCommentCount === 1 ? 'Comment' : 'Comments'}
          <span className="toggle-icon">{showComments ? '▲' : '▼'}</span>
        </button>
      </div>

      {showComments && (
        <div className="comments-content">
          {error && <div className="error-message">{error}</div>}

          {/* Add Comment Form */}
          <div className="add-comment-section">
            {!showAddForm ? (
              <button
                className="show-add-form-btn"
                onClick={() => setShowAddForm(true)}
              >
                + Add Comment
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="add-comment-form">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Your name (max 50 chars)"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    maxLength={50}
                    disabled={submitting}
                    required
                  />
                </div>
                <div className="form-group">
                  <textarea
                    placeholder="Add your comment (max 500 chars)..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    maxLength={500}
                    rows={3}
                    disabled={submitting}
                    required
                  />
                  <div className="char-count">
                    {commentText.length}/500
                  </div>
                </div>
                <div className="form-actions">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setAuthorName('');
                      setCommentText('');
                      setError('');
                    }}
                    disabled={submitting}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!authorName.trim() || !commentText.trim() || submitting}
                    className="submit-btn"
                  >
                    {submitting ? 'Adding...' : 'Add Comment'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Comments List */}
          <div className="comments-list">
            {loading ? (
              <div className="loading">Loading comments...</div>
            ) : comments.length === 0 ? (
              <div className="no-comments">No comments yet</div>
            ) : (
              <>
                {comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-header">
                      <div className="comment-header-left">
                        <span className="comment-author">{comment.authorName}</span>
                        <span className="comment-date">{formatDate(comment.createdAt)}</span>
                      </div>
                      <button
                        className="delete-comment-btn"
                        onClick={() => handleDeleteComment(comment.id)}
                        disabled={deletingCommentId === comment.id}
                        title="Delete comment"
                      >
                        {deletingCommentId === comment.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                    <div className="comment-text">{comment.text}</div>
                  </div>
                ))}
                {nextCursor && (
                  <button
                    className="load-more-btn"
                    onClick={loadMoreComments}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}