INSERT INTO users (created_at, updated_at, deleted_at, email, password, username)
SELECT NOW(), NOW(), NULL, 'synth_alice@example.com', crypt('password123', gen_salt('bf')), 'synth_alice'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'synth_alice');

INSERT INTO users (created_at, updated_at, deleted_at, email, password, username)
SELECT NOW(), NOW(), NULL, 'synth_bob@example.com', crypt('password123', gen_salt('bf')), 'synth_bob'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'synth_bob');

INSERT INTO users (created_at, updated_at, deleted_at, email, password, username)
SELECT NOW(), NOW(), NULL, 'synth_carol@example.com', crypt('password123', gen_salt('bf')), 'synth_carol'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'synth_carol');

INSERT INTO user_roles (user_id, role)
SELECT u.id, 'ROLE_USER'
FROM users u
WHERE u.username IN ('synth_alice', 'synth_bob', 'synth_carol')
  AND NOT EXISTS (
      SELECT 1
      FROM user_roles r
      WHERE r.user_id = u.id AND r.role = 'ROLE_USER'
  );

INSERT INTO todos (created_at, updated_at, deleted_at, completed, description, title, user_id)
SELECT NOW(), NOW(), NULL, FALSE, 'Kickoff task for synthetic user alice', 'Set up project board', u.id
FROM users u
WHERE u.username = 'synth_alice'
  AND NOT EXISTS (
      SELECT 1 FROM todos t WHERE t.user_id = u.id AND t.title = 'Set up project board'
  );

INSERT INTO todos (created_at, updated_at, deleted_at, completed, description, title, user_id)
SELECT NOW(), NOW(), NULL, TRUE, 'Completed task for synthetic user bob', 'Create first todo', u.id
FROM users u
WHERE u.username = 'synth_bob'
  AND NOT EXISTS (
      SELECT 1 FROM todos t WHERE t.user_id = u.id AND t.title = 'Create first todo'
  );

INSERT INTO todos (created_at, updated_at, deleted_at, completed, description, title, user_id)
SELECT NOW(), NOW(), NULL, FALSE, 'Pending follow-up task for synthetic user carol', 'Review API docs', u.id
FROM users u
WHERE u.username = 'synth_carol'
  AND NOT EXISTS (
      SELECT 1 FROM todos t WHERE t.user_id = u.id AND t.title = 'Review API docs'
  );
