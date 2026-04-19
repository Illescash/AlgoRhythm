import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { eventBus } from '../../core/eventBus';
import { HIGHLIGHT_MS } from '../../lib/timing';

export interface VisualizerHandle {
    set: (index: number, value: number) => void;
    initialize: () => void;
    highlight: (indices: number[], color: string) => void;
}

export const Visualizer = forwardRef<VisualizerHandle>((_, ref) => {
    // useRef: Referencia al contenedor interno ("Pista de baile")
    const containerRef = useRef<HTMLDivElement>(null);
    // useRef: "Memoria Silenciosa" - Guarda el array de datos sin provocar repintados
    const dataRef = useRef<number[]>([]);
    // useRef: "Hilos de Marioneta" - Guarda las referencias a los elementos HTML de las barras
    const barsRef = useRef<(HTMLDivElement | null)[]>([]);

    const count = 50;
    const DEFAULT_COLOR = '#3b82f6';
    const COMPARE_COLOR = '#ef4444';

    // --- Métodos de Ayuda (Encapsulación) ---

    const generateInitialData = () => {
        return Array.from({ length: count }, () => Math.floor(Math.random() * 90) + 10);
    };

    const clearContainer = () => {
        if (containerRef.current) containerRef.current.innerHTML = '';
        dataRef.current = [];
        barsRef.current = [];
    };

    const createBar = (value: number, index: number) => {
        if (!containerRef.current) return null;

        const bar = document.createElement('div');
        bar.style.position = 'absolute';
        bar.style.bottom = '0';
        bar.style.height = `${value}%`;
        bar.style.width = `calc(100% / ${count} - 2px)`;
        bar.style.left = `calc(${index} * 100% / ${count})`;
        bar.style.backgroundColor = DEFAULT_COLOR;
        bar.style.borderRadius = '4px 4px 0 0';
        bar.style.transition = 'left 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.2s ease';

        containerRef.current.appendChild(bar);
        return bar;
    };

const highlight = (indices: number[], color: string) => {
        indices.forEach(index => {
            const bar = barsRef.current[index];
            if (bar) {
                bar.style.backgroundColor = color;
                // Volver al color original después de un tiempo
                setTimeout(() => {
                    if (barsRef.current[index]) {
                        barsRef.current[index]!.style.backgroundColor = DEFAULT_COLOR;
                    }
                }, HIGHLIGHT_MS);
            }
        });
    };

    // --- Lógica Principal ---

    const initialize = (data?: number[]) => {
        if (!containerRef.current) return;

        clearContainer();
        containerRef.current.style.position = 'relative';

        const initialData = data || generateInitialData();
        initialData.forEach((value, i) => {
            dataRef.current.push(value);
            const bar = createBar(value, i);
            barsRef.current.push(bar);
        });
    };

    const set = (index: number, value: number) => {
        if (index < 0 || index >= count) return;
        dataRef.current[index] = value;
        const bar = barsRef.current[index];
        if (bar) bar.style.height = `${value}%`;
    };

    useImperativeHandle(ref, () => ({
        set,
        initialize,
        highlight
    }));

    useEffect(() => {
        initialize();

        // Suscribirse al Bus de Eventos
        const unsubscribe = eventBus.subscribe((event) => {
            switch (event.type) {
                case 'SET':
                    set(event.index, event.value);
                    break;
                case 'COMPARE':
                    highlight(event.indices, COMPARE_COLOR);
                    break;
                case 'INITIALIZE':
                    initialize(event.data);
                    break;
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <div className="w-full h-full flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col">
                    <h3 className="text-lg font-medium text-slate-200">Visualización en Tiempo Real</h3>
                    <p className="text-xs text-slate-400">Motor de renderizado manual (DOM Directo)</p>
                </div>
            </div>

            <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 overflow-hidden relative group shadow-2xl flex items-end p-6">
                <div
                    ref={containerRef}
                    className="w-full h-full relative"
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="flex justify-end px-2">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Manual Engine v1.2</span>
            </div>
        </div>
    );
});

Visualizer.displayName = 'Visualizer';

