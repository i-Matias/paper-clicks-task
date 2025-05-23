declare global {
  namespace Express {
    interface Request {
      user: any; // Replace 'any' with the actual user type if available
    }
  }
}
