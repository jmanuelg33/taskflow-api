import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ListTasksQueryDto } from './dto/list-tasks-query.dto.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { TasksRepository } from './tasks.repository.js';
import { TasksService } from './tasks.service.js';
import { Task, TaskStatus } from './types.js';

const expectNotFound = async (promise: Promise<unknown>, id: string) => {
  await expect(promise).rejects.toBeInstanceOf(NotFoundException);
  await expect(promise).rejects.toThrow(`Task ${id} not found`);
};

describe('TasksService', () => {
  let tasksService: TasksService;
  const tasksRepository = {
    create: vi.fn(),
    findAll: vi.fn(),
    findById: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        { provide: TasksRepository, useValue: tasksRepository },
      ],
    }).compile();

    tasksService = module.get(TasksService);
  });

  describe('createTask', () => {
    it('delega en el repositorio y devuelve la tarea creada', async () => {
      const created = { id: 'task-1' } as Task;
      tasksRepository.create.mockResolvedValue(created);
      const data: CreateTaskDto = {
        title: 'Write tests',
        status: TaskStatus.Pending,
        responsible: 'ana',
        dueDate: '2026-12-01T10:00:00.000Z',
      };

      await expect(tasksService.createTask(data)).resolves.toBe(created);
      expect(tasksRepository.create).toHaveBeenCalledWith(data);
    });
  });

  describe('getTasks', () => {
    it('calcula el offset desde page y limit y devuelve la paginación', async () => {
      const items = [{ id: 'task-1' } as Task];
      tasksRepository.findAll.mockResolvedValue({ items, total: 12 });

      const result = await tasksService.getTasks({
        page: 2,
        limit: 5,
      } as ListTasksQueryDto);

      expect(tasksRepository.findAll).toHaveBeenCalledWith({
        status: undefined,
        responsible: undefined,
        limit: 5,
        offset: 5,
      });
      expect(result).toEqual({ items, total: 12, page: 2, limit: 5 });
    });

    it('reenvía los filtros y usa offset 0 en la primera página', async () => {
      tasksRepository.findAll.mockResolvedValue({ items: [], total: 0 });

      await tasksService.getTasks({
        status: TaskStatus.Done,
        responsible: 'ana',
        page: 1,
        limit: 10,
      } as ListTasksQueryDto);

      expect(tasksRepository.findAll).toHaveBeenCalledWith({
        status: TaskStatus.Done,
        responsible: 'ana',
        limit: 10,
        offset: 0,
      });
    });
  });

  describe('getTaskById', () => {
    it('devuelve la tarea cuando existe', async () => {
      const task = { id: 'task-1' } as Task;
      tasksRepository.findById.mockResolvedValue(task);

      await expect(tasksService.getTaskById('task-1')).resolves.toBe(task);
    });

    it('lanza NotFound cuando la tarea no existe', async () => {
      tasksRepository.findById.mockResolvedValue(null);

      await expectNotFound(tasksService.getTaskById('missing'), 'missing');
    });
  });

  describe('updateTask', () => {
    it('devuelve la tarea actualizada', async () => {
      const task = { id: 'task-1', title: 'new' } as Task;
      tasksRepository.update.mockResolvedValue(task);

      await expect(
        tasksService.updateTask('task-1', { title: 'new' }),
      ).resolves.toBe(task);
    });

    it('lanza NotFound cuando la tarea no existe', async () => {
      tasksRepository.update.mockResolvedValue(null);

      await expectNotFound(
        tasksService.updateTask('missing', { title: 'new' }),
        'missing',
      );
    });
  });

  describe('deleteTask', () => {
    it('resuelve cuando la tarea se elimina', async () => {
      tasksRepository.delete.mockResolvedValue(true);

      await expect(tasksService.deleteTask('task-1')).resolves.toBeUndefined();
    });

    it('lanza NotFound cuando la tarea no existe', async () => {
      tasksRepository.delete.mockResolvedValue(false);

      await expectNotFound(tasksService.deleteTask('missing'), 'missing');
    });
  });
});
