import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnnouncementsModule } from './announcements/announcements.module';

@Module({
  imports: [
    // Global rate limiting: 60 requests per minute per IP
    ThrottlerModule.forRoot([{
      ttl: 60000, // Time to live: 60 seconds
      limit: 60, // Maximum number of requests within TTL
    }]),
    AnnouncementsModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
