import { useStore } from '../../store';
import { useRunner } from '../../core/runner';
import type { SortAlgorithmKey } from '../../store/types';
import {
    Section, AlgoSelector, Slider, WaveformSelector, MiniButton, RunButton,
} from '../ui/controls';

const SORT_OPTIONS: { id: SortAlgorithmKey; label: string; complexity: string }[] = [
    { id: 'bubbleSort',       label: 'Bubble Sort',    complexity: 'O(n²)' },
    { id: 'insertionSort',    label: 'Insertion Sort', complexity: 'O(n²)' },
    { id: 'selectionSort',    label: 'Selection Sort', complexity: 'O(n²)' },
    { id: 'shellSort',        label: 'Shell Sort',     complexity: 'O(n log² n)' },
    { id: 'mergeSort',        label: 'Merge Sort',     complexity: 'O(n log n)' },
    { id: 'mergeSortInPlace', label: 'Merge In-Place', complexity: 'O(n log n)' },
    { id: 'heapSort',         label: 'Heap Sort',      complexity: 'O(n log n)' },
    { id: 'quickSort',        label: 'Quick Sort',     complexity: 'O(n log n) avg' },
    { id: 'countingSort',     label: 'Counting Sort',  complexity: 'O(n + k)' },
];

export function SortSidebar() {
    const runState = useStore(s => s.runState);
    const isRunning = runState === 'running';

    const sortConfig = useStore(s => s.sortConfig);
    const updateSortConfig = useStore(s => s.updateSortConfig);
    const shuffleArray = useStore(s => s.shuffleArray);
    const reverseArray = useStore(s => s.reverseArray);
    const resizeArray = useStore(s => s.resizeArray);

    const { startSort, stop } = useRunner();

    const buttonState = isRunning
        ? 'running'
        : runState === 'done'
        ? 'done'
        : 'idle';

    const handleSizeChange = (size: number) => resizeArray(size);

    return (
        <div className="h-full flex flex-col min-h-0 overflow-y-auto">
            <Section title="ALGORITHM" index="01">
                <AlgoSelector
                    options={SORT_OPTIONS}
                    value={sortConfig.algorithm}
                    disabled={isRunning}
                    onChange={v => updateSortConfig({ algorithm: v })}
                />
            </Section>

            <Section title="DATA" index="02">
                <Slider
                    label="Array size"
                    value={sortConfig.arraySize}
                    min={10}
                    max={200}
                    step={5}
                    display={`${sortConfig.arraySize}`}
                    unit=" items"
                    ticks={['10', '200']}
                    disabled={isRunning}
                    onChange={handleSizeChange}
                />
                <div className="grid grid-cols-2 gap-1.5 mt-2">
                    <MiniButton disabled={isRunning} onClick={shuffleArray} title="Mezclar (aleatorio)">
                        ⟳ Shuffle
                    </MiniButton>
                    <MiniButton disabled={isRunning} onClick={reverseArray} title="Invertir (peor caso quicksort)">
                        ↕ Reverse
                    </MiniButton>
                </div>
            </Section>

            <Section title="TIMING" index="03">
                <Slider
                    label="Speed"
                    sub="CMP"
                    value={sortConfig.cmpMs}
                    min={5}
                    max={80}
                    step={1}
                    unit=" ms"
                    ticks={['fast', 'slow']}
                    disabled={isRunning}
                    onChange={v => updateSortConfig({ cmpMs: v })}
                />
                <Slider
                    label="Highlight"
                    sub="FACTOR"
                    value={sortConfig.highlightFactor}
                    min={2}
                    max={10}
                    step={1}
                    unit="×"
                    disabled={isRunning}
                    onChange={v => updateSortConfig({ highlightFactor: v })}
                />
            </Section>

            <Section title="AUDIO" index="04">
                <Slider
                    label="Volume"
                    value={Math.round(sortConfig.volume * 100)}
                    min={0}
                    max={50}
                    step={1}
                    unit="%"
                    display={`${Math.round(sortConfig.volume * 100)}`}
                    onChange={v => updateSortConfig({ volume: v / 100 })}
                />
                <div className="mb-1.5 mono text-[10px] tracking-[0.14em] uppercase"
                     style={{ color: 'var(--text-3)' }}>
                    WAVEFORM
                </div>
                <WaveformSelector
                    value={sortConfig.waveform}
                    onChange={v => updateSortConfig({ waveform: v })}
                />
            </Section>

            <div className="p-4 mt-auto">
                <RunButton
                    state={buttonState}
                    onStart={startSort}
                    onStop={stop}
                    labelIdle="RUN · EXECUTE"
                    labelDone="DONE · RUN AGAIN"
                />
            </div>
        </div>
    );
}
