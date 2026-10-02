ALTER TABLE questions
ADD COLUMN IF NOT EXISTS topics TEXT[] NOT NULL DEFAULT '{}';

-- GIN index for topics array containment/overlap queries
CREATE INDEX IF NOT EXISTS idx_questions_topics ON questions USING GIN (topics);

-- B-tree indexes for primary topic and difficulty filtering
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions (topic);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions (difficulty);
