import { Router } from "express";
import {
  getQuestions,
  getQuestionBySlug,
  getRandomQuestion,
} from "../controllers/question.controller.js";

const router = Router();

router.get("/", getQuestions);
router.get("/random", getRandomQuestion);
router.get("/:slug", getQuestionBySlug);

export { router as questionRoutes };
