import { delay } from '../utils.ts';

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_USER_AGENT = 'senado-emendas-scraper/1.0.0 (Node.js; +https://www.npmjs.com/)';

/**
 * Fetch with timeout, User-Agent, retries on transient errors (network, 429, 5xx).
 */
export async function fetchWithRetry(
	url: string,
	options?: { maxRetries?: number; timeoutMs?: number },
): Promise<Response> {
	const maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
	const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const response = await fetch(url, {
				signal: AbortSignal.timeout(timeoutMs),
				headers: { 'User-Agent': DEFAULT_USER_AGENT },
			});

			if (response.ok) {
				return response;
			}

			const retryable =
				response.status === 429 || response.status === 502 || response.status === 503 || response.status === 504;

			if (retryable && attempt < maxRetries - 1) {
				await delay(1000 * 2 ** attempt);
				continue;
			}

			return response;
		} catch (error) {
			if (attempt < maxRetries - 1) {
				await delay(1000 * 2 ** attempt);
				continue;
			}
			throw error;
		}
	}

	throw new Error('fetchWithRetry: retries exhausted');
}
