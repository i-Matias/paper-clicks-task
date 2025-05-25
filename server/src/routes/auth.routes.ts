import { Router } from "express";
import AuthController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.get("/github/login", AuthController.getLoginUrl);
router.get("/github/callback", AuthController.githubCallback);
router.get("/me", authenticate, AuthController.getMe);

export default router;
