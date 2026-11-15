import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TaskStatus } from '../types.js';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @IsString()
  @MaxLength(150)
  @ApiProperty()
  title: string;

  @IsOptional()
  @IsString()
  @ApiProperty()
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  @ApiPropertyOptional({
    enum: TaskStatus,
    enumName: 'TaskStatus',
    example: TaskStatus.Pending,
    default: TaskStatus.Pending,
  })
  status: TaskStatus = TaskStatus.Pending;

  @IsString()
  @MaxLength(150)
  @ApiProperty()
  responsible: string;

  @IsDateString({ strict: true })
  @ApiProperty({
    type: String,
    format: 'date-time',
    example: '2026-12-01T10:00:00.000Z',
  })
  dueDate: string;
}
