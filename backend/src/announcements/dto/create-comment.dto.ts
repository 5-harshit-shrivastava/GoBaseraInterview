import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Author name must be at least 1 character long' })
  @MaxLength(50, { message: 'Author name cannot exceed 50 characters' })
  authorName: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Comment text must be at least 1 character long' })
  @MaxLength(500, { message: 'Comment text cannot exceed 500 characters' })
  text: string;
}