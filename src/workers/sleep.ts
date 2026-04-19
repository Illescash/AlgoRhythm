import { CMP_MS } from '../lib/timing';

let cmpMs = CMP_MS;
let writeMs = CMP_MS * 5;
let cancelled = false;

export const setTimings = (newCmpMs: number) => {
    cmpMs = newCmpMs;
    writeMs = newCmpMs * 5;
};

export const setCancelled = (value: boolean) => {
    cancelled = value;
};

function checkCancel() {
    if (cancelled) throw new Error('CANCELLED');
}

export const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export const sleepCMP = async () => {
    checkCancel();
    await sleep(cmpMs);
    checkCancel();
};

export const sleepWRITE = async () => {
    checkCancel();
    await sleep(writeMs);
    checkCancel();
};
