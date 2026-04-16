export function createPool(maxConcurrency: number) {
  let active = 0;
  const queue: (() => void)[] = [];

  function acquire(): Promise<void> {
    if (active < maxConcurrency) {
      active++;
      return Promise.resolve();
    }
    return new Promise((resolve) =>
      queue.push(() => {
        active++;
        resolve();
      })
    );
  }

  function release(): void {
    active--;
    const next = queue.shift();
    if (next) next();
  }

  return { acquire, release };
}
