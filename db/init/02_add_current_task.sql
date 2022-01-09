ALTER TABLE
    users
ADD
    COLUMN current_task_external_id CHAR(36) NULL;

ALTER TABLE users
ADD
    CONSTRAINT fk_users_current_task_external_id FOREIGN KEY(current_task_external_id) REFERENCES tasks(external_id);