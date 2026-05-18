import { selectionSortAlgorithm } from '../workers/algorithms/selectionSort';
import { quickSortAlgorithm } from '../workers/algorithms/quickSort';
import { mergeSortAlgorithm } from '../workers/algorithms/mergeSort';
import { mergeSortInPlaceAlgorithm } from '../workers/algorithms/mergeSortInPlace';
import { bubbleSortAlgorithm } from '../workers/algorithms/bubbleSort';
import { insertionSortAlgorithm } from '../workers/algorithms/insertionSort';
import { heapSortAlgorithm } from '../workers/algorithms/heapSort';
import { shellSortAlgorithm } from '../workers/algorithms/shellSort';
import { countingSortAlgorithm } from '../workers/algorithms/countingSort';
import { linearSearchAlgorithm } from '../workers/algorithms/linearSearch';
import { binarySearchAlgorithm } from '../workers/algorithms/binarySearch';
import { jumpSearchAlgorithm } from '../workers/algorithms/jumpSearch';
import { interpolationSearchAlgorithm } from '../workers/algorithms/interpolationSearch';
import type { SortingAlgorithm, SearchAlgorithm, SearchSignal } from '../workers/algorithms/types';
import { createDataProxy, createSearchProxy } from '../workers/dataProxy';
import { setTimings } from '../workers/sleep';

type EventCounts = { COMPARE: number; SET: number; PROBE: number; FOUND: number; NOT_FOUND: number; RANGE: number };

function installEventCapture(): { counts: EventCounts; restore: () => void } {
    const counts: EventCounts = { COMPARE: 0, SET: 0, PROBE: 0, FOUND: 0, NOT_FOUND: 0, RANGE: 0 };
    const original = self.postMessage.bind(self);
    (self as unknown as { postMessage: (msg: { type: keyof EventCounts }) => void }).postMessage = (msg) => {
        if (msg && msg.type in counts) counts[msg.type]++;
    };
    return { counts, restore: () => { (self as unknown as { postMessage: typeof original }).postMessage = original; } };
}

const SORTS: Array<{ key: string; algo: SortingAlgorithm }> = [
    { key: 'bubbleSort',        algo: bubbleSortAlgorithm },
    { key: 'insertionSort',     algo: insertionSortAlgorithm },
    { key: 'selectionSort',     algo: selectionSortAlgorithm },
    { key: 'shellSort',         algo: shellSortAlgorithm },
    { key: 'mergeSort',         algo: mergeSortAlgorithm },
    { key: 'mergeSortInPlace',  algo: mergeSortInPlaceAlgorithm },
    { key: 'heapSort',          algo: heapSortAlgorithm },
    { key: 'quickSort',         algo: quickSortAlgorithm },
    { key: 'countingSort',      algo: countingSortAlgorithm },
];

const SEARCHES: Array<{ key: string; algo: SearchAlgorithm }> = [
    { key: 'linearSearch',        algo: linearSearchAlgorithm },
    { key: 'binarySearch',        algo: binarySearchAlgorithm },
    { key: 'jumpSearch',          algo: jumpSearchAlgorithm },
    { key: 'interpolationSearch', algo: interpolationSearchAlgorithm },
];

function arraysEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
}

async function runSortCorrectness(input: number[]): Promise<Array<{ name: string; ok: boolean; ms: number; detail: string }>> {
    const expected = [...input].sort((a, b) => a - b);
    const rows: Array<{ name: string; ok: boolean; ms: number; detail: string }> = [];

    for (const { key, algo } of SORTS) {
        const data = [...input];
        const { proxy, swap } = createDataProxy(data);
        const probe = (i: number) => data[i];
        const compare = (_i: number, _j: number) => { void _i; void _j; };
        const t0 = performance.now();
        try {
            await algo.sort(proxy, swap, probe, compare);
            const ms = performance.now() - t0;
            const ok = arraysEqual(data, expected);
            rows.push({ name: key, ok, ms, detail: ok ? `ordenado (${data.length} elem.)` : `salida: [${data.slice(0,8).join(',')}…]` });
        } catch (e) {
            rows.push({ name: key, ok: false, ms: performance.now() - t0, detail: (e as Error).message });
        }
    }
    return rows;
}

