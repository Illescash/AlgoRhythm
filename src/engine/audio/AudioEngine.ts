import { eventBus } from '../../core/eventBus';
import type { VisualEvent } from '../../core/eventBus';

// A major pentatonic: A B C# E F# (semitones from A)
const PENTATONIC = [0, 2, 4, 7, 9];
const BASE_FREQ = 110; // A2
const OCTAVE_SPAN = 3; // A2 -> ~F#4, covers ~2.75 octaves of pentatonic

// Maps a data value to a pentatonic frequency (logarithmic perceptual scaling)
function valueToFreq(value: number, min: number, max: number): number {
    const normalized = (value - min) / (max - min || 1);
    const totalSteps = PENTATONIC.length * OCTAVE_SPAN;
    const step = Math.round(normalized * (totalSteps - 1));
    const octave = Math.floor(step / PENTATONIC.length);
    const semitone = PENTATONIC[step % PENTATONIC.length];
    return BASE_FREQ * Math.pow(2, (octave * 12 + semitone) / 12);
}

// Maps array index to stereo pan [-0.7, +0.7]
function indexToPan(index: number, total: number): number {
    if (total <= 1) return 0;
    return -0.7 + (index / (total - 1)) * 1.4;
}

class AudioEngine {
    private ctx: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private unsubscribe: (() => void) | null = null;

    private arrayData: number[] = [];
    private dataMin = 10;
    private dataMax = 100;
    private enabled = false;
    private waveform: OscillatorType = 'sine';

    // Called on user gesture (button click) - creates AudioContext and subscribes
    init(data: number[]) {
        // Math.min/max sobre un array vacío devuelven ±Infinity y rompen valueToFreq.
        // No tiene sentido inicializar sonificación sin datos: salimos temprano.
        if (data.length === 0) {
            console.warn('[AudioEngine] init() llamado con array vacío; se ignora.');
            return;
        }
        this.arrayData = [...data];
        this.dataMin = Math.min(...data);
        this.dataMax = Math.max(...data);

        if (!this.ctx || this.ctx.state === 'closed') {
            this.ctx = new AudioContext();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = 0.12;
            this.masterGain.connect(this.ctx.destination);
        } else if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        // Only subscribe once
        if (!this.unsubscribe) {
            this.unsubscribe = eventBus.subscribe(ev => this.handle(ev));
        }

        this.enabled = true;
    }

    private handle(event: VisualEvent) {
        if (!this.enabled || !this.ctx || !this.masterGain) return;
        if (this.ctx.state === 'closed') return;
        if (this.ctx.state === 'suspended') this.ctx.resume();

        switch (event.type) {
            case 'INITIALIZE':
                if (event.data && event.data.length > 0) {
                    this.arrayData = [...event.data];
                    this.dataMin = Math.min(...event.data);
                    this.dataMax = Math.max(...event.data);
                }
                break;

            case 'COMPARE':
                this.playGrain(event.indices[0], 0.018, this.waveform, 0.5);
                this.playGrain(event.indices[1], 0.018, this.waveform, 0.5);
                break;

            // PROBE inspecciona UNA posición (search lineal, countingSort). Mismo
            // grano que medio COMPARE para mantener el "tick" auditivo por iteración.
            case 'PROBE':
                this.playGrain(event.index, 0.018, this.waveform, 0.5);
                break;

            case 'SET':
                this.arrayData[event.index] = event.value;
                this.playGrain(event.index, 0.06, this.waveform, 1.0);
                break;

            case 'DONE':
                this.playEarcon();
                break;

            case 'FOUND':
                this.playFoundEarcon();
                break;

            case 'NOT_FOUND':
                this.playNotFoundEarcon();
                break;

            case 'RANGE':
                break;

            // al ERROR, el AudioEngine no suena nada; sólo lo enumeramos para el exhaustive check.
            case 'ERROR':
                break;
            // al CANCELLED tampoco emitimos sonido (el earcon DONE sería engañoso).
            case 'CANCELLED':
                break;

            default: {
                const _exhaustiveCheck: never = event;
                void _exhaustiveCheck;
            }
        }
    }

