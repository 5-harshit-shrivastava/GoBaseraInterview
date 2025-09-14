export interface ReactionBreakdown {
  up: number;
  down: number;
  heart: number;
}

export interface AnnouncementSummary {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'closed';
  createdAt: Date;
  commentCount: number;
  reactions: ReactionBreakdown;
  lastActivityAt: Date;
}