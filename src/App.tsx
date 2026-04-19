import { useEffect, useRef, useState } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { Visualizer } from './engine/visual/Visualizer';
import { initWorkerBridge } from './core/workerBridge';
import { eventBus } from './core/eventBus';
import { audioEngine } from './engine/audio/AudioEngine';

function App() {
  const workerRef = useRef<Worker | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const worker = new Worker(new URL('./workers/algorithm.worker.ts', import.meta.url), {
      type: 'module'
    });
    workerRef.current = worker;
    initWorkerBridge(worker);

    const unsubscribe = eventBus.subscribe((event) => {
      if (event.type === 'DONE') setIsRunning(false);
    });

    return () => {
      worker.terminate();
      unsubscribe();
    };
  }, []);

  const startSort = () => {
    if (!workerRef.current || isRunning) return;

    const randomData = Array.from({ length: 50 }, () => Math.floor(Math.random() * 90) + 10);

    audioEngine.init(randomData);
    eventBus.emit({ type: 'INITIALIZE', data: randomData });
    workerRef.current.postMessage({ type: 'START', data: [...randomData] });
    setIsRunning(true);
  };

  return (
    <MainLayout>
      <div className="h-full flex flex-col gap-4">
        <div className="flex justify-end px-4">
          <button
            onClick={startSort}
            disabled={isRunning}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
          >
            {isRunning ? 'Ordenando...' : 'Ejecutar Merge Sort'}
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
