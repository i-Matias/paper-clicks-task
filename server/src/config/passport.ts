import passport from "passport";
import { Strategy as GitHubStrategy } from "passport-github2";
import { PrismaClient } from "@prisma/client";
import type { User } from "@prisma/client";
import type { Profile } from "passport-github2";

const prisma = new PrismaClient();

export const configurePassport = () => {
  // For JWT we don't need serialization/deserialization

  // Configure GitHub strategy
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        callbackURL: process.env.GITHUB_CALLBACK_URL!,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: (error: any, user?: any) => void
      ) => {
        try {
          // Check if user exists
          let user = await prisma.user.findUnique({
            where: { githubId: profile.id },
          });

          if (!user) {
            // Create new user if doesn't exist
            user = await prisma.user.create({
              data: {
                githubId: profile.id,
                username: profile.username || profile.displayName,
                displayName: profile.displayName,
                email: profile.emails?.[0]?.value,
                avatarUrl: profile.photos?.[0]?.value,
                accessToken,
                refreshToken: refreshToken || null,
              },
            });
          } else {
            // Update existing user with fresh data
            user = await prisma.user.update({
              where: { githubId: profile.id },
              data: {
                username: profile.username || profile.displayName,
                displayName: profile.displayName,
                email: profile.emails?.[0]?.value,
                avatarUrl: profile.photos?.[0]?.value,
                accessToken,
                refreshToken: refreshToken || null,
                updatedAt: new Date(),
              },
            });
          }

          return done(null, user);
        } catch (error) {
          console.error("Error in GitHub strategy:", error);
          return done(error);
        }
      }
    )
  );

  return passport;
};
