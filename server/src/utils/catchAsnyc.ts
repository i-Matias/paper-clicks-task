import { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps async route handlers to catch errors and pass them to express error handling middleware
 * This allows us to use async/await in our controllers without try/catch blocks
 *
 * IMPORTANT: Route handlers should NOT return the response object.
 * Use res.json(), res.send(), etc., without returning the result.
 */
const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Promise.resolve to handle both async and non-async functions
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;
