import type { ReactNode, CSSProperties } from 'react';

interface SectionProps {
    title: string;
    index?: string;
    children: ReactNode;
}

export function Section({ title, index, children }: SectionProps) {
    return (
        <div style={{
            padding: '16px 16px 14px',
            borderBottom: '1px solid var(--line-soft)',
        }}>
            <div className="flex items-center justify-between mb-2.5">
                <span className="mono text-[10px] tracking-[0.14em] uppercase"
                      style={{ color: 'var(--text-2)' }}>
                    {title}
                </span>
                {index && (
                    <span className="mono text-[10px]" style={{ color: 'var(--text-3)' }}>
                        {index}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}

interface AlgoOption<T extends string> {
    id: T;
    label: string;
    complexity: string;
}

interface AlgoSelectorProps<T extends string> {
    options: AlgoOption<T>[];
    value: T;
    disabled?: boolean;
    onChange(v: T): void;
}

export function AlgoSelector<T extends string>({ options, value, onChange, disabled }: AlgoSelectorProps<T>) {
    return (
        <div className="grid grid-cols-2 gap-1.5">
            {options.map(opt => {
                const active = opt.id === value;
                return (
                    <button
                        key={opt.id}
                        onClick={() => onChange(opt.id)}
                        disabled={disabled}
                        className="flex flex-col text-left"
                        style={{
                            padding: '10px',
                            borderRadius: 8,
                            border: active ? '1px solid rgba(129,140,248,0.55)' : '1px solid var(--line)',
                            background: active
                                ? 'linear-gradient(180deg, rgba(99,102,241,0.18), rgba(99,102,241,0.06))'
                                : 'var(--bg-2)',
                            color: active ? 'var(--text-0)' : 'var(--text-1)',
                            boxShadow: active
                                ? '0 0 0 1px rgba(99,102,241,0.2), inset 0 0 0 1px rgba(255,255,255,0.03)'
                                : undefined,
                            opacity: disabled ? 0.5 : 1,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            transition: 'all 0.12s ease',
                        }}
                    >
                        <span className="text-xs font-medium leading-tight">{opt.label}</span>
                        <span className="mono text-[10px]"
                              style={{ color: active ? 'var(--indigo-soft)' : 'var(--text-3)' }}>
                            {opt.complexity}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

interface SliderProps {
    label: string;
    sub?: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit?: string;
    ticks?: [string, string];
    disabled?: boolean;
    display?: string;
    onChange(v: number): void;
}

export function Slider({ label, sub, value, min, max, step = 1, unit, ticks, disabled, display, onChange }: SliderProps) {
    const pct = ((value - min) / (max - min)) * 100;
    return (
        <div className="mb-[14px] last:mb-0">
            <div className="flex justify-between items-baseline mb-1.5">
                <span className="text-xs font-medium" style={{ color: 'var(--text-1)' }}>
                    {label}
                    {sub && (
                        <span className="mono ml-1.5 uppercase"
                              style={{ color: 'var(--text-3)', fontSize: 10, letterSpacing: '0.08em' }}>
                            {sub}
                        </span>
                    )}
                </span>
                <span className="mono text-xs font-semibold" style={{ color: 'var(--text-0)' }}>
                    {display ?? value}{unit && <span style={{ color: 'var(--text-3)', fontWeight: 400, marginLeft: 2 }}>{unit}</span>}
                </span>
            </div>
            <input
                type="range"
                className="algo-slider"
                min={min}
                max={max}
                step={step}
                value={value}
                disabled={disabled}
                onChange={e => onChange(Number(e.target.value))}
                style={{ '--pct': `${pct}%` } as CSSProperties}
            />
            {ticks && (
                <div className="flex justify-between mt-0.5 mono text-[9px] tracking-wider"
                     style={{ color: 'var(--text-3)' }}>
                    <span>{ticks[0]}</span>
                    <span>{ticks[1]}</span>
                </div>
            )}
        </div>
    );
}

interface WaveformSelectorProps {
    value: OscillatorType;
    disabled?: boolean;
    onChange(v: OscillatorType): void;
}

const WAVES: { id: OscillatorType; label: string }[] = [
    { id: 'sine',     label: 'SIN' },
    { id: 'triangle', label: 'TRI' },
    { id: 'square',   label: 'SQR' },
    { id: 'sawtooth', label: 'SAW' },
];

export function WaveformSelector({ value, onChange, disabled }: WaveformSelectorProps) {
    return (
        <div className="grid grid-cols-4 gap-1">
            {WAVES.map(w => {
                const active = w.id === value;
                return (
                    <button
                        key={w.id}
                        onClick={() => onChange(w.id)}
                        disabled={disabled}
                        className="mono text-[11px] font-semibold"
                        style={{
                            padding: '7px 0',
                            borderRadius: 6,
                            border: active ? '1px solid rgba(129,140,248,0.55)' : '1px solid var(--line)',
                            background: active
                                ? 'linear-gradient(180deg, rgba(99,102,241,0.18), rgba(99,102,241,0.06))'
                                : 'var(--bg-2)',
                            color: active ? 'var(--text-0)' : 'var(--text-2)',
                            opacity: disabled ? 0.5 : 1,
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            transition: 'all 0.12s ease',
                        }}
                    >
                        {w.label}
                    </button>
                );
            })}
        </div>
    );
}

interface MiniButtonProps {
    children: ReactNode;
    onClick?(): void;
    disabled?: boolean;
    title?: string;
    intent?: 'default' | 'indigo';
}

export function MiniButton({ children, onClick, disabled, title, intent = 'default' }: MiniButtonProps) {
    const indigo = intent === 'indigo';
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            title={title}
            className="mono text-[11px] inline-flex items-center justify-center gap-1.5"
            style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: indigo ? '1px solid rgba(129,140,248,0.45)' : '1px solid var(--line)',
                background: indigo
                    ? 'linear-gradient(180deg, rgba(99,102,241,0.2), rgba(99,102,241,0.08))'
                    : 'var(--bg-2)',
                color: indigo ? 'var(--text-0)' : 'var(--text-1)',
                opacity: disabled ? 0.4 : 1,
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.12s ease',
            }}
        >
            {children}
        </button>
    );
}

interface RunButtonProps {
    state: 'idle' | 'running' | 'done' | 'cancelled';
    onStart(): void;
    onStop(): void;
    labelIdle: string;
    labelDone?: string;
}

export function RunButton({ state, onStart, onStop, labelIdle, labelDone = 'DONE' }: RunButtonProps) {
    const running = state === 'running';
    const done = state === 'done';
    const label = running ? 'DETENER' : done ? labelDone : labelIdle;

    return (
        <button
            onClick={running ? onStop : onStart}
            className="mono font-semibold"
            style={{
                width: '100%',
                height: 52,
                borderRadius: 10,
                color: done ? '#052e16' : '#fff',
                letterSpacing: '0.04em',
                fontSize: 13,
                position: 'relative',
                overflow: 'hidden',
                background: done
                    ? 'linear-gradient(180deg, #86efac, var(--green) 55%, #15803d)'
                    : running
                    ? 'linear-gradient(180deg, #f87171, var(--red) 55%, #991b1b)'
                    : 'linear-gradient(180deg, var(--indigo-soft), var(--indigo) 55%, #4338ca)',
                boxShadow: done
                    ? '0 0 0 1px rgba(34,197,94,0.4) inset, 0 8px 24px -6px rgba(34,197,94,0.55)'
                    : running
                    ? '0 0 0 1px rgba(239,68,68,0.3) inset, 0 8px 24px -6px rgba(239,68,68,0.55)'
                    : '0 0 0 1px rgba(255,255,255,0.1) inset, 0 8px 24px -6px rgba(99,102,241,0.55), 0 2px 0 rgba(0,0,0,0.4)',
                cursor: 'pointer',
                transition: 'transform 0.06s ease, box-shadow 0.15s ease',
            }}
        >
            <span className="relative z-[1] flex items-center justify-center gap-2">
                {running ? '■' : done ? '✓' : '▶'}&nbsp;{label}
            </span>
        </button>
    );
}
