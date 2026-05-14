import { useEffect, useRef, useState } from 'react';
import { eventBus } from '../../core/eventBus';
import { useStore } from '../../store';

interface Stats {
    compares: number;
    writes: number;
    elapsed: number; // ms
}

const ZERO: Stats = { compares: 0, writes: 0, elapsed: 0 };

// Hook que acumula métricas mientras el motor corre.
function useStats() {
    const [stats, setStats] = useState<Stats>(ZERO);
    const startedAt = useRef<number | null>(null);
    const rafRef = useRef<number | null>(null);
    const runState = useStore(s => s.runState);
    // incluimos runId como dep para forzar el reset incluso cuando
    // runState pasa de 'running' -> 'running' (un STOP+RUN rápido donde Zustand deduplica).
    const runId = useStore(s => s.runId);

    useEffect(() => {
        if (runState === 'running') {
            setStats(ZERO);
            startedAt.current = performance.now();

            const tick = () => {
                if (startedAt.current === null) return;
                setStats(s => ({ ...s, elapsed: performance.now() - startedAt.current! }));
                rafRef.current = requestAnimationFrame(tick);
            };
            rafRef.current = requestAnimationFrame(tick);
        } else {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
            rafRef.current = null;
            // Al terminar, fijamos el elapsed final. IMPORTANTE: calcular el valor ANTES de
            // poner startedAt a null - la callback de setStats es asíncrona y, si lee el ref
            // después de nulificarlo, `performance.now() - null` da el tiempo desde que se
            // cargó la página (valor enorme, que aparenta "elapsed acumulado").
            if (startedAt.current !== null) {
                const finalElapsed = performance.now() - startedAt.current;
                startedAt.current = null;
                setStats(s => ({ ...s, elapsed: finalElapsed }));
            }
        }
        return () => {
            if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
        };
    }, [runState, runId]);

    // Suscripción al EventBus - acumula en un ref y hace flush 1x/frame con RAF.
    const accRef = useRef({ compares: 0, writes: 0 });
    useEffect(() => {
        const acc = accRef.current;
        let flushRaf: number | null = null;

        const flush = () => {
            flushRaf = null;
            const { compares, writes } = acc;
            acc.compares = 0; acc.writes = 0;
            setStats(s => ({ ...s, compares: s.compares + compares, writes: s.writes + writes }));
        };

        const unsub = eventBus.subscribe(ev => {
            // PROBE cuenta como una comparación (target/valor externo vs array[i]).
            if (ev.type === 'COMPARE' || ev.type === 'PROBE') { acc.compares++; }
            else if (ev.type === 'SET') { acc.writes++; }
            else return;
            if (flushRaf === null) flushRaf = requestAnimationFrame(flush);
        });

        return () => {
            unsub();
            if (flushRaf !== null) cancelAnimationFrame(flushRaf);
        };
    }, []);

    // Descartar eventos pendientes al iniciar una nueva ejecución para que no contaminen sus métricas.
    useEffect(() => {
        accRef.current.compares = 0;
        accRef.current.writes = 0;
    }, [runId]);

    return stats;
}

interface CellProps {
    label: string;
    children: React.ReactNode;
    accent?: boolean;
    color?: string;
}

function Cell({ label, children, accent, color }: CellProps) {
    return (
        <div style={{
            padding: '10px 14px',
            borderRight: '1px solid var(--line-soft)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 2,
        }}>
            <span className="uppercase tracking-[0.12em]"
                  style={{ color: 'var(--text-3)', fontSize: 10 }}>{label}</span>
            <span className="mono font-semibold"
                  style={{
                      color: color ?? (accent ? 'var(--indigo-soft)' : 'var(--text-0)'),
                      fontSize: 16,
                      letterSpacing: '-0.01em',
                  }}>
                {children}
            </span>
        </div>
    );
}

function formatSec(ms: number) {
    return (ms / 1000).toFixed(2);
}

export function StatStrip() {
    const mode = useStore(s => s.mode);
    const runState = useStore(s => s.runState);
    const array = useStore(s => s.array);
    const sortConfig = useStore(s => s.sortConfig);
    const searchConfig = useStore(s => s.searchConfig);
    const searchResult = useStore(s => s.searchResult);
    const errorMessage = useStore(s => s.errorMessage);

    const stats = useStats();

    const statusForSort =
        runState === 'running'   ? { text: 'RUNNING',                           color: 'var(--indigo-soft)' } :
        runState === 'done'      ? { text: 'SORTED',                            color: 'var(--green)' } :
        runState === 'cancelled' ? { text: 'CANCELLED',                         color: 'var(--amber)' } :
        runState === 'error'     ? { text: `ERROR: ${errorMessage ?? 'unknown'}`, color: 'var(--red)' } :
                                   { text: 'IDLE',                              color: 'var(--text-2)' };

    const resultForSearch =
        runState === 'found'     ? { text: `FOUND · idx ${searchResult}`,         color: 'var(--green)' } :
        runState === 'notFound'  ? { text: 'NOT FOUND',                            color: 'var(--red)' } :
        runState === 'running'   ? { text: 'searching…',                           color: 'var(--text-2)' } :
        runState === 'error'     ? { text: `ERROR: ${errorMessage ?? 'unknown'}`,  color: 'var(--red)' } :
                                   { text: '—',                                    color: 'var(--text-2)' };

    if (mode === 'sort') {
        return (
            <div className="grid grid-cols-6"
                 style={{
                     borderTop: '1px solid var(--line-soft)',
                     background: 'linear-gradient(180deg, rgba(15,20,32,0.6), rgba(10,14,26,0.9))',
                     minHeight: 64,
                 }}>
                <Cell label="Algorithm" color="var(--text-0)">{sortConfig.algorithm}</Cell>
                <Cell label="Array · N">{array.length}</Cell>
                <Cell label="Comparisons" accent>{stats.compares.toLocaleString()}</Cell>
                <Cell label="Writes">{stats.writes.toLocaleString()}</Cell>
                <Cell label="Elapsed">{formatSec(stats.elapsed)}<span style={{ color: 'var(--text-2)', fontWeight: 400, fontSize: 11, marginLeft: 3 }}>s</span></Cell>
                <Cell label="Status" color={statusForSort.color}>{statusForSort.text}</Cell>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-4"
             style={{
                 borderTop: '1px solid var(--line-soft)',
                 background: 'linear-gradient(180deg, rgba(15,20,32,0.6), rgba(10,14,26,0.9))',
                 minHeight: 64,
             }}>
            <Cell label="Target" accent>{searchConfig.target}</Cell>
            <Cell label="Comparisons">{stats.compares.toLocaleString()}</Cell>
            <Cell label="Elapsed">{formatSec(stats.elapsed)}<span style={{ color: 'var(--text-2)', fontWeight: 400, fontSize: 11, marginLeft: 3 }}>s</span></Cell>
            <Cell label="Result" color={resultForSearch.color}>{resultForSearch.text}</Cell>
        </div>
    );
}
