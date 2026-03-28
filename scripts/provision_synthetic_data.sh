#!/usr/bin/env bash
set -euo pipefail

RESET=false
if [[ "${1:-}" == "--reset" ]]; then
  RESET=true
fi

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-55432}"
PGUSER="${PGUSER:-postgres}"
PGDATABASE="${PGDATABASE:-todoapp}"
PGPASSWORD="${PGPASSWORD:-postgres}"

export PGPASSWORD

psql_cmd=(psql -v ON_ERROR_STOP=1 -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE")

if [[ "$RESET" == "true" ]]; then
  "${psql_cmd[@]}" <<'SQL'
DELETE FROM todos
WHERE user_id IN (
  SELECT id FROM users WHERE username LIKE 'synth_%'
);

DELETE FROM user_roles
WHERE user_id IN (
  SELECT id FROM users WHERE username LIKE 'synth_%'
);

DELETE FROM users
WHERE username LIKE 'synth_%';
SQL
fi

"${psql_cmd[@]}" <<'SQL'
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE todos
ADD COLUMN IF NOT EXISTS status VARCHAR(32);

UPDATE todos
SET status = CASE WHEN completed THEN 'DONE' ELSE 'TODO' END
WHERE status IS NULL;

MERGE INTO users AS u
USING (
    VALUES
        ('synth_alice', 'synth_alice@example.com', 'password123'),
        ('synth_bob', 'synth_bob@example.com', 'password123'),
        ('synth_carol', 'synth_carol@example.com', 'password123')
) AS s(username, email, raw_password)
ON u.username = s.username
WHEN MATCHED THEN
    UPDATE SET
        email = s.email,
        password = crypt(s.raw_password, gen_salt('bf')),
        updated_at = NOW(),
        deleted_at = NULL
WHEN NOT MATCHED THEN
    INSERT (created_at, updated_at, deleted_at, email, password, username)
    VALUES (NOW(), NOW(), NULL, s.email, crypt(s.raw_password, gen_salt('bf')), s.username);

DELETE FROM user_roles
WHERE role = 'ROLE_USER'
  AND user_id IN (
      SELECT id FROM users WHERE username IN ('synth_alice', 'synth_bob', 'synth_carol')
  );

INSERT INTO user_roles (user_id, role)
SELECT u.id, 'ROLE_USER'
FROM users u
WHERE u.username IN ('synth_alice', 'synth_bob', 'synth_carol');

MERGE INTO todos AS t
USING (
    SELECT u.id AS user_id,
           'Set up project board'::VARCHAR(100) AS title,
           'Kickoff task for synthetic user alice'::VARCHAR(500) AS description,
           'TODO'::VARCHAR(32) AS status,
           FALSE AS completed
    FROM users u
    WHERE u.username = 'synth_alice'
) AS s
ON t.user_id = s.user_id AND t.title = s.title
WHEN MATCHED THEN
    UPDATE SET
        description = s.description,
        status = s.status,
        completed = s.completed,
        updated_at = NOW(),
        deleted_at = NULL
WHEN NOT MATCHED THEN
    INSERT (created_at, updated_at, deleted_at, completed, status, description, title, user_id)
    VALUES (NOW(), NOW(), NULL, s.completed, s.status, s.description, s.title, s.user_id);

MERGE INTO todos AS t
USING (
    SELECT u.id AS user_id,
           'Create first todo'::VARCHAR(100) AS title,
           'Completed task for synthetic user bob'::VARCHAR(500) AS description,
           'DONE'::VARCHAR(32) AS status,
           TRUE AS completed
    FROM users u
    WHERE u.username = 'synth_bob'
) AS s
ON t.user_id = s.user_id AND t.title = s.title
WHEN MATCHED THEN
    UPDATE SET
        description = s.description,
        status = s.status,
        completed = s.completed,
        updated_at = NOW(),
        deleted_at = NULL
WHEN NOT MATCHED THEN
    INSERT (created_at, updated_at, deleted_at, completed, status, description, title, user_id)
    VALUES (NOW(), NOW(), NULL, s.completed, s.status, s.description, s.title, s.user_id);

MERGE INTO todos AS t
USING (
    SELECT u.id AS user_id,
           'Review API docs'::VARCHAR(100) AS title,
           'Pending follow-up task for synthetic user carol'::VARCHAR(500) AS description,
           'IN_PROGRESS'::VARCHAR(32) AS status,
           FALSE AS completed
    FROM users u
    WHERE u.username = 'synth_carol'
) AS s
ON t.user_id = s.user_id AND t.title = s.title
WHEN MATCHED THEN
    UPDATE SET
        description = s.description,
        status = s.status,
        completed = s.completed,
        updated_at = NOW(),
        deleted_at = NULL
WHEN NOT MATCHED THEN
    INSERT (created_at, updated_at, deleted_at, completed, status, description, title, user_id)
    VALUES (NOW(), NOW(), NULL, s.completed, s.status, s.description, s.title, s.user_id);
SQL

echo "Synthetic data provisioning complete for database '$PGDATABASE' at $PGHOST:$PGPORT"
