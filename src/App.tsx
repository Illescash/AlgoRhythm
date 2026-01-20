import { useEffect, useRef } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { Visualizer } from './components/visualizer/Visualizer';
import { initTerminalBridge } from './core/terminalBridge';
import { initWorkerBridge } from './core/workerBridge';
import { eventBus } from './core/eventBus';

function App() {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    // Inicializar puentes
    initTerminalBridge();

    // Inicializar Web Worker
    const worker = new Worker(new URL('./workers/algorithm.worker.ts', import.meta.url), {
      type: 'module'
    });
    workerRef.current = worker;
    initWorkerBridge(worker);

    return () => {
      worker.terminate();
    };
  }, []);

  const startSort = () => {
    if (workerRef.current) {
      // Generar datos aleatorios únicos para ambos
      const randomData = Array.from({ length: 50 }, () => Math.floor(Math.random() * 90) + 10);

      // 1. Sincronizar el visualizador primero
      eventBus.emit({ type: 'INITIALIZE', data: randomData });

      // 2. Iniciar el worker con los MISMOS datos
      workerRef.current.postMessage({ type: 'START', data: [...randomData] });
    }
  };

  return (
    <MainLayout>
      <div className="h-full flex flex-col gap-4">
        <div className="flex justify-end px-4">
          <button
            onClick={startSort}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-indigo-500/20 border border-indigo-400/30"
          >
            Ejecutar Selection Sort (Worker)
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
