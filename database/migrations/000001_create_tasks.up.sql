CREATE TABLE tasks (
    id UUID PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    responsible VARCHAR(150) NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT tasks_status_check
        CHECK (status IN ('pending', 'in_progress', 'done'))
);

CREATE INDEX idx_tasks_status
    ON tasks (status);

CREATE INDEX idx_tasks_responsible
    ON tasks (responsible);