async function runSearchCorrectness(sorted: number[], target: number): Promise<Array<{ name: string; ok: boolean; ms: number; detail: string }>> {
    const expectedIdx = sorted.indexOf(target);
    const rows: Array<{ name: string; ok: boolean; ms: number; detail: string }> = [];

    for (const { key, algo } of SEARCHES) {
        const { proxy } = createSearchProxy([...sorted]);
        let result: { kind: 'found'; idx: number } | { kind: 'notFound' } | null = null;
        const signal: SearchSignal = {
            found: (idx) => { result = { kind: 'found', idx }; },
            notFound: () => { result = { kind: 'notFound' }; },
            setRange: () => {},
        };
        const t0 = performance.now();
        try {
            await algo.search(proxy, target, signal);
            const ms = performance.now() - t0;
            let ok = false;
            let detail = '';
            const r = result as { kind: 'found'; idx: number } | { kind: 'notFound' } | null;
            if (expectedIdx === -1) {
                ok = r !== null && r.kind === 'notFound';
                detail = ok ? 'notFound (correcto)' : `inesperado: ${JSON.stringify(r)}`;
            } else {
                ok = r !== null && r.kind === 'found' && sorted[r.idx] === target;
                detail = ok && r && r.kind === 'found' ? `found idx=${r.idx}` : `inesperado: ${JSON.stringify(r)}`;
            }
            rows.push({ name: key, ok, ms, detail });
        } catch (e) {
            rows.push({ name: key, ok: false, ms: performance.now() - t0, detail: (e as Error).message });
        }
    }
    return rows;
}

