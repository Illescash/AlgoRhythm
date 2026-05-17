import { useStore } from '../../store';
import { useRunner } from '../../core/runner';
import type { SearchAlgorithmKey } from '../../store/types';
import {
    Section, AlgoSelector, Slider, WaveformSelector, MiniButton, RunButton,
} from '../ui/controls';

const SEARCH_OPTIONS: { id: SearchAlgorithmKey; label: string; complexity: string }[] = [
    { id: 'linear',        label: 'Linear Search',        complexity: 'O(n)' },
    { id: 'jump',          label: 'Jump Search',          complexity: 'O(√n) · sorted' },
    { id: 'binary',        label: 'Binary Search',        complexity: 'O(log n) · sorted' },
    { id: 'interpolation', label: 'Interpolation Search', complexity: 'O(log log n) · sorted' },
];

export function SearchSidebar() {
    const runState = useStore(s => s.runState);
    const isRunning = runState === 'running';

    const array = useStore(s => s.array);
    const searchConfig = useStore(s => s.searchConfig);
    const updateSearchConfig = useStore(s => s.updateSearchConfig);
    const sortArrayAsc = useStore(s => s.sortArrayAsc);
    const shuffleArray = useStore(s => s.shuffleArray);
    const resizeArray = useStore(s => s.resizeArray);

    const { startSearch, stop } = useRunner();

    const buttonState = isRunning
        ? 'running'
        : runState === 'found' || runState === 'notFound'
        ? 'done'
        : 'idle';

    const clamp = (n: number) => isNaN(n) ? 1 : Math.max(1, Math.min(100, Math.floor(n)));
    const setTarget = (v: number) => updateSearchConfig({ target: clamp(v) });

    const pickFromArray = () => {
        const v = array[Math.floor(Math.random() * array.length)];
        if (typeof v === 'number') setTarget(v);
    };

    return (
        <div className="h-full flex flex-col min-h-0 overflow-y-auto">
            <Section title="ALGORITHM" index="01">
                <AlgoSelector
                    options={SEARCH_OPTIONS}
                    value={searchConfig.algorithm}
                    disabled={isRunning}
                    onChange={v => updateSearchConfig({ algorithm: v })}
                />
                {(searchConfig.algorithm === 'binary' || searchConfig.algorithm === 'jump' || searchConfig.algorithm === 'interpolation') && (
                    <p className="mt-2 text-[11px] leading-snug"
                       style={{ color: 'var(--text-2)' }}>
                        {searchConfig.algorithm === 'binary' ? 'Binary' : searchConfig.algorithm === 'jump' ? 'Jump' : 'Interpolation'} Search requires a <span style={{ color: 'var(--amber)' }}>sorted array</span>. Use <strong className="mono">SORT ↑</strong> below before running.
                    </p>
                )}
            </Section>

            <Section title="TARGET" index="02">
                <div
                    style={{
                        background: 'var(--bg-2)',
                        border: '1px solid var(--line)',
                        borderRadius: 8,
                        padding: '10px 14px',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: 12,
                        alignItems: 'center',
                    }}
                >
                    <input
                        type="number"
                        min={1}
                        max={100}
                        value={searchConfig.target}
                        disabled={isRunning}
                        onChange={e => setTarget(Number(e.target.value))}
                        className="mono"
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--text-0)',
                            fontSize: 26,
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            width: '100%',
                            padding: 0,
                        }}
                    />
                    <div className="target-ref"
                         style={{ '--target-pct': `${searchConfig.target}%` } as React.CSSProperties}/>
                </div>

                <div className="grid grid-cols-4 gap-1 mt-2">
                    <MiniButton disabled={isRunning} onClick={() => setTarget(searchConfig.target - 1)}>−1</MiniButton>
                    <MiniButton disabled={isRunning} onClick={() => setTarget(searchConfig.target + 1)}>+1</MiniButton>
                    <MiniButton disabled={isRunning}
                                onClick={() => setTarget(Math.floor(Math.random() * 100) + 1)}
                                title="Valor aleatorio 1-100">⟳ Rnd</MiniButton>
                    <MiniButton disabled={isRunning} intent="indigo" onClick={pickFromArray} title="Elige un valor existente en el array">⌖ Pick</MiniButton>
                </div>

                <p className="mt-2 text-[10px] leading-snug"
                   style={{ color: 'var(--text-3)' }}>
                    Tip: haz click sobre una barra en el visualizador para fijarla como target.
                </p>
            </Section>

            <Section title="DATA" index="03">
                <Slider
                    label="Array size"
                    value={searchConfig.arraySize}
                    min={20}
                    max={500}
                    step={10}
                    unit=" items"
                    ticks={['small', 'large']}
                    disabled={isRunning}
                    onChange={v => resizeArray(v)}
                />
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                    <MiniButton disabled={isRunning} onClick={shuffleArray} title="Array aleatorio">
                        ⟳ Shuffle
                    </MiniButton>
                    <MiniButton disabled={isRunning} intent="indigo" onClick={sortArrayAsc}
                                title="Ordenar ascendente (requerido para Binary Search)">
                        ↑ SORT
                    </MiniButton>
                </div>
            </Section>

            <Section title="TIMING" index="04">
                <Slider
                    label="Speed"
                    sub="CMP"
                    value={searchConfig.cmpMs}
                    min={5}
                    max={600}
                    step={5}
                    unit=" ms"
                    ticks={['fast', 'slow']}
                    disabled={isRunning}
                    onChange={v => updateSearchConfig({ cmpMs: v })}
                />
            </Section>

            <Section title="AUDIO" index="05">
                <Slider
                    label="Volume"
                    value={Math.round(searchConfig.volume * 100)}
                    min={0}
                    max={50}
                    step={1}
                    unit="%"
                    display={`${Math.round(searchConfig.volume * 100)}`}
                    disabled={isRunning}
                    onChange={v => updateSearchConfig({ volume: v / 100 })}
                />
                <div className="mb-1.5 mono text-[10px] tracking-[0.14em] uppercase"
                     style={{ color: 'var(--text-3)' }}>
                    WAVEFORM
                </div>
                <WaveformSelector
                    value={searchConfig.waveform}
                    disabled={isRunning}
                    onChange={v => updateSearchConfig({ waveform: v })}
                />
            </Section>

            <div className="p-4 mt-auto">
                <RunButton
                    state={buttonState}
                    onStart={startSearch}
                    onStop={stop}
                    labelIdle="SEARCH · EXECUTE"
                    labelDone={runState === 'found' ? 'FOUND · RUN AGAIN' : 'NOT FOUND · RUN AGAIN'}
                />
            </div>
        </div>
    );
}
