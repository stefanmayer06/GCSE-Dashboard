CREATE TABLE IF NOT EXISTS schema_migrations (
  version integer PRIMARY KEY,
  name text NOT NULL,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY,
  username text NOT NULL CONSTRAINT users_username_unique UNIQUE,
  password_hash text,
  oauth boolean NOT NULL DEFAULT false,
  oauth_provider text,
  oauth_subject text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_oauth_identity_pair CHECK (
    (oauth_provider IS NULL AND oauth_subject IS NULL)
    OR (oauth_provider IS NOT NULL AND oauth_subject IS NOT NULL)
  ),
  CONSTRAINT users_oauth_identity_unique UNIQUE (oauth_provider, oauth_subject)
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token_hash text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state_hash text PRIMARY KEY,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE TABLE IF NOT EXISTS subject_progress (
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  state jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, subject)
);

CREATE TABLE IF NOT EXISTS study_sessions (
  id text PRIMARY KEY,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  kind text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  payload jsonb NOT NULL,
  result jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  lease_until timestamptz,
  CONSTRAINT study_sessions_status CHECK (status IN ('active', 'claimed', 'completed'))
);

CREATE INDEX IF NOT EXISTS auth_sessions_user_id_idx ON auth_sessions (user_id);
CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx ON auth_sessions (expires_at);
CREATE INDEX IF NOT EXISTS oauth_states_expires_at_idx ON oauth_states (expires_at);
CREATE INDEX IF NOT EXISTS subject_progress_user_id_idx ON subject_progress (user_id);
CREATE INDEX IF NOT EXISTS study_sessions_lookup_idx
  ON study_sessions (user_id, subject, kind, status);
CREATE INDEX IF NOT EXISTS study_sessions_expires_at_idx ON study_sessions (expires_at);
CREATE INDEX IF NOT EXISTS study_sessions_lease_until_idx
  ON study_sessions (lease_until)
  WHERE status = 'claimed';

INSERT INTO schema_migrations (version, name)
VALUES (1, 'storage_foundation')
ON CONFLICT (version) DO NOTHING;
