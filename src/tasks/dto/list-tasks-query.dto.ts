import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { TaskStatus } from '../types.js';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ListTasksQueryDto {
  @IsOptional()
  @IsEnum(TaskStatus)
  @ApiPropertyOptional({
    enum: TaskStatus,
    enumName: 'TaskStatus',
    example: TaskStatus.Pending,
    default: TaskStatus.Pending,
  })
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  responsible?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @ApiPropertyOptional()
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  @ApiPropertyOptional()
  limit: number = 10;
}
