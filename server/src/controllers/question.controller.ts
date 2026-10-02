import type { Request, Response } from "express";
import { z } from "zod";
import * as questionService from "../services/question.service.js";
import { asyncHandler } from "../shared/utils/asyncHandler.js";
import type { Difficulty } from "../types/question.types.js";

const QuestionQuerySchema = z.object({
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  topic: z.string().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  offset: z.coerce.number().int().nonnegative().optional(),
});

export const getQuestions = asyncHandler(async (req: Request, res: Response) => {
  const query = QuestionQuerySchema.parse(req.query);
  const questions = await questionService.listQuestions(query);

  res.json({
    count: questions.length,
    data: questions,
  });
});

export const getQuestionBySlug = asyncHandler(async (req: Request, res: Response) => {
  const slug = req.params["slug"] as string;
  const question = await questionService.getQuestionBySlug(slug);

  res.json({
    data: question,
  });
});

export const getRandomQuestion = asyncHandler(async (req: Request, res: Response) => {
  const difficulty = req.query["difficulty"] as Difficulty | undefined;
  const topic = req.query["topic"] as string | undefined;

  const question = await questionService.getRandomQuestion(difficulty, topic);

  res.json({
    data: question,
  });
});
