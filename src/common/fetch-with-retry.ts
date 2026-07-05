import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

export async function fetchWithRetry(
  url: string,
  config?: AxiosRequestConfig,
  retries = 8,
  baseDelayMs = 2000,
  maxDelayMs = 60000,
): Promise<AxiosResponse> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await axios.get(url, { timeout: 15000, ...config });
    } catch (e: any) {
      const isLast = attempt === retries - 1;
      if (isLast) throw e;

      const retryable =
        ['ECONNABORTED', 'ETIMEDOUT'].includes(e.code) ||
        [429, 503].includes(e.response?.status);

      if (!retryable) throw e;

      const exp = baseDelayMs * Math.pow(2, attempt);
      const jitter = Math.random() * 1000;
      const delay = Math.min(exp + jitter, maxDelayMs);

      console.warn(
        `Fetch failed (${e.code || e.message}) for ${url}. Retry ${attempt + 1}/${retries} in ${Math.round(delay)}ms`,
      );
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error(`Unreachable after ${retries} retries: ${url}`);
}
