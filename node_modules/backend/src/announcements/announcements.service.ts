import { Injectable, NotFoundException } from '@nestjs/common';
import { Announcement } from './interfaces/announcement.interface';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AnnouncementsService {
  private announcements: Announcement[] = [];

  create(createAnnouncementDto: CreateAnnouncementDto): Announcement {
    const announcement: Announcement = {
      id: uuidv4(),
      title: createAnnouncementDto.title,
      description: createAnnouncementDto.description,
      status: 'active',
      createdAt: new Date(),
    };

    this.announcements.push(announcement);
    return announcement;
  }

  findAll(): Announcement[] {
    // Return announcements sorted by newest first
    return this.announcements.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  update(id: string, updateAnnouncementDto: UpdateAnnouncementDto): Announcement {
    const announcementIndex = this.announcements.findIndex(announcement => announcement.id === id);
    
    if (announcementIndex === -1) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    this.announcements[announcementIndex].status = updateAnnouncementDto.status;
    return this.announcements[announcementIndex];
  }
}