function shuffled(n: number): number[] {
    const a = Array.from({ length: n }, (_, i) => i + 1);
    for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

function renderCorrectnessTable(sortRows: ReturnType<typeof runSortCorrectness> extends Promise<infer T> ? T : never, searchRows: ReturnType<typeof runSearchCorrectness> extends Promise<infer T> ? T : never, n: number, target: number): string {
    const all = [...sortRows, ...searchRows];
    const allOk = all.every(r => r.ok);
    const tableRows = all.map(r => `
        <tr>
          <td>${r.name}</td>
          <td class="${r.ok ? 'ok' : 'fail'}">${r.ok ? 'OK' : 'FAIL'}</td>
          <td class="num">${r.ms.toFixed(1)} ms</td>
          <td>${r.detail}</td>
        </tr>`).join('');
    return `
      <table>
        <thead><tr><th>Algoritmo</th><th>Resultado</th><th class="num">Tiempo</th><th>Detalle</th></tr></thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="pass-banner ${allOk ? 'ok' : 'fail'}">
        ${allOk ? `${all.length}/${all.length} correctos` : `${all.filter(r=>!r.ok).length} fallos`}
      </div>
      <div class="meta">n=${n}, target=${target}.</div>
    `;
}

async function runProxyValidation(): Promise<string> {
    type Scenario = { name: string; cExp: number; sExp: number; run: (proxy: number[], swap: (i: number, j: number) => void) => void };

    const scenarios: Scenario[] = [
        {
            name: 'Lecturas pareadas',
            cExp: 3, sExp: 0,
            run: (p) => { void p[0]; void p[1]; void p[2]; void p[3]; void p[4]; void p[5]; },
        },
        {
            name: 'Escrituras directas',
            cExp: 0, sExp: 4,
            run: (p) => { p[0] = 10; p[1] = 20; p[2] = 30; p[3] = 40; },
        },
        {
            name: 'Swap supresor de COMPARE',
            cExp: 0, sExp: 6,
            run: (_p, swap) => { swap(0, 1); swap(2, 3); swap(4, 5); },
        },
        {
            name: 'Lectura aislada (sin pareja)',
            cExp: 0, sExp: 0,
            run: (p) => { void p[2]; },
        },
        {
            name: 'Mixto: 2 pares + 2 SET',
            cExp: 2, sExp: 2,
            run: (p) => { void p[0]; void p[1]; p[2] = 99; void p[3]; void p[4]; p[5] = 77; },
        },
    ];

    const rows: Array<{ name: string; cExp: number; cReal: number; sExp: number; sReal: number; ok: boolean }> = [];

    for (const s of scenarios) {
        const data = Array.from({ length: 6 }, (_, i) => i + 1);
        const capture = installEventCapture();
        const { proxy, swap } = createDataProxy(data);
        s.run(proxy, swap);
        capture.restore();
        const ok = capture.counts.COMPARE === s.cExp && capture.counts.SET === s.sExp;
        rows.push({ name: s.name, cExp: s.cExp, cReal: capture.counts.COMPARE, sExp: s.sExp, sReal: capture.counts.SET, ok });
    }

    // Validación 2: linear search sobre array de N elementos buscando elemento en posición k
    // -> emite exactamente k+1 PROBE.
    const linearCases = [{ n: 50, k: 0 }, { n: 50, k: 24 }, { n: 50, k: 49 }];
    const searchRows: Array<{ caso: string; n: number; k: number; pExp: number; pReal: number; ok: boolean }> = [];
    for (const { n, k } of linearCases) {
        const sorted = Array.from({ length: n }, (_, i) => i + 1);
        const target = sorted[k];
        const capture = installEventCapture();
        const { proxy } = createSearchProxy([...sorted]);
        await linearSearchAlgorithm.search(proxy, target, { found: () => {}, notFound: () => {}, setRange: () => {} });
        capture.restore();
        const pExp = k + 1;
        const ok = capture.counts.PROBE === pExp;
        searchRows.push({ caso: 'Linear', n, k, pExp, pReal: capture.counts.PROBE, ok });
    }

    const allOk = rows.every(r => r.ok) && searchRows.every(r => r.ok);

    const sortHTML = rows.map(r => `
      <tr>
        <td>${r.name}</td>
        <td class="num">${r.cExp}</td>
        <td class="num">${r.cReal}</td>
        <td class="num">${r.sExp}</td>
        <td class="num">${r.sReal}</td>
        <td class="${r.ok ? 'ok' : 'fail'}">${r.ok ? 'OK' : 'FAIL'}</td>
      </tr>`).join('');

    const searchHTML = searchRows.map(r => `
      <tr>
        <td>Linear n=${r.n}, k=${r.k}</td>
        <td class="num">${r.pExp}</td>
        <td class="num">${r.pReal}</td>
        <td class="${r.ok ? 'ok' : 'fail'}">${r.ok ? 'OK' : 'FAIL'}</td>
      </tr>`).join('');

    return `
      <table>
        <thead><tr><th>Caso</th><th class="num">COMPARE esp.</th><th class="num">COMPARE real</th><th class="num">SET esp.</th><th class="num">SET real</th><th>Veredicto</th></tr></thead>
        <tbody>${sortHTML}</tbody>
      </table>
      <table style="margin-top:18px">
        <thead><tr><th>Caso</th><th class="num">PROBE esp.</th><th class="num">PROBE real</th><th>Veredicto</th></tr></thead>
        <tbody>${searchHTML}</tbody>
      </table>
      <div class="pass-banner ${allOk ? 'ok' : 'fail'}">
        ${allOk ? 'Eventos emitidos correctos' : 'Discrepancia'}
      </div>
    `;
}

document.getElementById('run-correctness')!.addEventListener('click', async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    const out = document.getElementById('correctness-output')!;
    btn.disabled = true; out.innerHTML = '<div class="meta">Ejecutando…</div>';
    setTimings(0);
    const capture = installEventCapture();
    try {
        const n = 30;
        const input = shuffled(n);
        const sortRows = await runSortCorrectness(input);
        const sorted = [...input].sort((a, b) => a - b);
        const target = sorted[Math.floor(n / 2)];
        const searchRows = await runSearchCorrectness(sorted, target);
        out.innerHTML = renderCorrectnessTable(sortRows, searchRows, n, target);
    } finally {
        capture.restore();
        btn.disabled = false;
    }
});

document.getElementById('run-proxy')!.addEventListener('click', async (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    const out = document.getElementById('proxy-output')!;
    btn.disabled = true; out.innerHTML = '<div class="meta">Ejecutando…</div>';
    setTimings(0);
    try {
        out.innerHTML = await runProxyValidation();
    } finally {
        btn.disabled = false;
    }
});
