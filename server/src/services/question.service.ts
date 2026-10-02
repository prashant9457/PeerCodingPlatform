import * as questionRepo from "../repositories/question.repository.js";
import { NotFoundError } from "../shared/errors/app-error.js";
import type { Question, QuestionFilterParams } from "../types/question.types.js";

export async function listQuestions(
  filters: QuestionFilterParams = {}
): Promise<Question[]> {
  return await questionRepo.findAllQuestions(filters);
}

export async function getQuestionBySlug(slug: string): Promise<Question> {
  const question = await questionRepo.findQuestionBySlug(slug);
  if (!question) {
    throw new NotFoundError(`Question with slug "${slug}" not found`);
  }
  return question;
}

export async function getQuestionById(id: string): Promise<Question> {
  const question = await questionRepo.findQuestionById(id);
  if (!question) {
    throw new NotFoundError(`Question with id "${id}" not found`);
  }
  return question;
}

export async function getRandomQuestion(
  difficulty?: string,
  topic?: string
): Promise<Question> {
  const question = await questionRepo.findRandomQuestion(difficulty, topic);
  if (!question) {
    throw new NotFoundError("No question found matching the criteria");
  }
  return question;
}
