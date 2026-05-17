export type ValidationResult = { ok: true } | { ok: false; error: string };

const AsyncFunction = Object.getPrototypeOf(async function () { /* */ }).constructor as new (
    ...args: string[]
) => (...injected: unknown[]) => Promise<void>;

const TEST_CASES: number[][] = [
    [5, 2, 8, 1, 9, 3, 7, 4, 6, 0],
    [3, 3, 1, 2, 2, 1],
];

const TIMEOUT_MS = 2000;

export function validateSyntax(code: string): ValidationResult {
    try {
        new AsyncFunction('array', 'swap', 'sleepCMP', 'sleepWRITE', code);
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
}

export async function validateCorrectness(code: string): Promise<ValidationResult> {
    const syntax = validateSyntax(code);
    if (!syntax.ok) return syntax;

    for (const input of TEST_CASES) {
        const result = await runOnce(code, input);
        if (!result.ok) return result;
    }
    return { ok: true };
}

function runOnce(code: string, input: number[]): Promise<ValidationResult> {
    return new Promise((resolve) => {
        const worker = new Worker(new URL('../workers/testRun.worker.ts', import.meta.url), {
            type: 'module',
        });

        const timer = setTimeout(() => {
            worker.terminate();
            resolve({
                ok: false,
                error: `Tiempo excedido (${TIMEOUT_MS} ms) sobre [${input.join(', ')}]. ¿Bucle infinito?`,
            });
        }, TIMEOUT_MS);

        worker.onmessage = (e: MessageEvent<{ ok: boolean; output?: number[]; error?: string }>) => {
            clearTimeout(timer);
            worker.terminate();
            const { ok, output, error } = e.data;
            if (!ok) {
                resolve({ ok: false, error: `Error sobre [${input.join(', ')}]: ${error}` });
                return;
            }
            if (!output || !preservesMultiset(input, output)) {
                resolve({
                    ok: false,
                    error: `El resultado no contiene los mismos elementos. Entrada [${input.join(', ')}], salida [${(output ?? []).join(', ')}].`,
                });
                return;
            }
            if (!isAscending(output)) {
                resolve({
                    ok: false,
                    error: `El array no queda ordenado. Entrada [${input.join(', ')}], salida [${output.join(', ')}].`,
                });
                return;
            }
            resolve({ ok: true });
        };

        worker.postMessage({ code, input });
    });
}

function isAscending(arr: number[]): boolean {
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] < arr[i - 1]) return false;
    }
    return true;
}

function preservesMultiset(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    const sa = [...a].sort((x, y) => x - y);
    const sb = [...b].sort((x, y) => x - y);
    for (let i = 0; i < sa.length; i++) {
        if (sa[i] !== sb[i]) return false;
    }
    return true;
}
