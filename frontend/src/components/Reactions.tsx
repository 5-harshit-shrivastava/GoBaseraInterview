import { useState, useEffect } from 'react';
import { postReaction, deleteReaction, ApiError } from '../lib/api';
import type { ReactionBreakdown, ReactionType, Reaction, CreateReactionDto } from '../types/announcement';
import './Reactions.css';

interface ReactionsProps {
  announcementId: string;
  reactions: ReactionBreakdown;
  onReactionChange: (announcementId: string, newUserReaction: ReactionType | undefined, newReactionCounts: Record<string, number>) => void;
  userReaction?: ReactionType; // Optional: the user's current reaction
}

const REACTION_EMOJIS: Record<ReactionType, string> = {
  up: '👍',
  down: '👎',
  heart: '❤️',
};

const REACTION_LABELS: Record<ReactionType, string> = {
  up: 'Like',
  down: 'Dislike',
  heart: 'Love',
};

export default function Reactions({ announcementId, reactions, onReactionChange, userReaction }: ReactionsProps) {
  const [loading, setLoading] = useState<ReactionType | null>(null);
  const [error, setError] = useState('');
  const [localReactions, setLocalReactions] = useState(reactions);
  const [localUserReaction, setLocalUserReaction] = useState(userReaction);

  // Update local state when props change (to handle external updates)
  useEffect(() => {
    setLocalReactions(reactions);
  }, [reactions]);

  useEffect(() => {
    setLocalUserReaction(userReaction);
  }, [userReaction]);

  const handleReaction = async (type: ReactionType) => {
    try {
      setLoading(type);
      setError('');

      // Calculate optimistic updates
      const newLocalReactions = { ...localReactions };
      let newUserReaction: ReactionType | undefined;

      // Remove previous reaction if exists
      if (localUserReaction) {
        newLocalReactions[localUserReaction] = Math.max(0, newLocalReactions[localUserReaction] - 1);
      }

      // Toggle logic: if already selected, toggle off; otherwise toggle on
      if (localUserReaction === type) {
        // Toggle OFF - remove current reaction
        newUserReaction = undefined;
        await deleteReaction(announcementId);
      } else {
        // Toggle ON or SWITCH - set new reaction
        newUserReaction = type;
        newLocalReactions[type] = newLocalReactions[type] + 1;
        const reactionData: CreateReactionDto = { type };
        await postReaction<Reaction>(announcementId, reactionData);
      }

      // Update local state immediately for instant UI feedback
      setLocalReactions(newLocalReactions);
      setLocalUserReaction(newUserReaction);

      // Notify parent with the new state
      onReactionChange(announcementId, newUserReaction, newLocalReactions);
    } catch (err) {
      if (err instanceof ApiError) {
        switch (err.response.code) {
          case 'BAD_REQUEST':
            setError(`Error: ${err.response.message}`);
            break;
          case 'FORBIDDEN':
            setError(err.response.message);
            break;
          case 'VALIDATION_ERROR':
            setError(`Invalid reaction: ${err.response.details?.join(', ') || err.response.message}`);
            break;
          case 'TOO_MANY_REQUESTS':
            setError('Too many requests. Please wait before reacting again.');
            break;
          case 'NOT_FOUND':
            setError('No reaction to remove');
            break;
          default:
            setError(`Error: ${err.response.message}`);
        }
      } else {
        setError('Failed to process reaction');
      }
      console.error(err);

      // Clear error after 3 seconds
      setTimeout(() => setError(''), 3000);
    } finally {
      setLoading(null);
    }
  };


  const getTotalReactions = () => {
    return localReactions.up + localReactions.down + localReactions.heart;
  };

  const getReactionCount = (type: ReactionType) => {
    return localReactions[type];
  };

  const isLoading = (type: ReactionType) => {
    return loading === type;
  };

  return (
    <div className="reactions-section">
      {error && <div className="reaction-error">{error}</div>}

      <div className="reactions-container">
        {(Object.keys(REACTION_EMOJIS) as ReactionType[]).map((type) => (
          <button
            key={type}
            className={`reaction-btn ${localUserReaction === type ? 'reaction-on' : 'reaction-off'}`}
            onClick={() => handleReaction(type)}
            disabled={isLoading(type)}
            title={`${localUserReaction === type ? `Remove ${REACTION_LABELS[type]}` : `${REACTION_LABELS[type]} this announcement`}`}
          >
            <span className="reaction-emoji">
              {REACTION_EMOJIS[type]}
            </span>
            {isLoading(type) && <span className="reaction-loading">⏳</span>}
          </button>
        ))}
      </div>

      {getTotalReactions() > 0 && (
        <div className="reactions-summary">
          <div className="reaction-totals">
            {localReactions.up > 0 && (
              <span className="reaction-total">
                👍 {localReactions.up} {localReactions.up === 1 ? 'Like' : 'Likes'}
              </span>
            )}
            {localReactions.down > 0 && (
              <span className="reaction-total">
                👎 {localReactions.down} {localReactions.down === 1 ? 'Dislike' : 'Dislikes'}
              </span>
            )}
            {localReactions.heart > 0 && (
              <span className="reaction-total">
                ❤️ {localReactions.heart} {localReactions.heart === 1 ? 'Love' : 'Loves'}
              </span>
            )}
          </div>
          <span className="total-reactions">
            Total: {getTotalReactions()} {getTotalReactions() === 1 ? 'reaction' : 'reactions'}
          </span>
        </div>
      )}
    </div>
  );
}