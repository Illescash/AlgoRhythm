import { useEffect } from 'react';
import { MainLayout } from './components/layout/MainLayout';
import { Visualizer } from './components/visualizer/Visualizer';
import { initTerminalBridge } from './core/terminalBridge';

function App() {
  useEffect(() => {
    initTerminalBridge();
  }, []);

  return (
    <MainLayout>
      <div className="h-full flex flex-col">
        <Visualizer />
      </div>
    </MainLayout>
  );
}

export default App;
