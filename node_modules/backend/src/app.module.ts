import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AnnouncementsModule } from './announcements/announcements.module';

@Module({
  imports: [AnnouncementsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
