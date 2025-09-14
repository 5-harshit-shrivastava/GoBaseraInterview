import { Controller, Get, Post, Patch, Delete, Body, Param, Query, Headers, HttpCode, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { Announcement } from './interfaces/announcement.interface';
import { AnnouncementSummary } from './interfaces/announcement-summary.interface';
import { Comment } from './interfaces/comment.interface';
import { Reaction } from './interfaces/reaction.interface';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Post()
  create(@Body() createAnnouncementDto: CreateAnnouncementDto): Announcement {
    return this.announcementsService.create(createAnnouncementDto);
  }

  @Get()
  findAll(
    @Headers('if-none-match') ifNoneMatch: string,
    @Res() res: Response,
  ): Response<AnnouncementSummary[]> | void {
    const { announcements, etag } = this.announcementsService.findAllWithSummary();

    // Check if client has cached version
    if (ifNoneMatch && ifNoneMatch === etag) {
      return res.status(304).end(); // Not Modified
    }

    // Set ETag header and return data
    res.setHeader('ETag', etag);
    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 60 seconds
    return res.json(announcements);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateAnnouncementDto: UpdateAnnouncementDto,
  ): Announcement {
    return this.announcementsService.update(id, updateAnnouncementDto);
  }

  // Comments endpoints
  @Post(':id/comments')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 comments per minute per IP
  addComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @Headers('x-user-id') userId?: string,
  ): Comment {
    return this.announcementsService.addComment(id, createCommentDto, userId);
  }

  @Get(':id/comments')
  getComments(
    @Param('id') id: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit: string = '10',
  ): { comments: Comment[], nextCursor?: string } {
    const limitNum = parseInt(limit, 10);
    return this.announcementsService.getComments(id, cursor, limitNum);
  }

  @Get(':id/user-reaction')
  getUserReaction(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ): { reaction?: string } {
    if (!userId) {
      return { reaction: undefined };
    }
    return this.announcementsService.getUserReaction(id, userId);
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(204)
  deleteComment(
    @Param('id') id: string,
    @Param('commentId') commentId: string,
    @Headers('x-user-id') userId: string,
  ): void {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }
    return this.announcementsService.deleteComment(id, commentId, userId);
  }

  // Reactions endpoints
  @Post(':id/reactions')
  addReaction(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
    @Body() createReactionDto: CreateReactionDto,
  ): Reaction {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }
    return this.announcementsService.addReaction(id, userId, createReactionDto);
  }

  @Delete(':id/reactions')
  @HttpCode(204)
  removeReaction(
    @Param('id') id: string,
    @Headers('x-user-id') userId: string,
  ): void {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }
    return this.announcementsService.removeReaction(id, userId);
  }
}
