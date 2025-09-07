export interface Announcement {
  id: string;
  title: string;
  description?: string;
  status: 'active' | 'closed';
  createdAt: string;
}

export interface CreateAnnouncementDto {
  title: string;
  description?: string;
}

export interface UpdateAnnouncementDto {
  status: 'active' | 'closed';
}
