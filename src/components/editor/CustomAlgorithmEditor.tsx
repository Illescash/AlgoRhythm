import { lazy, Suspense, useEffect, useState } from 'react';
import { useStore } from '../../store';
import { validateCorrectness } from '../../core/customAlgorithm';

const MonacoEditor = lazy(() => import('@monaco-editor/react').then(m => ({ default: m.default })));

type Status = { kind: 'idle' } | { kind: 'validating' } | { kind: 'ok' } | { kind: 'error'; message: string };

interface Props {
    onClose(): void;
}

export function CustomAlgorithmEditor({ onClose }: Props) {
    const stored = useStore(s => s.customSortCode);
    const setCustomSortCode = useStore(s => s.setCustomSortCode);

    const [code, setCode] = useState(stored);
    const [status, setStatus] = useState<Status>({ kind: 'idle' });
    const [infoOpen, setInfoOpen] = useState(false);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (infoOpen) setInfoOpen(false);
            else onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, infoOpen]);

    const handleValidate = async () => {
        setStatus({ kind: 'validating' });
        const result = await validateCorrectness(code);
        if (result.ok) setStatus({ kind: 'ok' });
        else setStatus({ kind: 'error', message: result.error });
    };

    const handleApply = () => {
        setCustomSortCode(code);
        onClose();
    };

    const handleChange = (value: string | undefined) => {
        setCode(value ?? '');
        if (status.kind !== 'idle') setStatus({ kind: 'idle' });
    };

    const canApply = status.kind === 'ok';

    return (
        <div
            onClick={onClose}
            style={{
                position: 'fixed', inset: 0, zIndex: 100,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '40px',
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="mono"
                style={{
                    width: 'min(960px, 100%)', height: 'min(640px, 90vh)',
                    background: 'var(--bg-1)', border: '1px solid var(--line)',
                    borderRadius: 12, display: 'flex', flexDirection: 'column',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                    position: 'relative',
                }}
            >
                <div style={{
                    padding: '14px 18px', borderBottom: '1px solid var(--line)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <div className="text-[12px] tracking-[0.14em] uppercase" style={{ color: 'var(--text-1)' }}>
                        Custom Algorithm Editor
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                        <IconButton onClick={() => setInfoOpen(true)} title="Cómo funciona">i</IconButton>
                        <IconButton onClick={onClose} title="Cerrar (Esc)">×</IconButton>
                    </div>
                </div>

                <div style={{ flex: 1, minHeight: 0, borderBottom: '1px solid var(--line)' }}>
                    <Suspense fallback={<LoadingFallback />}>
                        <MonacoEditor
                            height="100%"
                            language="javascript"
                            theme="vs-dark"
                            value={code}
                            onChange={handleChange}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 13,
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                tabSize: 2,
                                automaticLayout: true,
                            }}
                        />
                    </Suspense>
                </div>

                <StatusPanel status={status} />

                <div style={{
                    padding: '12px 18px', display: 'flex', justifyContent: 'flex-end', gap: 8,
                }}>
                    <ActionButton onClick={onClose}>Cancel</ActionButton>
                    <ActionButton onClick={handleValidate} disabled={status.kind === 'validating'} intent="indigo">
                        {status.kind === 'validating' ? 'Validando…' : 'Validate'}
                    </ActionButton>
                    <ActionButton onClick={handleApply} disabled={!canApply} intent="green">Apply</ActionButton>
                </div>

                {infoOpen && <InfoPanel onClose={() => setInfoOpen(false)} />}
            </div>
        </div>
    );
}

function IconButton({
    children, onClick, title,
}: {
    children: React.ReactNode;
    onClick(): void;
    title: string;
}) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="mono"
            style={{
                border: '1px solid var(--line)', background: 'var(--bg-2)',
                color: 'var(--text-2)', width: 28, height: 28, borderRadius: 6,
                cursor: 'pointer', fontSize: 13, fontStyle: 'italic',
            }}
        >{children}</button>
    );
}

