import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { Announcement } from './interfaces/announcement.interface';
import { Comment } from './interfaces/comment.interface';
import { Reaction } from './interfaces/reaction.interface';
import { AnnouncementSummary, ReactionBreakdown } from './interfaces/announcement-summary.interface';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateReactionDto } from './dto/create-reaction.dto';
import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';

@Injectable()
export class AnnouncementsService {
  private announcements: Announcement[] = [];
  private comments: Comment[] = [];
  private reactions: Reaction[] = [];
  private reactionCache: Map<string, Date> = new Map(); // For idempotency

  // New counter system: track unique users per reaction type per announcement
  private reactionCounters: Map<string, Map<string, Set<string>>> = new Map(); // announcementId -> reactionType -> Set of userIds

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

  findAllWithSummary(): { announcements: AnnouncementSummary[], etag: string } {
    const announcementSummaries: AnnouncementSummary[] = this.announcements.map(announcement => {
      const commentCount = this.comments.filter(c => c.announcementId === announcement.id).length;

      // Use the new counter system for more accurate counts
      const announcementCounters = this.reactionCounters.get(announcement.id);
      const reactions: ReactionBreakdown = {
        up: announcementCounters?.get('up')?.size || 0,
        down: announcementCounters?.get('down')?.size || 0,
        heart: announcementCounters?.get('heart')?.size || 0,
      };

      // Calculate lastActivityAt (latest among: createdAt, last comment, last reaction)
      const latestCommentTime = this.comments
        .filter(c => c.announcementId === announcement.id)
        .reduce((latest, comment) => comment.createdAt > latest ? comment.createdAt : latest, new Date(0));

      const announcementReactions = this.reactions.filter(r => r.announcementId === announcement.id);
      const latestReactionTime = announcementReactions
        .reduce((latest, reaction) => reaction.createdAt > latest ? reaction.createdAt : latest, new Date(0));

      const lastActivityAt = new Date(Math.max(
        announcement.createdAt.getTime(),
        latestCommentTime.getTime(),
        latestReactionTime.getTime()
      ));

      return {
        id: announcement.id,
        title: announcement.title,
        description: announcement.description,
        status: announcement.status,
        createdAt: announcement.createdAt,
        commentCount,
        reactions,
        lastActivityAt,
      };
    });

    // Sort by lastActivityAt (newest first)
    announcementSummaries.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());

    // Generate ETag based on all data
    const dataForHash = JSON.stringify({
      announcements: announcementSummaries.map(a => ({
        id: a.id,
        lastActivityAt: a.lastActivityAt.getTime(),
        commentCount: a.commentCount,
        reactions: a.reactions
      }))
    });
    const etag = `"${createHash('md5').update(dataForHash).digest('hex')}"`;

