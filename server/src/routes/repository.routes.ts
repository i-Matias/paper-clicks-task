import { Router } from "express";
import RepositoryController from "../controllers/repository.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get(
  "/starred",
  authenticate,
  RepositoryController.getStarredRepositories
);

export default router;
