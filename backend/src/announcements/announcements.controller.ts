import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { Announcement } from './interfaces/announcement.interface';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  create(@Body() createAnnouncementDto: CreateAnnouncementDto): Announcement {
    return this.announcementsService.create(createAnnouncementDto);
  }

  @Get()
  findAll(): Announcement[] {
    return this.announcementsService.findAll();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ): Announcement {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }
}
