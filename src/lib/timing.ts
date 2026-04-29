export const MIN_CMP_MS = 5; // floor real del navegador ~4ms

export const CMP_MS = 10;
export const WRITE_MS = CMP_MS * 5;

// HIGHLIGHT_MS en tiempo de ejecución se calcula dinámicamente en el Visualizer
// como `cmpMs * sortConfig.highlightFactor`. Esta constante queda como valor por defecto.
export const HIGHLIGHT_MS = WRITE_MS * 5;
