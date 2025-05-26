import "express-session";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
      };
    }
  }
}

declare module "express-session" {
  interface SessionData {
    oauthState?: string;
  }
}

export {};
