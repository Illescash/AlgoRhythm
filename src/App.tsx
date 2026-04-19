import { useEffect, useRef } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { Visualizer } from './engine/visual/Visualizer';
import { initWorkerBridge } from './core/workerBridge';
import { eventBus } from './core/eventBus';
import { audioEngine } from './engine/audio/AudioEngine';
import { useStore } from './store';

function App() {
  const workerRef = useRef<Worker | null>(null);

  const { mode, runState, array, searchResult, sortConfig, searchConfig,
          setRunState, setSearchResult } = useStore();

  const isRunning = runState === 'running';

  useEffect(() => {
    const worker = new Worker(new URL('./workers/algorithm.worker.ts', import.meta.url), {
      type: 'module'
    });
    workerRef.current = worker;
    initWorkerBridge(worker);

    const unsubscribe = eventBus.subscribe((event) => {
      if (event.type === 'DONE')      { setRunState('done'); }
      if (event.type === 'FOUND')     { setRunState('found');    setSearchResult(event.index); }
      if (event.type === 'NOT_FOUND') { setRunState('notFound'); setSearchResult(null); }
    });

    return () => { worker.terminate(); unsubscribe(); };
  }, []);

  const startSort = () => {
    if (!workerRef.current || isRunning) return;
    setSearchResult(null);
    setRunState('running');
    audioEngine.init(array);
    audioEngine.setWaveform(sortConfig.waveform);
    audioEngine.setVolume(sortConfig.volume);
    eventBus.emit({ type: 'INITIALIZE', data: array });
    workerRef.current.postMessage({
      type: 'START', mode: 'sort',
      data: [...array],
      algorithm: sortConfig.algorithm,
      cmpMs: sortConfig.cmpMs,
    });
  };

  const startSearch = () => {
    if (!workerRef.current || isRunning) return;
    setSearchResult(null);
    setRunState('running');
    audioEngine.init(array);
    audioEngine.setWaveform(searchConfig.waveform);
    audioEngine.setVolume(searchConfig.volume);
    eventBus.emit({ type: 'INITIALIZE', data: array });
    workerRef.current.postMessage({
      type: 'START', mode: 'search',
      data: [...array],
      algorithm: searchConfig.algorithm,
      target: searchConfig.target,
      cmpMs: searchConfig.cmpMs,
    });
  };

  const stop = () => {
    workerRef.current?.postMessage({ type: 'CANCEL' });
  };

  const resultLabel = runState === 'found'
    ? `Encontrado en índice ${searchResult}`
    : runState === 'notFound'
    ? 'No encontrado'
    : null;

  return (
    <MainLayout>
      <div className="h-full flex flex-col gap-4">
        <div className="flex items-center justify-end gap-3 px-4">
          {resultLabel && (
            <span className="text-sm font-mono text-slate-300 bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
              {resultLabel}
            </span>
          )}
          {isRunning && (
            <button
              onClick={stop}
              className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors border border-red-500/30"
            >
              Detener
            </button>
          )}
          <button
            onClick={startSearch}
            disabled={isRunning}
            className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-amber-500/20 border border-amber-400/30"
          >
            {isRunning && mode === 'search' ? 'Buscando...' : 'Test Linear Search'}
          </button>
          <button
            onClick={startSort}
            disabled={isRunning}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
          >
            {isRunning && mode === 'sort' ? 'Ordenando...' : 'Test Quick Sort'}
          </button>
        </div>
        <div className="flex-1">
          <Visualizer />
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