    return { announcements: announcementSummaries, etag };
  }

  update(id: string, updateAnnouncementDto: UpdateAnnouncementDto): Announcement {
    const announcementIndex = this.announcements.findIndex(announcement => announcement.id === id);
    
    if (announcementIndex === -1) {
      throw new NotFoundException(`Announcement with ID ${id} not found`);
    }

    this.announcements[announcementIndex].status = updateAnnouncementDto.status;
    return this.announcements[announcementIndex];
  }

  // Comments methods
  addComment(announcementId: string, createCommentDto: CreateCommentDto, userId?: string): Comment {
    // Check if announcement exists
    const announcement = this.announcements.find(a => a.id === announcementId);
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${announcementId} not found`);
    }

    // If userId is provided, check max comments limit (4 per user per announcement)
    if (userId) {
      const userComments = this.comments.filter(
        c => c.announcementId === announcementId && c.authorName === createCommentDto.authorName
      );

      if (userComments.length >= 4) {
        throw new ForbiddenException('Maximum 4 comments per user per announcement allowed');
      }
    }

    const comment: Comment = {
      id: uuidv4(),
      announcementId,
      authorName: createCommentDto.authorName,
      text: createCommentDto.text,
      createdAt: new Date(),
    };

    this.comments.push(comment);
    return comment;
  }

  getComments(announcementId: string, cursor?: string, limit: number = 10): { comments: Comment[], nextCursor?: string } {
    // Check if announcement exists
    const announcement = this.announcements.find(a => a.id === announcementId);
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${announcementId} not found`);
    }

    let announcementComments = this.comments
      .filter(comment => comment.announcementId === announcementId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Apply cursor pagination
    if (cursor) {
      const cursorIndex = announcementComments.findIndex(comment => comment.id === cursor);
      if (cursorIndex !== -1) {
        announcementComments = announcementComments.slice(cursorIndex + 1);
      }
    }

    // Apply limit
    const paginatedComments = announcementComments.slice(0, limit);
    const nextCursor = paginatedComments.length === limit ? paginatedComments[limit - 1].id : undefined;

    return {
      comments: paginatedComments,
      nextCursor
    };
  }

  deleteComment(announcementId: string, commentId: string, userId: string): void {
    // Check if announcement exists
    const announcement = this.announcements.find(a => a.id === announcementId);
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${announcementId} not found`);
    }

    // Find the comment
    const comment = this.comments.find(c => c.id === commentId && c.announcementId === announcementId);
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }

    // For demo purposes, we'll let users delete any comment.
    // In a real app, you'd typically check if the user owns the comment or is an admin
    // if (comment.userId !== userId) {
    //   throw new ForbiddenException('You can only delete your own comments');
    // }

    const initialLength = this.comments.length;
    this.comments = this.comments.filter(c => c.id !== commentId);

    if (this.comments.length === initialLength) {
      throw new NotFoundException(`Comment with ID ${commentId} not found`);
    }
  }

  getUserReaction(announcementId: string, userId: string): { reaction?: string } {
    // Check if announcement exists
    const announcement = this.announcements.find(a => a.id === announcementId);
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${announcementId} not found`);
    }

    const userReaction = this.reactions.find(
      r => r.announcementId === announcementId && r.userId === userId
    );

    return { reaction: userReaction?.type };
  }

  // Helper method to initialize counter for an announcement
  private initializeAnnouncementCounters(announcementId: string) {
    if (!this.reactionCounters.has(announcementId)) {
      const counters = new Map<string, Set<string>>();
      counters.set('up', new Set());
      counters.set('down', new Set());
      counters.set('heart', new Set());
      this.reactionCounters.set(announcementId, counters);
    }
  }

  // Simple pointer-based reaction system
  addReaction(announcementId: string, userId: string, createReactionDto: CreateReactionDto): Reaction {
    // Check if announcement exists
    const announcement = this.announcements.find(a => a.id === announcementId);
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${announcementId} not found`);
    }

    // Initialize counters for this announcement if not exists
    this.initializeAnnouncementCounters(announcementId);
    const counters = this.reactionCounters.get(announcementId)!;

    // Find user's current pointer (current reaction)
    const currentPointer = this.reactions.find(
      r => r.announcementId === announcementId && r.userId === userId
    );

    // Step 1: If user has a current pointer, decrease that counter by 1
    if (currentPointer) {
      counters.get(currentPointer.type)!.delete(userId);
      // Remove old reaction from array
      this.reactions = this.reactions.filter(
        r => !(r.announcementId === announcementId && r.userId === userId)
      );
    }

    // Step 2: Set pointer to new reaction type and increase counter by 1
    const now = new Date();
    const newReaction: Reaction = {
      id: uuidv4(),
      announcementId,
      userId,
      type: createReactionDto.type,
      createdAt: now,
    };

    // Add to counter (increase count by 1)
    counters.get(createReactionDto.type)!.add(userId);

    // Add to reactions array (set pointer)
    this.reactions.push(newReaction);

    return newReaction;
  }

  removeReaction(announcementId: string, userId: string): void {
    // Check if announcement exists
    const announcement = this.announcements.find(a => a.id === announcementId);
    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${announcementId} not found`);
    }

    // Initialize counters if needed
    this.initializeAnnouncementCounters(announcementId);
    const counters = this.reactionCounters.get(announcementId)!;

    // Find the user's current pointer (current reaction)
    const currentPointer = this.reactions.find(r =>
      r.announcementId === announcementId && r.userId === userId
    );

    if (!currentPointer) {
      throw new NotFoundException(`No reaction found for user ${userId} on announcement ${announcementId}`);
    }

    // Remove pointer: decrease counter by 1 and set pointer to nothing
    counters.get(currentPointer.type)!.delete(userId);

    // Remove from reactions array (pointer now points to nothing)
    this.reactions = this.reactions.filter(r =>
      !(r.announcementId === announcementId && r.userId === userId)
    );
  }
}
