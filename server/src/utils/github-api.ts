import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import rateLimiter from "./rate-limiter";
import { AppError } from "../middleware/error.middleware";

export async function githubApiRequest<T>(
  url: string,
  options: AxiosRequestConfig,
  maxRetries: number = 3
): Promise<T> {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const resource = "core";
      const delay = rateLimiter.getRecommendedDelay(resource);

      if (delay > 0) {
        console.log(
          `Rate limiting in effect. Waiting ${delay}ms before GitHub API request`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      const response: AxiosResponse = await axios(url, options);

      if (response.headers) {
        rateLimiter.updateFromHeaders(
          response.headers as Record<string, string>
        );
      }

      return response.data as T;
    } catch (error: any) {
      if (error.response) {
        const { status, headers } = error.response;

        if (headers) {
          rateLimiter.updateFromHeaders(headers as Record<string, string>);
        }

        if (
          status === 403 &&
          error.response.data &&
          error.response.data.message?.includes("API rate limit exceeded")
        ) {
          const resetTime = headers["x-ratelimit-reset"]
            ? parseInt(headers["x-ratelimit-reset"], 10) * 1000
            : Date.now() + 60000;

          console.warn(
            `GitHub API rate limit exceeded. Reset at ${new Date(
              resetTime
            ).toISOString()}`
          );

          if (attempt < maxRetries) {
            attempt++;
            const backoffDelay = rateLimiter.getExponentialBackoff(attempt);
            console.log(
              `Retrying after ${backoffDelay}ms (Attempt ${attempt} of ${maxRetries})`
            );
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            continue;
          }
        }

        if (
          status === 403 &&
          error.response.data &&
          error.response.data.message?.includes("secondary rate limit")
        ) {
          console.warn(
            "GitHub API secondary rate limit detected (abuse detection)"
          );

          if (attempt < maxRetries) {
            attempt++;
            const backoffDelay = headers["retry-after"]
              ? parseInt(headers["retry-after"], 10) * 1000
              : rateLimiter.getExponentialBackoff(attempt, 10000);

            console.log(
              `Retrying after ${backoffDelay}ms due to secondary rate limit (Attempt ${attempt} of ${maxRetries})`
            );
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            continue;
          }
        }
      }

      throw error;
    }
  }

  throw new AppError("GitHub API request failed after maximum retries", 500);
}
