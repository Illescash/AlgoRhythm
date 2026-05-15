import { useEffect, useRef } from 'react';
import { eventBus } from '../../core/eventBus';
import { useStore } from '../../store';

export function Visualizer() {
    const wrapRef = useRef<HTMLDivElement>(null);

    const barsRef = useRef<HTMLDivElement[]>([]);
    const dataRef = useRef<number[]>([]);
    const rangeRef = useRef<{ low: number; high: number } | null>(null);

    const lowLabelRef = useRef<HTMLDivElement>(null);
    const highLabelRef = useRef<HTMLDivElement>(null);
    const bracketRef = useRef<HTMLDivElement>(null);

    const pendingTimersRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
    const prevLengthRef = useRef(0);

    const mode = useStore(s => s.mode);
    const array = useStore(s => s.array);
    const runState = useStore(s => s.runState);
    const updateSearchConfig = useStore(s => s.updateSearchConfig);
    const sortAlgo = useStore(s => s.sortConfig.algorithm);
    const searchAlgo = useStore(s => s.searchConfig.algorithm);
    const target = useStore(s => s.searchConfig.target);

    const modeRef = useRef(mode);
    modeRef.current = mode;

    const runningRef = useRef(runState === 'running');
    runningRef.current = runState === 'running';

    const updateSearchConfigRef = useRef(updateSearchConfig);
    updateSearchConfigRef.current = updateSearchConfig;

    // duración del highlight calculada dinámicamente a partir de la config del store
    // (cmpMs * highlightFactor). Antes se usaba una constante HIGHLIGHT_MS = WRITE_MS * 5 que
    // hacía que el slider de highlightFactor no tuviera efecto. Vía ref para no recrear la
    // suscripción al EventBus cada vez que cambia la config.
    const cmpMs = useStore(s => s.sortConfig.cmpMs);
    const highlightFactor = useStore(s => s.sortConfig.highlightFactor);
    const highlightMsRef = useRef(cmpMs * highlightFactor);
    highlightMsRef.current = cmpMs * highlightFactor;

    const hideBracket = () => {
        if (lowLabelRef.current) lowLabelRef.current.style.display = 'none';
        if (highLabelRef.current) highLabelRef.current.style.display = 'none';
        if (bracketRef.current) bracketRef.current.style.display = 'none';
    };

    const showBracket = (low: number, high: number) => {
        const n = dataRef.current.length;
        if (!n) return;
        const lowPct = ((low + 0.5) / n) * 100;
        const highPct = ((high + 0.5) / n) * 100;

        if (lowLabelRef.current) {
            lowLabelRef.current.style.display = 'block';
            lowLabelRef.current.style.left = `${lowPct}%`;
        }
        if (highLabelRef.current) {
            highLabelRef.current.style.display = 'block';
            highLabelRef.current.style.left = `${highPct}%`;
        }
        if (bracketRef.current) {
            bracketRef.current.style.display = 'block';
            bracketRef.current.style.left = `${Math.min(lowPct, highPct)}%`;
            bracketRef.current.style.width = `${Math.abs(highPct - lowPct)}%`;
        }
    };

    const applyRange = (low: number, high: number) => {
        rangeRef.current = { low, high };
        barsRef.current.forEach((bar, i) => {
            if (!bar) return;
            bar.classList.remove('compare', 'range', 'discarded');
            if (i === low || i === high) bar.classList.add('range');
            else if (i < low || i > high) bar.classList.add('discarded');
        });
        showBracket(low, high);
    };

    const clearRange = () => {
        rangeRef.current = null;
        barsRef.current.forEach(bar => {
            bar?.classList.remove('compare', 'range', 'discarded');
        });
        hideBracket();
    };

    const resetVisualState = () => {
        clearRange();
        barsRef.current.forEach(bar => bar?.classList.remove('found'));
        wrapRef.current?.classList.remove('notfound-flash');
    };

    // full rebuild solo si cambia la longitud; si solo cambian los valores
    // (shuffle/reverse), actualiza alturas in-place para evitar flickering.
    useEffect(() => {
        const wrap = wrapRef.current;
        if (!wrap) return;

        const n = array.length;

        if (n === prevLengthRef.current && barsRef.current.length === n) {
            dataRef.current = [...array];
            array.forEach((value, i) => {
                if (barsRef.current[i]) barsRef.current[i].style.height = `${value}%`;
            });
            resetVisualState();
            return;
        }

        prevLengthRef.current = n;
        barsRef.current.forEach(b => b.remove());
        barsRef.current = [];
        dataRef.current = [...array];

        array.forEach((value, i) => {
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = `${value}%`;
            bar.style.width = `calc(100% / ${n} - 2px)`;
            bar.style.left = `calc(${i} * 100% / ${n})`;
            bar.dataset.idx = String(i);
            bar.style.cursor = 'pointer';
            // ARIA + soporte teclado
            bar.setAttribute('role', 'button');
            bar.setAttribute('tabindex', '0');
            bar.setAttribute('aria-label', `Bar ${i + 1}, value ${value}`);

            const handlePick = () => {
                if (modeRef.current !== 'search' || runningRef.current) return;
                const v = dataRef.current[Number(bar.dataset.idx)];
                if (typeof v === 'number') {
                    updateSearchConfigRef.current({ target: v });
                    bar.animate(
                        [
                            { boxShadow: '0 0 16px rgba(129,140,248,0.9)', transform: 'scaleY(1.05)' },
                            { boxShadow: '0 0 0 rgba(129,140,248,0)', transform: 'scaleY(1)' },
                        ],
                        { duration: 260, easing: 'ease-out' }
                    );
                }
            };

            bar.addEventListener('click', handlePick);
            bar.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handlePick(); }
            });

            wrap.appendChild(bar);
            barsRef.current.push(bar);
        });

        resetVisualState();
        // resetVisualState sólo opera sobre refs; estable en la práctica.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [array]);

    // la vista es la fuente de verdad del array. Al empezar limpia restos visuales;
    // al terminar/parar persiste `dataRef.current` (estado real visible tras todos los SETs)
    // al store. Asi worker y store quedan sincronizados y la siguiente ejecucion arranca
    // sobre el array que el usuario esta viendo (no sobre el original previo al cancel).
    useEffect(() => {
        if (runState === 'running') {
            resetVisualState();
            return;
        }
        if (dataRef.current.length) {
            useStore.getState().setArray([...dataRef.current]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [runState]);

    // Tras un click-to-pick / entrada manual de target, resalta las barras cuyo valor coincide.
    useEffect(() => {
        if (mode !== 'search') return;
        if (runState === 'running') return;
        barsRef.current.forEach((bar, i) => {
            if (!bar) return;
            if (dataRef.current[i] === target) {
                bar.style.boxShadow = '0 0 16px rgba(129,140,248,0.6), 0 0 0 1px rgba(129,140,248,0.8) inset';
            } else {
                bar.style.boxShadow = '';
            }
        });
        return () => {
            barsRef.current.forEach(b => { if (b) b.style.boxShadow = ''; });
        };
    }, [target, mode, runState, array]);

    // Suscripción al EventBus.
    useEffect(() => {
        const unsub = eventBus.subscribe(ev => {
            switch (ev.type) {
                case 'SET': {
                    dataRef.current[ev.index] = ev.value;
                    const bar = barsRef.current[ev.index];
                    if (bar) bar.style.height = `${ev.value}%`;
                    break;
                }
                case 'COMPARE': {
                    ev.indices.forEach(i => {
                        const bar = barsRef.current[i];
                        if (!bar) return;
                        // si una barra está marcada como range/discarded y se compara,
                        // limpiamos esas clases para evitar combinaciones CSS conflictivas.
                        bar.classList.remove('range', 'discarded');
                        bar.classList.add('compare');
                        const id = setTimeout(() => {
                            bar.classList.remove('compare');
                            // Reaplicar range/discarded al expirar el highlight si la barra sigue
                            // dentro del rango activo (binary/jump/interpolation aún en curso).
                            const r = rangeRef.current;
                            if (r) {
                                if (i === r.low || i === r.high) bar.classList.add('range');
                                else if (i < r.low || i > r.high) bar.classList.add('discarded');
                            }
                            pendingTimersRef.current.delete(id);
                        }, highlightMsRef.current);
                        pendingTimersRef.current.add(id);
                    });
                    break;
                }
                case 'PROBE': {
                    // una sola barra resaltada por iteración (search, countingSort).
                    const bar = barsRef.current[ev.index];
                    if (!bar) break;
                    bar.classList.remove('range', 'discarded');
                    bar.classList.add('compare');
                    const idx = ev.index;
                    const id = setTimeout(() => {
                        bar.classList.remove('compare');
                        const r = rangeRef.current;
                        if (r) {
                            if (idx === r.low || idx === r.high) bar.classList.add('range');
                            else if (idx < r.low || idx > r.high) bar.classList.add('discarded');
                        }
                        pendingTimersRef.current.delete(id);
                    }, highlightMsRef.current);
                    pendingTimersRef.current.add(id);
                    break;
                }
                case 'RANGE':
                    applyRange(ev.low, ev.high);
                    break;
                case 'FOUND': {
                    clearRange();
                    const bar = barsRef.current[ev.index];
                    if (bar) bar.classList.add('found');
                    break;
                }
                case 'NOT_FOUND': {
                    clearRange();
                    wrapRef.current?.classList.add('notfound-flash');
                    const nfId = setTimeout(() => {
                        wrapRef.current?.classList.remove('notfound-flash');
                        pendingTimersRef.current.delete(nfId);
                    }, 400);
                    pendingTimersRef.current.add(nfId);
                    break;
                }
                case 'INITIALIZE':
                    break;
                // limpiar bracket L/H si llega DONE sin FOUND/NOT_FOUND previo
                case 'DONE':
                    hideBracket();
                    break;
                // el Visualizer no reacciona visualmente al ERROR (lo gestiona runner.tsx);
                // sólo lo enumeramos para mantener el exhaustive check.
                case 'ERROR':
                    break;
                // al CANCELLED limpiamos rango/bracket para no dejar restos visuales
                // de una búsqueda interrumpida.
                case 'CANCELLED':
                    clearRange();
                    break;

                default: {
                    const _exhaustiveCheck: never = ev;
                    void _exhaustiveCheck;
                }
            }
        });
        const timers = pendingTimersRef.current;
        return () => {
            unsub();
            // cancelar todos los timeouts pendientes al desmontar
            timers.forEach(id => clearTimeout(id));
            timers.clear();
        };
        // applyRange / clearRange / hideBracket sólo operan sobre refs; suscripción única.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const algoName = mode === 'sort' ? sortAlgo : searchAlgo;

    return (
        <div className="relative w-full h-full overflow-hidden"
            style={{ background: 'radial-gradient(1000px 500px at 80% -10%, rgba(99,102,241,0.08), transparent 60%), var(--bg-1)' }}>
            {/* Grid decorativa */}
            <div className="absolute inset-0 pointer-events-none"
                style={{
                    backgroundImage:
                        'linear-gradient(to right, rgba(255,255,255,0.025) 1px, transparent 1px), ' +
                        'linear-gradient(to bottom, rgba(255,255,255,0.025) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
                    WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 90%)',
                }}
            />

            {/* Header info */}
            <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-[2]">
                <div className="text-[11px] tracking-[0.1em] uppercase mono"
                    style={{ color: 'var(--text-2)' }}>
                    {mode === 'sort' ? 'SORTING' : 'SEARCHING'} · <span style={{ color: 'var(--text-1)' }}>{algoName}</span>
                </div>
                <div className="flex items-center gap-2 mono text-[11px] tracking-wider"
                    style={{
                        color: 'var(--text-1)',
                        border: '1px solid var(--line)',
                        background: 'rgba(10,14,26,0.7)',
                        padding: '4px 10px',
                        borderRadius: '999px',
                        backdropFilter: 'blur(4px)',
                    }}>
                    <span className="inline-block w-[6px] h-[6px] rounded-full"
                        style={{
                            background: runState === 'running' ? 'var(--indigo)' : runState === 'found' ? 'var(--green)' : runState === 'notFound' ? 'var(--red)' : 'var(--text-3)',
                            boxShadow: runState === 'running' ? '0 0 8px var(--indigo)' : undefined,
                            animation: runState === 'running' ? 'pulse 1.6s infinite' : undefined,
                        }} />
                    {runState.toUpperCase()}
                </div>
            </div>

            {/* Zona de barras */}
            <div className="absolute left-0 right-0"
                style={{ top: 40, bottom: 24 }}>
                {/* L / H labels + bracket */}
                <div ref={lowLabelRef} className="range-label" style={{ display: 'none', top: 2 }}>L</div>
                <div ref={highLabelRef} className="range-label" style={{ display: 'none', top: 2 }}>H</div>
                <div ref={bracketRef} className="range-bracket" style={{ display: 'none', top: 22 }} />

                <div
                    ref={wrapRef}
                    className="bars absolute left-4 right-4"
                    style={{ top: 36, bottom: 0 }}
                />
            </div>

            {/* Baseline + label */}
            <div className="absolute left-0 right-0 pointer-events-none"
                style={{
                    bottom: 24, height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                }} />
            <div className="absolute bottom-1.5 left-4 text-[10px] tracking-[0.1em] uppercase mono"
                style={{ color: 'var(--text-3)' }}>
                Index →
            </div>
            <div className="absolute bottom-1.5 right-4 text-[10px] tracking-[0.1em] uppercase mono"
                style={{ color: 'var(--text-3)' }}>
                Value ↑
            </div>

            <style>{`@keyframes pulse { 0%,100%{opacity: 1;} 50%{opacity: 0.35;} }`}</style>
        </div>
    );
}
