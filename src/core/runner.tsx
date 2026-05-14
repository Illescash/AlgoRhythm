import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { eventBus } from './eventBus';
import { initWorkerBridge } from './workerBridge';
import { audioEngine } from '../engine/audio/AudioEngine';
import { useStore } from '../store';

interface RunnerAPI {
    startSort(): void;
    startSearch(): void;
    stop(): void;
}

const RunnerContext = createContext<RunnerAPI | null>(null);

export function RunnerProvider({ children }: { children: ReactNode }) {
    const workerRef = useRef<Worker | null>(null);
    // guard síncrono frente a doble-click. setRunState es async en React,
    // así que confiar solo en state.runState permite que dos clicks rápidos lancen
    // dos ejecuciones en paralelo. El ref se actualiza antes del postMessage.
    const isRunningRef = useRef(false);

    useEffect(() => {
        const worker = new Worker(new URL('../workers/algorithm.worker.ts', import.meta.url), {
            type: 'module',
        });
        workerRef.current = worker;
        initWorkerBridge(worker);

        const unsubscribe = eventBus.subscribe(event => {
            if (event.type === 'DONE') {
                isRunningRef.current = false;
                useStore.setState({ runState: 'done', errorMessage: null });
            }
            if (event.type === 'FOUND') {
                isRunningRef.current = false;
                // Actualización atómica: evita el render intermedio con searchResult=null.
                useStore.setState({ runState: 'found', searchResult: event.index, errorMessage: null });
            }
            if (event.type === 'NOT_FOUND') {
                isRunningRef.current = false;
                useStore.setState({ runState: 'notFound', searchResult: null, errorMessage: null });
            }
            if (event.type === 'CANCELLED') {
                isRunningRef.current = false;
                useStore.setState({ runState: 'cancelled', searchResult: null, errorMessage: null });
            }
            if (event.type === 'ERROR') {
                isRunningRef.current = false;
                console.error('[runner] Algorithm error:', event.message);
                useStore.setState({ runState: 'error', searchResult: null, errorMessage: event.message });
            }
        });

        return () => { worker.terminate(); unsubscribe(); };
    }, []);

    const startSort = () => {
        if (!workerRef.current || isRunningRef.current) return;
        isRunningRef.current = true;
        const state = useStore.getState();
        useStore.setState({ searchResult: null, errorMessage: null, runState: 'running' });
        state.bumpRunId();
        // init() must precede postMessage so the subscription is registered
        // before the first worker events arrive on the event loop.
        try { audioEngine.init(state.array); } catch { /* audio unavailable, continue without sound */ }
        audioEngine.setWaveform(state.sortConfig.waveform);
        audioEngine.setVolume(state.sortConfig.volume);
        workerRef.current.postMessage({
            type: 'START',
            mode: 'sort',
            data: [...state.array],
            algorithm: state.sortConfig.algorithm,
            cmpMs: state.sortConfig.cmpMs,
        });
    };

    const startSearch = () => {
        if (!workerRef.current || isRunningRef.current) return;
        isRunningRef.current = true;
        const state = useStore.getState();
        useStore.setState({ searchResult: null, errorMessage: null, runState: 'running' });
        state.bumpRunId();
        try { audioEngine.init(state.array); } catch { /* audio unavailable, continue without sound */ }
        audioEngine.setWaveform(state.searchConfig.waveform);
        audioEngine.setVolume(state.searchConfig.volume);
        workerRef.current.postMessage({
            type: 'START',
            mode: 'search',
            data: [...state.array],
            algorithm: state.searchConfig.algorithm,
            target: state.searchConfig.target,
            cmpMs: state.searchConfig.cmpMs,
        });
    };

    const stop = () => {
        // libera el guard antes de mandar el CANCEL para que un RUN inmediato
        // después del STOP no rebote con el ref aún en true.
        isRunningRef.current = false;
        workerRef.current?.postMessage({ type: 'CANCEL' });
    };

    return (
        <RunnerContext.Provider value={{ startSort, startSearch, stop }}>
            {children}
        </RunnerContext.Provider>
    );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useRunner(): RunnerAPI {
    const ctx = useContext(RunnerContext);
    if (!ctx) throw new Error('useRunner must be inside RunnerProvider');
    return ctx;
}
