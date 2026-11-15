export enum TaskStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Done = 'done',
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  responsible: string;
  dueDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskFilters {
  status?: TaskStatus;
  responsible?: string;
  limit: number;
  offset: number;
}
