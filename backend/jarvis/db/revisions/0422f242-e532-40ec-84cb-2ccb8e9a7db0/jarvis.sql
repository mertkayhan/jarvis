-- Create Schemas
CREATE SCHEMA IF NOT EXISTS common;

-- Extensions
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA common;

-- Functions
CREATE OR REPLACE FUNCTION common.set_current_timestamp_updated_at() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
AS $$
BEGIN
  NEW."updated_at" = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION common.update_chat_updated_at() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
AS $$
BEGIN
    IF TG_TABLE_NAME = 'message_history' THEN
        UPDATE common.chat_history
        SET updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.chat_id;
    END IF;

    IF TG_TABLE_NAME = 'chat_history' THEN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$;

-- Tables with Constraints and Foreign Keys 
CREATE TABLE IF NOT EXISTS common.model_selection (
    user_id text NOT NULL,
    model_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS common.personalities (
    id uuid NOT NULL,
    owner text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    instructions text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    parent_id uuid,
    deleted boolean DEFAULT false NOT NULL,
    tools text[],
    doc_ids text[],
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS common.default_personalities (
    user_id text NOT NULL,
    personality_id uuid NOT NULL,
    PRIMARY KEY (user_id)
);

CREATE TABLE IF NOT EXISTS common.checkpoint_blobs (
    thread_id text NOT NULL,
    checkpoint_ns text DEFAULT ''::text NOT NULL,
    channel text NOT NULL,
    version text NOT NULL,
    type text NOT NULL,
    blob bytea,
    PRIMARY KEY (thread_id, checkpoint_ns, channel, version)
);

CREATE TABLE IF NOT EXISTS common.checkpoint_migrations (
    v integer NOT NULL,
    PRIMARY KEY (v)
);

CREATE TABLE IF NOT EXISTS common.checkpoint_writes (
    thread_id text NOT NULL,
    checkpoint_ns text DEFAULT ''::text NOT NULL,
    checkpoint_id text NOT NULL,
    task_id text NOT NULL,
    idx integer NOT NULL,
    channel text NOT NULL,
    type text,
    blob bytea NOT NULL,
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id, task_id, idx)
);

CREATE TABLE IF NOT EXISTS common.checkpoints (
    thread_id text NOT NULL,
    checkpoint_ns text DEFAULT ''::text NOT NULL,
    checkpoint_id text NOT NULL,
    parent_checkpoint_id text,
    type text,
    checkpoint jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    PRIMARY KEY (thread_id, checkpoint_ns, checkpoint_id)
);

CREATE TABLE IF NOT EXISTS common.document_repo (
    document_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    metadata text,
    document_name text NOT NULL,
    owner text NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    num_pages integer,
    num_tokens bigint,
    PRIMARY KEY (document_id)
);

CREATE TABLE IF NOT EXISTS common.document_packs (
  id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  deleted boolean DEFAULT false NOT NULL,
  owner text NOT NULL,
  description text NOT NULL,
  name text NOT NULL,
  PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS common.question_packs (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    owner text NOT NULL,
    description text NOT NULL,
    name text NOT NULL,
    PRIMARY KEY(id)
);

CREATE TABLE IF NOT EXISTS common.question_pairs (
    id uuid NOT NULL,
    pack_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    question text NOT NULL,
    answer text NOT NULL,
    updated_by text NOT NULL,
    deleted boolean DEFAULT false NOT NULL,
    metadata text,
    question_embedding common.vector(1536),
    question_tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', question)) STORED,
    PRIMARY KEY (id),
    CONSTRAINT question_pairs_pack_id_fkey FOREIGN KEY (pack_id) REFERENCES common.question_packs(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS common.question_tags (
    id uuid NOT NULL,
    question_id uuid NOT NULL,
    tag text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    pack_id uuid NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT question_tags_question_id_fkey FOREIGN KEY (question_id) REFERENCES common.question_pairs(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS common.question_additional_info (
    id uuid NOT NULL,
    question_id uuid NOT NULL,
    key text NOT NULL,
    value text NOT NULL,
    pack_id uuid NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT question_additional_info_question_id_fkey FOREIGN KEY (question_id) REFERENCES common.question_pairs(id) ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS common.question_history (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    operation text NOT NULL,
    prev_value text NOT NULL,
    current_value text NOT NULL,
    user_id text NOT NULL,
    question_id uuid NOT NULL,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS common.chat_history (
    id uuid NOT NULL,
    owner_email text NOT NULL,
    allow_list text[] NOT NULL,
    title text,
    created_at timestamp with time zone DEFAULT now(),
    deleted boolean DEFAULT false NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    personality text,
    documents text[],
    model_name text,
    PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS common.message_history (
    id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    role text NOT NULL,
    chat_id uuid NOT NULL,
    content text,
    data text,
    liked boolean,
    score numeric,
    context text,
    PRIMARY KEY (id),
    CONSTRAINT message_history_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES common.chat_history(id) ON UPDATE CASCADE ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS question_history_question_id_index ON common.question_history USING btree (question_id);
CREATE INDEX IF NOT EXISTS checkpoint_blobs_thread_id_idx ON common.checkpoint_blobs USING btree (thread_id);
CREATE INDEX IF NOT EXISTS checkpoint_writes_thread_id_idx ON common.checkpoint_writes USING btree (thread_id);
CREATE INDEX IF NOT EXISTS checkpoints_thread_id_idx ON common.checkpoints USING btree (thread_id);
CREATE INDEX IF NOT EXISTS document_repo_user_index ON common.document_repo USING btree (owner);
CREATE INDEX IF NOT EXISTS question_pairs_question_embedding_idx ON common.question_pairs USING hnsw (question_embedding common.vector_cosine_ops);
CREATE INDEX IF NOT EXISTS question_tsv_idx ON common.question_pairs USING gin (question_tsv);
CREATE INDEX IF NOT EXISTS chat_history_user_index ON common.chat_history USING btree (owner_email);
CREATE INDEX IF NOT EXISTS message_history_chat_index ON common.message_history USING btree (chat_id);

-- Triggers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_common_document_repo_updated_at'
      AND tgrelid = 'common.document_repo'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER set_common_question_tags_updated_at BEFORE UPDATE ON common.question_tags FOR EACH ROW EXECUTE FUNCTION common.set_current_timestamp_updated_at()';
  END IF;
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_common_document_repo_updated_at'
      AND tgrelid = 'common.document_repo'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER set_common_model_selection_updated_at BEFORE UPDATE ON common.model_selection FOR EACH ROW EXECUTE FUNCTION common.set_current_timestamp_updated_at()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_common_document_repo_updated_at'
      AND tgrelid = 'common.document_repo'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER set_common_personalities_updated_at BEFORE UPDATE ON common.personalities FOR EACH ROW EXECUTE FUNCTION common.set_current_timestamp_updated_at()';
  END IF;
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_common_document_repo_updated_at'
      AND tgrelid = 'common.document_repo'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER set_common_question_packs_updated_at BEFORE UPDATE ON common.question_packs FOR EACH ROW EXECUTE FUNCTION common.set_current_timestamp_updated_at()';
  END IF;
END $$;


DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_common_document_repo_updated_at'
      AND tgrelid = 'common.document_repo'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER set_common_document_repo_updated_at BEFORE UPDATE ON common.document_repo FOR EACH ROW EXECUTE FUNCTION common.set_current_timestamp_updated_at()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_common_document_packs_updated_at'
      AND tgrelid = 'common.document_packs'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER set_common_document_packs_updated_at BEFORE UPDATE ON common.document_packs FOR EACH ROW EXECUTE FUNCTION common.set_current_timestamp_updated_at()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_common_question_pairs_updated_at'
      AND tgrelid = 'common.question_pairs'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER set_common_question_pairs_updated_at BEFORE UPDATE ON common.question_pairs FOR EACH ROW EXECUTE FUNCTION common.set_current_timestamp_updated_at()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_common_chat_history_updated_at'
      AND tgrelid = 'common.chat_history'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER set_common_chat_history_updated_at BEFORE UPDATE ON common.chat_history FOR EACH ROW EXECUTE FUNCTION common.set_current_timestamp_updated_at()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_common_message_history_updated_at'
      AND tgrelid = 'common.message_history'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER set_common_message_history_updated_at BEFORE UPDATE ON common.message_history FOR EACH ROW EXECUTE FUNCTION common.set_current_timestamp_updated_at()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_update_chat_updated_at_on_chat'
      AND tgrelid = 'common.chat_history'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER trigger_update_chat_updated_at_on_chat BEFORE INSERT ON common.chat_history FOR EACH ROW EXECUTE FUNCTION common.update_chat_updated_at()';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trigger_update_chat_updated_at_on_message'
      AND tgrelid = 'common.message_history'::regclass
  ) THEN
    EXECUTE 'CREATE TRIGGER trigger_update_chat_updated_at_on_message AFTER INSERT ON common.message_history FOR EACH ROW EXECUTE FUNCTION common.update_chat_updated_at()';
  END IF;
END $$;
