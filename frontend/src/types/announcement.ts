// Enhanced announcement with metadata
export interface Announcement {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'closed';
  createdAt: string;
  commentCount: number;
  reactions: ReactionBreakdown;
  lastActivityAt: string;
}

// Reaction breakdown
export interface ReactionBreakdown {
  up: number;
  down: number;
  heart: number;
}

// Individual comment
export interface Comment {
  id: string;
  announcementId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

// Comments response with pagination
export interface CommentsResponse {
  comments: Comment[];
  nextCursor?: string;
}

// Individual reaction
export interface Reaction {
  id: string;
  announcementId: string;
  userId: string;
  type: ReactionType;
  createdAt: string;
}

// Available reaction types
export type ReactionType = 'up' | 'down' | 'heart';

// DTOs
export interface CreateAnnouncementDto {
  title: string;
  description?: string;
}

export interface UpdateAnnouncementDto {
  status: 'active' | 'closed';
}

export interface CreateCommentDto {
  authorName: string;
  text: string;
}

export interface CreateReactionDto {
  type: ReactionType;
}
