import {
  IsDateString,
  IsDefined,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { TaskStatus } from '../types.js';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @ApiProperty({ required: false })
  title?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsOptional()
  @IsEnum(TaskStatus)
  @ApiProperty({ required: false })
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  @ApiProperty({ required: false })
  responsible?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  dueDate?: string;

  // Validate at least one field is provided for update
  @ValidateIf((dto: UpdateTaskDto) =>
    Object.values(dto).every((value) => value === undefined),
  )
  @IsDefined({ message: 'At least one editable field must be provided' })
  private readonly _atLeastOneField?: never;
}
