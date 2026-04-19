import { CMP_MS, WRITE_MS } from '../lib/timing';

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
export const sleepCMP = () => sleep(CMP_MS);
export const sleepWRITE = () => sleep(WRITE_MS);
