import { useEffect, useRef, useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { Visualizer } from './engine/visual/Visualizer';
import { initWorkerBridge } from './core/workerBridge';
import { eventBus } from './core/eventBus';
import { audioEngine } from './engine/audio/AudioEngine';

function App() {
  const workerRef = useRef<Worker | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);

  useEffect(() => {
    const worker = new Worker(new URL('./workers/algorithm.worker.ts', import.meta.url), {
      type: 'module'
    });
    workerRef.current = worker;
    initWorkerBridge(worker);

    const unsubscribe = eventBus.subscribe((event) => {
      if (event.type === 'DONE') setIsRunning(false);
      if (event.type === 'FOUND') { setIsRunning(false); setSearchResult(`Encontrado en índice ${event.index}`); }
      if (event.type === 'NOT_FOUND') { setIsRunning(false); setSearchResult('No encontrado'); }
    });

    return () => {
      worker.terminate();
      unsubscribe();
    };
  }, []);

  const startSort = () => {
    if (!workerRef.current || isRunning) return;
    setSearchResult(null);
    const randomData = Array.from({ length: 50 }, () => Math.floor(Math.random() * 90) + 10);
    audioEngine.init(randomData);
    eventBus.emit({ type: 'INITIALIZE', data: randomData });
    workerRef.current.postMessage({ type: 'START', mode: 'sort', data: [...randomData] });
    setIsRunning(true);
  };

  const startSearch = () => {
    if (!workerRef.current || isRunning) return;
    setSearchResult(null);
    const randomData = Array.from({ length: 50 }, () => Math.floor(Math.random() * 90) + 10);
    // Target aleatorio en rango del array - puede o no estar presente
    const target = Math.floor(Math.random() * 90) + 10;
    audioEngine.init(randomData);
    eventBus.emit({ type: 'INITIALIZE', data: randomData });
    workerRef.current.postMessage({ type: 'START', mode: 'search', data: [...randomData], algorithm: 'linear', target });
    setIsRunning(true);
  };

  return (
    <MainLayout>
      <div className="h-full flex flex-col gap-4">
        <div className="flex items-center justify-end gap-3 px-4">
          {searchResult && (
            <span className="text-sm font-mono text-slate-300 bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
              {searchResult}
            </span>
          )}
          <button
            onClick={startSearch}
            disabled={isRunning}
            className="bg-amber-600 hover:bg-amber-500 disabled:bg-amber-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-amber-500/20 border border-amber-400/30"
          >
            {isRunning ? 'Buscando...' : 'Test Linear Search'}
          </button>
          <button
            onClick={startSort}
            disabled={isRunning}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
          >
            {isRunning ? 'Ordenando...' : 'Ejecutar Quick Sort'}
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
