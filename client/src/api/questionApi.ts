const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface QuestionSummary {
  id: string;
  title: string;
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  topic: string;
  topics: string[];
}

export interface ExampleCase {
  number?: number;
  text?: string;
  input?: string;
  output?: string;
  explanation?: string;
}

export interface QuestionDetail extends QuestionSummary {
  description: string;
  constraints: string | null;
  examples: ExampleCase[];
  starter_code?: Record<string, string>;
  starterCode?: Record<string, string>;
}

export async function fetchQuestions(): Promise<QuestionSummary[]> {
  const response = await fetch(`${API_BASE_URL}/api/questions`);
  if (!response.ok) throw new Error(`Failed to fetch questions: ${response.status} ${response.statusText}`);
  const data = await response.json();
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

export async function fetchQuestionBySlug(slug: string): Promise<QuestionDetail> {
  const response = await fetch(`${API_BASE_URL}/api/questions/${encodeURIComponent(slug)}`);
  if (!response.ok) throw new Error(`Failed to fetch question "${slug}": ${response.status} ${response.statusText}`);
  const data = await response.json();
  return data.data ? data.data : data;
}