interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  used: number;
  resource: string;
}

class RateLimiter {
  private rateLimits: Record<string, RateLimitInfo> = {};
  private retryAfterMap: Map<string, number> = new Map();
  private backoffMultiplier = 1.5;

  updateFromHeaders(
    headers: Record<string, string>,
    resource: string = "core"
  ): void {
    const rateLimit = parseInt(headers["x-ratelimit-limit"] || "0", 10);
    const remaining = parseInt(headers["x-ratelimit-remaining"] || "0", 10);
    const reset = parseInt(headers["x-ratelimit-reset"] || "0", 10);
    const used = parseInt(headers["x-ratelimit-used"] || "0", 10);

    if (rateLimit && reset) {
      this.rateLimits[resource] = {
        limit: rateLimit,
        remaining,
        reset,
        used,
        resource,
      };

      if (remaining < rateLimit * 0.1) {
        console.warn(
          `GitHub API rate limit warning: ${remaining}/${rateLimit} requests remaining for ${resource}. Resets at ${new Date(
            reset * 1000
          ).toISOString()}`
        );
      }
    }

    const retryAfter = headers["retry-after"];
    if (retryAfter) {
      const seconds = parseInt(retryAfter, 10);
      if (!isNaN(seconds)) {
        this.retryAfterMap.set(resource, Date.now() + seconds * 1000);
        console.warn(
          `Rate limited by GitHub API. Retry after ${seconds} seconds for resource ${resource}`
        );
      }
    }
  }

  shouldThrottle(resource: string = "core"): boolean {
    // First check if we have a retry-after directive
    const retryAfterTime = this.retryAfterMap.get(resource);
    if (retryAfterTime && Date.now() < retryAfterTime) {
      return true;
    }

    const rateLimitInfo = this.rateLimits[resource];
    if (!rateLimitInfo) return false;

    return rateLimitInfo.remaining < rateLimitInfo.limit * 0.05;
  }

  getRecommendedDelay(resource: string = "core"): number {
    const retryAfterTime = this.retryAfterMap.get(resource);
    if (retryAfterTime) {
      const delay = retryAfterTime - Date.now();
      return delay > 0 ? delay : 0;
    }

    const rateLimitInfo = this.rateLimits[resource];
    if (!rateLimitInfo) return 0;

    if (rateLimitInfo.remaining === 0) {
      // Calculate delay until reset time
      const now = Math.floor(Date.now() / 1000);
      const delaySeconds = Math.max(0, rateLimitInfo.reset - now);
      return delaySeconds * 1000;
    } else if (rateLimitInfo.remaining < rateLimitInfo.limit * 0.05) {
      // If under 5% remaining, add some delay to spread out the remaining requests
      const resetTimeInMs = rateLimitInfo.reset * 1000;
      const msUntilReset = resetTimeInMs - Date.now();
      const delayPerRequest = msUntilReset / (rateLimitInfo.remaining + 1);
      return Math.min(delayPerRequest, 1000); // Cap at 1 second
    }

    return 0;
  }

  getExponentialBackoff(attempt: number, baseDelayMs: number = 1000): number {
    return Math.min(
      baseDelayMs * Math.pow(this.backoffMultiplier, attempt),
      60000
    );
  }

  getRateLimitInfo(resource: string = "core"): RateLimitInfo | null {
    return this.rateLimits[resource] || null;
  }
}

export default new RateLimiter();
