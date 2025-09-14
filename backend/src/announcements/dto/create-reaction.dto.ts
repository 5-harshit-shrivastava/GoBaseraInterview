import { IsEnum, IsNotEmpty } from 'class-validator';

export class CreateReactionDto {
  @IsEnum(['up', 'down', 'heart'], { message: 'Reaction type must be one of: up, down, heart' })
  @IsNotEmpty()
  type: 'up' | 'down' | 'heart';
}