import { randomUUID } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { DATABASE_POOL } from '../database/database.module.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { Task, TaskFilters } from './types.js';

const COLUMNS = `id, title, description, status, responsible,
  due_date AS "dueDate", created_at AS "createdAt", updated_at AS "updatedAt"`;

@Injectable()
export class TasksRepository {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async create(data: CreateTaskDto): Promise<Task> {
    const { rows } = await this.pool.query<Task>(
      `INSERT INTO tasks (id, title, description, status, responsible, due_date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING ${COLUMNS}`,
      [
        randomUUID(),
        data.title,
        data.description ?? null,
        data.status,
        data.responsible,
        data.dueDate,
      ],
    );
    return rows[0];
  }

  async findAll(
    filters: TaskFilters,
  ): Promise<{ items: Task[]; total: number }> {
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (filters.status) {
      params.push(filters.status);
      conditions.push(`status = $${params.length}`);
    }
    if (filters.responsible) {
      params.push(filters.responsible);
      conditions.push(`responsible = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [count, page] = await Promise.all([
      // Count total tasks matching filters
      this.pool.query<{ total: number }>(
        `SELECT COUNT(*)::int AS total FROM tasks ${where}`,
        params,
      ),
      // Fetch paginated tasks matching filters
      this.pool.query<Task>(
        `SELECT ${COLUMNS} FROM tasks ${where}
         ORDER BY created_at DESC
         LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, filters.limit, filters.offset],
      ),
    ]);

    return { items: page.rows, total: count.rows[0].total };
  }

  async findById(id: string): Promise<Task | null> {
    const { rows } = await this.pool.query<Task>(
      `SELECT ${COLUMNS} FROM tasks WHERE id = $1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async update(id: string, data: UpdateTaskDto): Promise<Task | null> {
    const params: unknown[] = [];
    const assignments: string[] = [];

    const set = (column: string, value: unknown) => {
      params.push(value);
      assignments.push(`${column} = $${params.length}`);
    };

    if (data.title !== undefined) set('title', data.title);
    if (data.description !== undefined) set('description', data.description);
    if (data.status !== undefined) set('status', data.status);
    if (data.responsible !== undefined) set('responsible', data.responsible);
    if (data.dueDate !== undefined) set('due_date', data.dueDate);

    // early return if no fields to update
    if (assignments.length === 0) return this.findById(id);

    params.push(id);
    const { rows } = await this.pool.query<Task>(
      `UPDATE tasks
       SET ${assignments.join(', ')}, updated_at = NOW()
       WHERE id = $${params.length}
       RETURNING ${COLUMNS}`,
      params,
    );
    return rows[0] ?? null;
  }

  async delete(id: string): Promise<boolean> {
    const { rowCount } = await this.pool.query(
      'DELETE FROM tasks WHERE id = $1',
      [id],
    );
    return (rowCount ?? 0) > 0;
  }
}