    // Plays a short audio grain for one array element.
    // index controla el pan estereo (posicion espacial).
    // valor del array controla la frecuencia.
    private playGrain(index: number, duration: number, waveform: OscillatorType, gainLevel: number) {
        if (!this.ctx || !this.masterGain) return;

        const value = this.arrayData[index] ?? index;
        const freq = valueToFreq(value, this.dataMin, this.dataMax);
        const pan = indexToPan(index, this.arrayData.length);
        const now = this.ctx.currentTime;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner();

        osc.type = waveform;
        osc.frequency.setValueAtTime(freq, now);

        // 5ms attack + exponential decay - avoids clicks and prevents oscillator accumulation
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.exponentialRampToValueAtTime(gainLevel, now + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        panner.pan.value = pan;

        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain);

        osc.onended = () => { osc.disconnect(); gain.disconnect(); panner.disconnect(); };
        try {
            osc.start(now);
            osc.stop(now + duration + 0.01);
        } catch {
            osc.disconnect();
            gain.disconnect();
            panner.disconnect();
        }
    }

    // C major chord (C4-E4-G4) played as ascending arpeggio.
    private playEarcon() {
        if (!this.ctx || !this.masterGain) return;
        const notes = [261.63, 329.63, 392.00]; // C4, E4, G4
        notes.forEach((freq, i) => {
            const now = this.ctx!.currentTime + i * 0.12;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(0.4, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

            osc.connect(gain);
            gain.connect(this.masterGain!);

            osc.onended = () => { osc.disconnect(); gain.disconnect(); };
            try { osc.start(now); osc.stop(now + 0.55); }
            catch { osc.disconnect(); gain.disconnect(); }
        });
    }

    // Two ascending notes - confirmation that target was found
    private playFoundEarcon() {
        if (!this.ctx || !this.masterGain) return;
        const notes = [523.25, 659.25]; // C5, E5 - ascendente
        notes.forEach((freq, i) => {
            const now = this.ctx!.currentTime + i * 0.14;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(0.5, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.onended = () => { osc.disconnect(); gain.disconnect(); };
            try { osc.start(now); osc.stop(now + 0.5); }
            catch { osc.disconnect(); gain.disconnect(); }
        });
    }

    // Two descending notes - signals that target is not in the array
    private playNotFoundEarcon() {
        if (!this.ctx || !this.masterGain) return;
        const notes = [220, 164.81]; // A3, E3 - descendente
        notes.forEach((freq, i) => {
            const now = this.ctx!.currentTime + i * 0.14;
            const osc = this.ctx!.createOscillator();
            const gain = this.ctx!.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.001, now);
            gain.gain.exponentialRampToValueAtTime(0.4, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
            osc.connect(gain);
            gain.connect(this.masterGain!);
            osc.onended = () => { osc.disconnect(); gain.disconnect(); };
            try { osc.start(now); osc.stop(now + 0.5); }
            catch { osc.disconnect(); gain.disconnect(); }
        });
    }

    setWaveform(type: OscillatorType) {
        this.waveform = type;
    }

    setVolume(value: number) {
        if (!this.ctx || !this.masterGain) return;
        const v = Math.max(0, Math.min(1, value));
        const now = this.ctx.currentTime;
        const gain = this.masterGain.gain;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(gain.value, now);
        gain.linearRampToValueAtTime(v, now + 0.02);
    }

    enable() {
        this.enabled = true;
        if (this.ctx?.state === 'suspended') this.ctx.resume();
    }

    disable() {
        this.enabled = false;
    }

    // usado por el dispose de HMR (ver export del módulo). Libera la suscripción
    // al EventBus para que un módulo recargado no acumule listeners fantasma.
    teardown() {
        if (this.unsubscribe) {
            this.unsubscribe();
            this.unsubscribe = null;
        }
        this.enabled = false;
    }
}

export const audioEngine = new AudioEngine();

// en HMR de Vite, al recargar este módulo el singleton previo deja una suscripción
// fantasma en el EventBus. Llamamos a `unsubscribe` antes de que el módulo sea reemplazado.
if (import.meta.hot) {
    import.meta.hot.dispose(() => {
        audioEngine.teardown();
    });
}
