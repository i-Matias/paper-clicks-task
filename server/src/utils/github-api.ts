import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import rateLimiter from "./rate-limiter";

/**
 * Wrapper around axios for GitHub API calls with rate limiting support
 */
export async function githubApiRequest<T>(
  url: string,
  options: AxiosRequestConfig,
  maxRetries: number = 3
): Promise<T> {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      // Check if we should throttle and wait
      const resource = "core"; // Default GitHub API resource
      const delay = rateLimiter.getRecommendedDelay(resource);

      if (delay > 0) {
        console.log(
          `Rate limiting in effect. Waiting ${delay}ms before GitHub API request`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Make the API call
      const response: AxiosResponse = await axios(url, options);

      // Update rate limit information from headers
      if (response.headers) {
        rateLimiter.updateFromHeaders(
          response.headers as Record<string, string>
        );
      }

      return response.data as T;
    } catch (error: any) {
      // Handle rate limiting errors
      if (error.response) {
        const { status, headers } = error.response;

        // Update rate limit info even on error responses
        if (headers) {
          rateLimiter.updateFromHeaders(headers as Record<string, string>);
        }

        // Handle specific rate limit errors
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

          // If we still have retries left, wait using exponential backoff
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

        // Handle secondary rate limit (abuse detection)
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
            // Secondary rate limits often suggest a 60s cooldown
            const backoffDelay = headers["retry-after"]
              ? parseInt(headers["retry-after"], 10) * 1000
              : rateLimiter.getExponentialBackoff(attempt, 10000); // longer base delay for abuse limit

            console.log(
              `Retrying after ${backoffDelay}ms due to secondary rate limit (Attempt ${attempt} of ${maxRetries})`
            );
            await new Promise((resolve) => setTimeout(resolve, backoffDelay));
            continue;
          }
        }
      }

      // If we've reached here, either we've exhausted retries or it's a non-rate-limiting error
      throw error;
    }
  }

  throw new Error(`Failed GitHub API request after ${maxRetries} retries`);
}
