import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateAnnouncementDto {
  @IsEnum(['active', 'closed'], { message: 'Status must be either active or closed' })
  @IsNotEmpty()
  status: 'active' | 'closed';
}
