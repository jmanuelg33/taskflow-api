import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { TasksRepository } from './tasks.repository.js';
import { PaginatedTasks, Task } from './types.js';


const TASK_NOT_FOUND_ERROR = (id: string) => `Task ${id} not found`;

@Injectable()
export class TasksService {
  constructor(private readonly tasksRepository: TasksRepository) {}

  createTask(data: CreateTaskDto): Promise<Task> {
    return this.tasksRepository.create(data);
  }

  async getTasks(filters: ListTasksQueryDto): Promise<PaginatedTasks> {
    const { page, limit } = filters;
    const { items, total } = await this.tasksRepository.findAll({
      status: filters.status,
      responsible: filters.responsible,
      limit,
      offset: (page - 1) * limit,
    });
    return { items, total, page, limit };
  }

  async getTaskById(id: string): Promise<Task> {
    const task = await this.tasksRepository.findById(id);
    if (!task) throw new NotFoundException(TASK_NOT_FOUND_ERROR(id));
    return task;
  }

  async updateTask(id: string, data: UpdateTaskDto): Promise<Task> {
    const task = await this.tasksRepository.update(id, data);
    if (!task) throw new NotFoundException(TASK_NOT_FOUND_ERROR(id));
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    const deleted = await this.tasksRepository.delete(id);
    if (!deleted) throw new NotFoundException(TASK_NOT_FOUND_ERROR(id));
  }
}
