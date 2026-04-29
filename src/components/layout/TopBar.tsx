import { useEffect } from 'react';
import { useStore } from '../../store';
import type { AppMode } from '../../store/types';
import pkg from '../../../package.json';

export function TopBar() {
    const mode = useStore(s => s.mode);
    const setMode = useStore(s => s.setMode);
    const runState = useStore(s => s.runState);
    const isRunning = runState === 'running';

    useEffect(() => {
        document.body.dataset.mode = mode;
    }, [mode]);

    const tabs: { id: AppMode; label: string }[] = [
        { id: 'sort',   label: 'SORT' },
        { id: 'search', label: 'SEARCH' },
    ];

    return (
        <header
            className="flex items-center gap-4 px-4 relative z-30"
            style={{
                height: 48,
                borderBottom: '1px solid var(--line-soft)',
                background: 'linear-gradient(180deg, rgba(15,20,32,0.92), rgba(10,14,26,0.92))',
                backdropFilter: 'blur(8px)',
            }}
        >
            <div className="flex items-center gap-2.5">
                <div
                    className="relative"
                    style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: 'conic-gradient(from 210deg, #3b82f6, #6366f1, #a78bfa, #3b82f6)',
                        boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 20px -8px rgba(99,102,241,0.6)',
                    }}
                >
                    <div style={{
                        position: 'absolute', inset: 4, borderRadius: 3, background: 'var(--bg-1)',
                    }}/>
                </div>
                <span className="text-[13px] font-bold tracking-tight">
                    Algo<span style={{ color: 'var(--indigo-soft)' }}>Rhythm</span>
                </span>
                <span className="mono text-[11px] tracking-[0.08em] uppercase pl-3 ml-1"
                      style={{ color: 'var(--text-2)', borderLeft: '1px solid var(--line)' }}>
                    Sonification Engine
                </span>
            </div>

            <div className="flex gap-[2px] p-[3px] ml-2"
                 style={{
                     background: 'var(--bg-2)',
                     border: '1px solid var(--line)',
                     borderRadius: 8,
                 }}>
                {tabs.map(t => {
                    const active = mode === t.id;
                    return (
                        <button
                            key={t.id}
                            disabled={isRunning}
                            onClick={() => setMode(t.id)}
                            className="mono font-semibold"
                            style={{
                                padding: '5px 14px',
                                borderRadius: 6,
                                fontSize: 11,
                                letterSpacing: '0.14em',
                                color: active ? 'var(--text-0)' : 'var(--text-2)',
                                background: active
                                    ? 'linear-gradient(180deg, rgba(99,102,241,0.25), rgba(99,102,241,0.1))'
                                    : 'transparent',
                                boxShadow: active ? '0 0 0 1px rgba(129,140,248,0.5)' : undefined,
                                cursor: isRunning ? 'not-allowed' : 'pointer',
                                opacity: isRunning && !active ? 0.5 : 1,
                                transition: 'all 0.12s ease',
                            }}
                        >
                            {`[ ${t.label} ]`}
                        </button>
                    );
                })}
            </div>

            <div className="flex-1"/>

            <div className="flex items-center gap-3 text-[11px]"
                 style={{ color: 'var(--text-2)' }}>
                <span className="inline-flex items-center gap-1.5">
                    <span style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: 'var(--green)', boxShadow: '0 0 10px var(--green)',
                    }}/>
                    <span className="mono">ENGINE · READY</span>
                </span>
                <span className="mono px-2 py-0.5 rounded-full"
                      style={{ border: '1px solid var(--line)', color: 'var(--text-1)' }}>
                    v{pkg.version} · Fase 5
                </span>
            </div>
        </header>
    );
}
