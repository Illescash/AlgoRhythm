import { MainLayout } from './components/layout/MainLayout';
import { RunnerProvider } from './core/runner';

function App() {
    return (
        <RunnerProvider>
            <MainLayout/>
        </RunnerProvider>
    );
}

export default App;
