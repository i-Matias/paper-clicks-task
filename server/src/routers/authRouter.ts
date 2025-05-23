import { Router } from "express";
import passport from "passport";
import { githubCallback } from "../controllers/authController";
import { authenticateJWT } from "../middleware/auth";

const router = Router();

// Route to initiate GitHub login
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email", "read:user", "repo"],
  })
);

// Route to handle GitHub callback
router.get(
  "/github/callback",
  passport.authenticate("github", { failureRedirect: "/login?error=true" }),
  githubCallback
);

export default router;
