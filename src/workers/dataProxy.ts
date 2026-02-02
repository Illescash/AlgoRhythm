import type { VisualEvent } from '../core/eventBus';

/**
 * Crea un Proxy que intercepta accesos al array y emite eventos visuales.
 * 
 * Detecta automáticamente:
 * - COMPARE: Cuando se leen dos índices consecutivos
 * - SWAP: Cuando se escriben dos índices consecutivos
 * 
 * @param array - Array de números a envolver
 * @returns Proxy que emite eventos COMPARE y SWAP automáticamente
 */
export function createDataProxy(array: number[]): number[] {
    let lastAccessedIndex: number | null = null;
    let lastWrittenIndex: number | null = null;

    return new Proxy(array, {
        get(target, prop) {
            const value = Reflect.get(target, prop);
            const index = Number(prop);

            if (!isNaN(index)) {
                if (lastAccessedIndex !== null && lastAccessedIndex !== index) {
                    self.postMessage({
                        type: 'COMPARE',
                        indices: [lastAccessedIndex, index]
                    } as VisualEvent);

                    lastAccessedIndex = null;
                } else {
                    lastAccessedIndex = index;
                }
            }

            return value;
        },

        set(target, prop, value) {
            const result = Reflect.set(target, prop, value);
            const index = Number(prop);

            if (!isNaN(index)) {
                if (lastWrittenIndex !== null && lastWrittenIndex !== index) {
                    self.postMessage({
                        type: 'SWAP',
                        indices: [lastWrittenIndex, index]
                    } as VisualEvent);

                    lastWrittenIndex = null;
                } else {
                    lastWrittenIndex = index;
                }
            }

            return result;
        }
    });
}
