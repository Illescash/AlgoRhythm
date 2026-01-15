import { MainLayout } from './components/layout/MainLayout';

function App() {
  return (
    <MainLayout>
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            Fase 1: Entorno Listo
          </h2>
          <p className="text-slate-400 text-lg">
            Esperando Visualizador...
          </p>
        </div>
      </div>
    </MainLayout>
  );
}

export default App;
