export type Difficulty = "easy" | "medium" | "hard";

export interface ExampleCase {
  number?: number | undefined;
  text?: string | undefined;
  images?: string[] | undefined;
  input?: string | undefined;
  output?: string | undefined;
  explanation?: string | undefined;
}

export type StarterCodeMap = {
  cpp?: string | undefined;
  java?: string | undefined;
  python?: string | undefined;
  javascript?: string | undefined;
  typescript?: string | undefined;
  [key: string]: string | undefined;
};

export interface Question {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  topic: string;
  topics: string[];
  constraints: string | null;
  examples: ExampleCase[];
  starter_code: StarterCodeMap;
  created_at: Date;
  updated_at: Date;
}

export interface QuestionSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  topic: string;
  topics: string[];
}

export interface CreateQuestionInput {
  title: string;
  slug: string;
  description: string;
  difficulty: Difficulty;
  topic: string;
  topics: string[];
  constraints?: string | null | undefined;
  examples?: ExampleCase[] | undefined;
  starter_code?: StarterCodeMap | undefined;
}

export interface QuestionFilterParams {
  difficulty?: Difficulty | undefined;
  topic?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}