function InfoPanel({ onClose }: { onClose(): void }) {
    return (
        <div
            onClick={onClose}
            style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 24, borderRadius: 12,
            }}
        >
            <div
                onClick={e => e.stopPropagation()}
                className="mono"
                style={{
                    width: 'min(720px, 100%)', maxHeight: '100%', overflowY: 'auto',
                    background: 'var(--bg-1)', border: '1px solid var(--line)',
                    borderRadius: 10, padding: 22, fontSize: 12, lineHeight: 1.6,
                    color: 'var(--text-1)',
                }}
            >
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: 14,
                }}>
                    <div className="text-[12px] tracking-[0.14em] uppercase" style={{ color: 'var(--text-0)' }}>
                        Cómo funciona el editor
                    </div>
                    <IconButton onClick={onClose} title="Cerrar">×</IconButton>
                </div>

                <Section title="API disponible">
                    Dentro de tu algoritmo puedes usar:
                    <ul style={ulStyle}>
                        <li><code style={codeStyle}>array[i]</code>, <code style={codeStyle}>array[i] = v</code>, <code style={codeStyle}>array.length</code></li>
                        <li><code style={codeStyle}>swap(i, j)</code> — intercambia dos posiciones</li>
                        <li><code style={codeStyle}>await sleepCMP()</code> — pausa corta tras una comparación</li>
                        <li><code style={codeStyle}>await sleepWRITE()</code> — pausa larga tras una escritura</li>
                    </ul>
                    El array es un Proxy de JavaScript que emite eventos visuales cada vez que lo lees o escribes. Lo demás (visualización, audio) ocurre solo.
                </Section>

                <Section title="Limitaciones de la heurística">
                    El proxy infiere los eventos a partir de patrones de acceso, no entiende tu código. Esto trae dos sorpresas habituales:
                    <ul style={ulStyle}>
                        <li>
                            <strong style={{ color: 'var(--text-0)' }}>Lecturas sueltas no emiten nada.</strong>{' '}
                            Una lectura aislada queda pendiente hasta que llegue otra a un índice distinto: en ese momento se emite un <code style={codeStyle}>COMPARE</code> emparejado. Si comparas <code style={codeStyle}>array[i]</code> contra un valor cacheado en una variable, la heurística no podrá emparejar y verás menos pulsos de los esperados.
                        </li>
                        <li>
                            <strong style={{ color: 'var(--text-0)' }}>Swap manual = COMPARE espurio.</strong>{' '}
                            Hacer <code style={codeStyle}>const t = array[i]; array[i] = array[j]; array[j] = t;</code> dispara dos lecturas seguidas que la heurística interpreta como una comparación. Usa <code style={codeStyle}>swap(i, j)</code> y los eventos quedan limpios.
                        </li>
                    </ul>
                    Estas limitaciones son las mismas que afectan a los algoritmos nativos del proyecto. Tenerlas en mente te ayuda a leer correctamente las métricas y el sonido.
                </Section>

                <Section title="Por qué los sleeps son obligatorios">
                    Sin <code style={codeStyle}>await</code>, tu sort se ejecuta en un único tick y emite miles de eventos de golpe: la animación es ininteligible. Los <code style={codeStyle}>sleepCMP</code>/<code style={codeStyle}>sleepWRITE</code> respetan el slider de velocidad del sidebar y separan los eventos en el tiempo.
                </Section>

                <Section title="Qué comprueba Validate">
                    Antes de animar tu algoritmo, se ejecuta dos veces a velocidad nativa (sin sleeps) en un worker aparte:
                    <ul style={ulStyle}>
                        <li><code style={codeStyle}>[5, 2, 8, 1, 9, 3, 7, 4, 6, 0]</code> — caso general</li>
                        <li><code style={codeStyle}>[3, 3, 1, 2, 2, 1]</code> — pilla algoritmos que pierden o duplican elementos</li>
                    </ul>
                    Si una ejecución tarda más de 2 segundos, se aborta (probable bucle infinito). Solo se habilita Apply cuando ambos casos pasan.
                </Section>

                <Section title="Persistencia">
                    El código vive solo en memoria. Refrescar la pestaña restaura la plantilla bubble. Cancel descarta lo escrito desde la última vez que pulsaste Apply.
                </Section>
            </div>
        </div>
    );
}

const ulStyle: React.CSSProperties = {
    margin: '6px 0 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 4,
};

const codeStyle: React.CSSProperties = {
    background: 'var(--bg-2)', padding: '1px 5px', borderRadius: 4,
    border: '1px solid var(--line)', color: 'var(--text-0)',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: 16 }}>
            <div className="text-[10px] tracking-[0.14em] uppercase"
                 style={{ color: 'var(--text-3)', marginBottom: 4 }}>
                {title}
            </div>
            <div style={{ color: 'var(--text-1)' }}>{children}</div>
        </div>
    );
}

function ActionButton({
    children, onClick, disabled, intent = 'default',
}: {
    children: React.ReactNode;
    onClick(): void;
    disabled?: boolean;
    intent?: 'default' | 'indigo' | 'green';
}) {
    const colors = {
        default: { border: 'var(--line)', bg: 'var(--bg-2)', fg: 'var(--text-1)' },
        indigo:  { border: 'rgba(129,140,248,0.45)', bg: 'linear-gradient(180deg, rgba(99,102,241,0.22), rgba(99,102,241,0.08))', fg: 'var(--text-0)' },
        green:   { border: 'rgba(52,211,153,0.45)',  bg: 'linear-gradient(180deg, rgba(16,185,129,0.22), rgba(16,185,129,0.08))', fg: 'var(--text-0)' },
    }[intent];
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="mono text-[11px] tracking-[0.1em] uppercase"
            style={{
                padding: '8px 16px', borderRadius: 8,
                border: `1px solid ${colors.border}`, background: colors.bg, color: colors.fg,
                opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer',
            }}
        >{children}</button>
    );
}

function StatusPanel({ status }: { status: Status }) {
    const base = {
        padding: '10px 18px', borderBottom: '1px solid var(--line)',
        fontSize: 12, lineHeight: 1.5, minHeight: 40,
    } as const;
    if (status.kind === 'idle') {
        return <div className="mono" style={{ ...base, color: 'var(--text-3)' }}>Pulsa Validate antes de Apply.</div>;
    }
    if (status.kind === 'validating') {
        return <div className="mono" style={{ ...base, color: 'var(--text-2)' }}>Comprobando corrección sobre 2 arrays de prueba…</div>;
    }
    if (status.kind === 'ok') {
        return <div className="mono" style={{ ...base, color: 'var(--green)' }}>✓ Ordena correctamente.</div>;
    }
    return <div className="mono" style={{ ...base, color: 'var(--red)' }}>✗ {status.message}</div>;
}

function LoadingFallback() {
    return (
        <div className="mono text-[12px]" style={{
            height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-3)',
        }}>
            Cargando editor…
        </div>
    );
}
