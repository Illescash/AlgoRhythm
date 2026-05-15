import { sleepCMP, sleepWRITE } from '../sleep';
import type { SortingAlgorithm } from './types';

export const mergeSortInPlaceAlgorithm: SortingAlgorithm = {
    name: 'Merge Sort (In-Place)',
    sort: (array, _swap, probe, compare) => mergeSortInPlace(array, probe, compare),
};

export async function mergeSortInPlace(
    array: number[],
    probe: (i: number) => number,
    compare: (i: number, j: number) => void,
    left = 0,
    right = array.length - 1,
) {
    if (left >= right) return;
    const mid = Math.floor((left + right) / 2);
    await mergeSortInPlace(array, probe, compare, left, mid);
    await mergeSortInPlace(array, probe, compare, mid + 1, right);
    await mergeInPlace(array, probe, compare, left, mid, right);
}

async function mergeInPlace(
    array: number[],
    probe: (i: number) => number,
    compare: (i: number, j: number) => void,
    left: number,
    mid: number,
    right: number,
) {
    let i = left;
    let j = mid + 1;

    while (i <= mid && j <= right) {
        await sleepCMP();
        if (array[i] <= array[j]) {
            i++;
        } else {
            // Insertar array[j] en la posición i desplazando el rango [i..j-1] una posición a la derecha.
            // usamos `probe(j)` para anunciar que vamos a extraer ese valor (highlight visible
            // antes de que cambie de sitio) y `probe(k-1)` en cada paso del desplazamiento para que
            // cada barra origen del shift parpadee antes de copiarse a destino. Sin esto, todo el
            // desplazamiento se veia como SETs silenciosos en cascada.
            const value = probe(j);
            let k = j;
            while (k > i) {
                array[k] = probe(k - 1);
                k--;
                await sleepWRITE();
            }
            // Final landing: anunciar la posicion donde aterriza el valor extraido.
            compare(i, j);
            array[i] = value;
            await sleepWRITE();
            i++;
            mid++;
            j++;
        }
    }
}
