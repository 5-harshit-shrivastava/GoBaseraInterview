import { useEffect, useState } from 'react';
import { get, post, patch, getUserReaction, ApiError } from './lib/api';
import type { Announcement, CreateAnnouncementDto, ReactionType } from './types/announcement';
import Comments from './components/Comments';
import Reactions from './components/Reactions';
import './App.css';

export default function App() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [userReactions, setUserReactions] = useState<Record<string, ReactionType>>({});

  // Fetch announcements on component mount
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await get<Announcement[]>('/announcements');
      setAnnouncements(data);

      // Fetch user reactions for all announcements
      const reactions: Record<string, ReactionType> = {};
      for (const announcement of data) {
        try {
          const userReaction = await getUserReaction<{ reaction?: ReactionType }>(announcement.id);
          if (userReaction.reaction) {
            reactions[announcement.id] = userReaction.reaction;
          }
        } catch (err) {
          // Ignore errors for individual reactions
          console.warn(`Failed to fetch reaction for ${announcement.id}:`, err);
        }
      }
      setUserReactions(reactions);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Failed to fetch announcements: ${err.response.message}`);
      } else {
        setError('Failed to fetch announcements');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const errors: string[] = [];
    if (!title.trim()) {
      errors.push('Title is required');
    } else if (title.trim().length > 200) {
      errors.push('Title cannot exceed 200 characters');
    }

    if (description.trim().length > 1000) {
      errors.push('Description cannot exceed 1000 characters');
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      setValidationErrors([]);

      const newAnnouncement: CreateAnnouncementDto = {
        title: title.trim(),
        description: description.trim() || undefined,
      };

      await post<Announcement>('/announcements', newAnnouncement);

      // Reset form
      setTitle('');
      setDescription('');

      // Refresh announcements
      await fetchAnnouncements();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.response.code === 'VALIDATION_ERROR') {
          setValidationErrors(err.response.details || [err.response.message]);
        } else if (err.response.code === 'TOO_MANY_REQUESTS') {
          setError('Too many requests. Please wait before creating another announcement.');
        } else {
          setError(`Failed to create announcement: ${err.response.message}`);
        }
      } else {
        setError('Failed to create announcement');
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'active' | 'closed') => {
    try {
      setError('');
      await patch(`/announcements/${id}`, { status });

      // Update local state
      setAnnouncements((prev: Announcement[]) =>
        prev.map((announcement: Announcement) =>
          announcement.id === id ? { ...announcement, status } : announcement
        )
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Failed to update announcement: ${err.response.message}`);
      } else {
        setError('Failed to update announcement status');
      }
      console.error(err);
    }
  };

  const handleReactionChange = () => {
    // Refresh announcements to get updated reaction counts
    fetchAnnouncements();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="app">
      <div className="container">
        <h1>Residents Noticeboard</h1>
        
        {error && <div className="error">{error}</div>}
        {validationErrors.length > 0 && (
          <div className="validation-errors">
            <ul>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Add Announcement Form */}
        <section className="add-announcement">
          <h2>Add Announcement</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                type="text"
                placeholder="Required (max 200 characters)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                disabled={submitting}
                required
              />
              <div className="char-count">
                {title.length}/200
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                placeholder="Optional (max 1000 characters)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                disabled={submitting}
                rows={3}
              />
              <div className="char-count">
                {description.length}/1000
              </div>
            </div>
            
            <button
              type="submit"
              disabled={!title.trim() || submitting}
              className="submit-btn"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </section>

        {/* Announcements List */}
        <section className="announcements">
          <h2>Announcements</h2>
          
          {loading ? (
            <div className="loading">Loading announcements...</div>
          ) : announcements.length === 0 ? (
            <div className="no-announcements">No announcements yet</div>
          ) : (
            <div className="announcements-list">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="announcement-item">
                  <div className="announcement-content">
                    <div className="announcement-header">
                      <h3 className="announcement-title">{announcement.title}</h3>
                      <div className="announcement-actions">
                        {announcement.status === 'active' ? (
                          <button
                            onClick={() => handleStatusChange(announcement.id, 'closed')}
                            className="close-btn"
                          >
                            Close
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStatusChange(announcement.id, 'active')}
                            className="reopen-btn"
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="announcement-meta">
                      <span className={`status ${announcement.status}`}>
                        {announcement.status}
                      </span>
                      <span className="date">
                        Created: {formatDate(announcement.createdAt)}
                      </span>
                      <span className="date">
                        Last activity: {formatDate(announcement.lastActivityAt)}
                      </span>
                    </div>

                    {announcement.description && (
                      <p className="announcement-description">
                        {announcement.description}
                      </p>
                    )}

                    {/* Reactions Component */}
                    <Reactions
                      announcementId={announcement.id}
                      reactions={announcement.reactions}
                      onReactionChange={handleReactionChange}
                      userReaction={userReactions[announcement.id]}
                    />

                    {/* Comments Component */}
                    <Comments
                      announcementId={announcement.id}
                      commentCount={announcement.commentCount}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}