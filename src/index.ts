import { setupWorker } from 'msw';
import { handlers } from './handlers';

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...handlers);

const wait = (ms: number) => new Promise(res => setTimeout(res, ms));

const callWithRetry = async <T extends (...args: any) => any>(
  fn: T,
  depth = 0
): Promise<ReturnType<T>> => {
  try {
    return await fn();
  } catch (e) {
    if (depth > 7) {
      throw e;
    }
    await wait(2 ** depth * 10);

    return callWithRetry(fn, depth + 1);
  }
};

export const startWorker = async () => {
  await callWithRetry(async function startWorker() {
    worker.start();
    await wait(100);
    const response = await fetch('/api/status');
    const data = await response.json();
    if (data.status !== 'ok') {
      throw new Error();
    }
    return;
  });
};
