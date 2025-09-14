export interface Reaction {
  id: string;
  announcementId: string;
  userId: string;
  type: 'up' | 'down' | 'heart';
  createdAt: Date;
}