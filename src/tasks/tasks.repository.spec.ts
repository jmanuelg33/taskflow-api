import { Pool } from 'pg';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { TasksRepository } from './tasks.repository.js';
import { Task, TaskStatus } from './types.js';

const normalize = (sql: string) => sql.replace(/\s+/g, ' ').trim();

describe('TasksRepository', () => {
  let repository: TasksRepository;
  const pool = { query: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new TasksRepository(pool as unknown as Pool);
  });

  describe('create', () => {
    it('inserta la tarea y usa null cuando falta description', async () => {
      const created = { id: 'task-1' } as Task;
      pool.query.mockResolvedValue({ rows: [created] });
      const data: CreateTaskDto = {
        title: 'Write tests',
        status: TaskStatus.Pending,
        responsible: 'ana',
        dueDate: '2026-12-01T10:00:00.000Z',
      };

      const result = await repository.create(data);

      const [sql, params] = pool.query.mock.calls[0];
      expect(normalize(sql as string)).toContain(
        'INSERT INTO tasks (id, title, description, status, responsible, due_date)',
      );
      expect(normalize(sql as string)).toContain('RETURNING id, title');
      const [id, ...values] = params as unknown[];
      expect(id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      );
      expect(values).toEqual([
        'Write tests',
        null,
        TaskStatus.Pending,
        'ana',
        '2026-12-01T10:00:00.000Z',
      ]);
      expect(result).toBe(created);
    });
  });

  describe('findAll', () => {
    it('numera limit y offset cuando no hay filtros', async () => {
      const items = [{ id: 'task-1' } as Task];
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: 3 }] })
        .mockResolvedValueOnce({ rows: items });

      const result = await repository.findAll({ limit: 10, offset: 20 });

      const [countSql, countParams] = pool.query.mock.calls[0];
      const [pageSql, pageParams] = pool.query.mock.calls[1];
      expect(normalize(countSql as string)).toBe(
        'SELECT COUNT(*)::int AS total FROM tasks',
      );
      expect(countParams).toEqual([]);
      expect(normalize(pageSql as string)).toContain('LIMIT $1 OFFSET $2');
      expect(pageParams).toEqual([10, 20]);
      expect(result).toEqual({ items, total: 3 });
    });

    it('construye el WHERE y mantiene la numeración de parámetros con filtros', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({ rows: [] });

      await repository.findAll({
        status: TaskStatus.Done,
        responsible: 'ana',
        limit: 5,
        offset: 5,
      });

      const [countSql, countParams] = pool.query.mock.calls[0];
      const [pageSql, pageParams] = pool.query.mock.calls[1];
      expect(normalize(countSql as string)).toContain(
        'WHERE status = $1 AND responsible = $2',
      );
      expect(countParams).toEqual([TaskStatus.Done, 'ana']);
      expect(normalize(pageSql as string)).toContain(
        'WHERE status = $1 AND responsible = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
      );
      expect(pageParams).toEqual([TaskStatus.Done, 'ana', 5, 5]);
    });

    it('corre limit y offset cuando hay un solo filtro', async () => {
      pool.query
        .mockResolvedValueOnce({ rows: [{ total: 0 }] })
        .mockResolvedValueOnce({ rows: [] });

      await repository.findAll({ responsible: 'ana', limit: 10, offset: 0 });

      const [countSql, countParams] = pool.query.mock.calls[0];
      const [pageSql, pageParams] = pool.query.mock.calls[1];
      expect(normalize(countSql as string)).toContain('WHERE responsible = $1');
      expect(countParams).toEqual(['ana']);
      expect(normalize(pageSql as string)).toContain(
        'WHERE responsible = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      );
      expect(pageParams).toEqual(['ana', 10, 0]);
    });
  });

  describe('findById', () => {
    it('devuelve la fila cuando existe', async () => {
      const task = { id: 'task-1' } as Task;
      pool.query.mockResolvedValue({ rows: [task] });

      await expect(repository.findById('task-1')).resolves.toBe(task);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        ['task-1'],
      );
    });

    it('devuelve null cuando ninguna fila coincide', async () => {
      pool.query.mockResolvedValue({ rows: [] });

      await expect(repository.findById('missing')).resolves.toBeNull();
    });
  });

  describe('update', () => {
    it('construye el SET con un solo campo y deja el id al final', async () => {
      const task = { id: 'task-1', title: 'new' } as Task;
      pool.query.mockResolvedValue({ rows: [task] });

      await expect(repository.update('task-1', { title: 'new' })).resolves.toBe(
        task,
      );

      const [sql, params] = pool.query.mock.calls[0];
      expect(normalize(sql as string)).toContain(
        'SET title = $1, updated_at = NOW() WHERE id = $2',
      );
      expect(params).toEqual(['new', 'task-1']);
    });

    it('mapea los campos camelCase a columnas snake_case en orden', async () => {
      pool.query.mockResolvedValue({ rows: [] });
      const dueDate = '2026-01-01T00:00:00.000Z';

      await repository.update('task-1', {
        status: TaskStatus.Done,
        dueDate,
      });

      const [sql, params] = pool.query.mock.calls[0];
      expect(normalize(sql as string)).toContain(
        'SET status = $1, due_date = $2, updated_at = NOW() WHERE id = $3',
      );
      expect(params).toEqual([TaskStatus.Done, dueDate, 'task-1']);
    });

    it('no ejecuta un UPDATE cuando no se envía ningún campo', async () => {
      const task = { id: 'task-1' } as Task;
      pool.query.mockResolvedValue({ rows: [task] });

      await expect(repository.update('task-1', {})).resolves.toBe(task);

      expect(pool.query).toHaveBeenCalledTimes(1);
      const [sql, params] = pool.query.mock.calls[0];
      expect(normalize(sql as string)).toContain('SELECT');
      expect(normalize(sql as string)).not.toContain('UPDATE');
      expect(params).toEqual(['task-1']);
    });
  });

  describe('delete', () => {
    it('devuelve false cuando rowCount es null', async () => {
      pool.query.mockResolvedValue({ rowCount: null });

      await expect(repository.delete('task-1')).resolves.toBe(false);
    });

    it('devuelve false cuando no se eliminó ninguna fila', async () => {
      pool.query.mockResolvedValue({ rowCount: 0 });

      await expect(repository.delete('missing')).resolves.toBe(false);
    });

    it('devuelve true cuando se eliminó una fila', async () => {
      pool.query.mockResolvedValue({ rowCount: 1 });

      await expect(repository.delete('task-1')).resolves.toBe(true);
    });
  });
});
