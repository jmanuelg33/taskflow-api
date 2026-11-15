import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TasksService } from './tasks.service.js';
import { PaginatedTasks, Task } from './types.js';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async createTask(@Body() data: CreateTaskDto): Promise<Task> {
    return await this.tasksService.createTask(data);
  }

  @Get()
  async getTasks(@Query() filters: ListTasksQueryDto): Promise<PaginatedTasks> {
    return await this.tasksService.getTasks(filters);
  }

  @Get(':id')
  async getTaskById(@Param('id', ParseUUIDPipe) id: string): Promise<Task> {
    return await this.tasksService.getTaskById(id);
  }

  @Patch(':id')
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateTaskDto,
  ): Promise<Task> {
    return await this.tasksService.updateTask(id, data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTask(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return await this.tasksService.deleteTask(id);
  }
}
