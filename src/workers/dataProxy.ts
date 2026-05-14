import type { VisualEvent } from '../core/eventBus';

export interface DataProxy {
    proxy: number[];
    swap(i: number, j: number): void;
}

export interface SearchProxy {
    proxy: number[];
}

/**
 * Crea un Proxy que intercepta accesos al array y emite eventos visuales.
 *
 * - COMPARE: dos índices distintos leídos consecutivamente (solo fuera de operaciones swap)
 * - SET: cada escritura individual (index + valor nuevo)
 *
 * `swap(i, j)` realiza el intercambio suprimiendo COMPARE para evitar falsos positivos
 * (la lectura de RHS en un destructured swap dispararía un COMPARE incorrecto).
 */
export function createDataProxy(array: number[]): DataProxy {
    let lastAccessedIndex: number | null = null;
    let suppressCompare = false;

    const proxy = new Proxy(array, {
        get(target, prop) {
            const value = Reflect.get(target, prop);
            const index = Number(prop);

            if (!isNaN(index) && !suppressCompare) {
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
                lastAccessedIndex = null;
                self.postMessage({ type: 'SET', index, value } as VisualEvent);
            }

            return result;
        }
    });

    function swap(i: number, j: number): void {
        suppressCompare = true;
        const tmp = proxy[i];
        proxy[i] = proxy[j];
        proxy[j] = tmp;
        suppressCompare = false;
    }

    return { proxy, swap };
}

/**
 * Variante para algoritmos de búsqueda: cada lectura emite un evento PROBE con un único
 * índice (el algoritmo lee una sola posición y la compara contra `target`). No empareja
 * lecturas consecutivas como COMPARE y no expone `swap` (los search no escriben).
 */
export function createSearchProxy(array: number[]): SearchProxy {
    const proxy = new Proxy(array, {
        get(target, prop) {
            const value = Reflect.get(target, prop);
            const index = Number(prop);
            if (!isNaN(index)) {
                self.postMessage({ type: 'PROBE', index } as VisualEvent);
            }
            return value;
        }
    });

    return { proxy };
}
