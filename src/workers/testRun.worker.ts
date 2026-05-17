const AsyncFunction = Object.getPrototypeOf(async function () { /* */ }).constructor as new (
    ...args: string[]
) => (...injected: unknown[]) => Promise<void>;

const noop = async () => { /* */ };

self.onmessage = async (e: MessageEvent<{ code: string; input: number[] }>) => {
    const { code, input } = e.data;
    const array = [...input];
    const swap = (i: number, j: number) => {
        const t = array[i];
        array[i] = array[j];
        array[j] = t;
    };
    try {
        const fn = new AsyncFunction('array', 'swap', 'sleepCMP', 'sleepWRITE', code);
        await fn(array, swap, noop, noop);
        self.postMessage({ ok: true, output: array });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        self.postMessage({ ok: false, error: message });
    }
};
