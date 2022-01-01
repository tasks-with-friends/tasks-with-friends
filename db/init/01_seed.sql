SET
    TIME ZONE 'UTC';

USE production;

CREATE TABLE
    users (
        id SERIAL PRIMARY KEY,
        external_id CHAR(36) NOT NULL DEFAULT gen_random_uuid():: VARCHAR,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(511),
        provider VARCHAR(255) NOT NULL,
        provider_user_id VARCHAR(255) NOT NULL,
        status VARCHAR(255) NOT NULL
    );

CREATE UNIQUE INDEX ix_users_external_id
ON users(external_id);

CREATE UNIQUE INDEX ix_users_provider_provider_user_id
ON users(provider, provider_user_id);

CREATE INDEX ix_users_name_external_id_asc
ON users (name ASC, external_id ASC);

CREATE INDEX ix_users_name_external_id_desc
ON users (name DESC, external_id DESC);

CREATE TABLE
    tasks (
        id SERIAL PRIMARY KEY,
        external_id CHAR(36) NOT NULL DEFAULT gen_random_uuid():: VARCHAR,
        owner_external_id CHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        description VARCHAR(2000),
        duration_minutes INT NOT NULL,
        group_size INT NOT NULL,
        status VARCHAR(255) NOT NULL,
        CONSTRAINT fk_tasks_owner_external_id FOREIGN KEY(owner_external_id) REFERENCES users(external_id)
    );

CREATE UNIQUE INDEX ix_tasks_external_id
ON tasks(external_id);

CREATE TABLE
    friends (
        id SERIAL PRIMARY KEY,
        external_id CHAR(36) NOT NULL DEFAULT gen_random_uuid():: VARCHAR,
        user_external_id CHAR(36) NOT NULL,
        friend_user_external_id CHAR(36) NOT NULL,
        CONSTRAINT fk_friends_user_external_id FOREIGN KEY(user_external_id) REFERENCES users(external_id),
        CONSTRAINT fk_friends_friend_user_external_id FOREIGN KEY(friend_user_external_id) REFERENCES users(external_id)
    );

CREATE UNIQUE INDEX ix_friends_external_id
ON friends(external_id);

CREATE UNIQUE INDEX ix_friends_user_external_id_friend_user_external_id
ON friends(user_external_id, friend_user_external_id);

CREATE TABLE
    invitations (
        id SERIAL PRIMARY KEY,
        external_id CHAR(36) NOT NULL DEFAULT gen_random_uuid():: VARCHAR,
        from_user_external_id CHAR(36) NOT NULL,
        invited_email VARCHAR(255) NOT NULL,
        CONSTRAINT fk_invitations_from_user_external_id FOREIGN KEY(from_user_external_id) REFERENCES users(external_id)
    );

CREATE INDEX ix_invitations_invited_email
ON invitations(invited_email);

CREATE UNIQUE INDEX ix_invitations_external_id
ON invitations(external_id);

CREATE UNIQUE INDEX ix_invitations_from_user_id_invited_email
ON invitations(from_user_external_id, invited_email);

CREATE INDEX ix_invitations_id_external_id_asc
ON invitations (id ASC, external_id ASC);

CREATE INDEX ix_invitations_id_external_id_desc
ON invitations (id DESC, external_id DESC);

CREATE TABLE
    participants (
        id SERIAL PRIMARY KEY,
        external_id CHAR(36) NOT NULL DEFAULT gen_random_uuid():: VARCHAR,
        task_external_id CHAR(36) NOT NULL,
        user_external_id CHAR(36) NOT NULL,
        response VARCHAR(255),
        CONSTRAINT fk_participants_user_external_id FOREIGN KEY(user_external_id) REFERENCES users(external_id),
        CONSTRAINT fk_participants_task_external_id FOREIGN KEY(task_external_id) REFERENCES tasks(external_id)
    );

CREATE UNIQUE INDEX ix_participants_external_id
ON participants(external_id);