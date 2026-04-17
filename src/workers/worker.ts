import { autoSolve } from '../engine/resolver';
import type { Clause, ProofStep } from '../engine/types';

export type WorkerSuccessPayload = { finalPool: Clause[], history: ProofStep[] };
export type WorkerMessage =
    | { type: 'SUCCESS', payload: WorkerSuccessPayload }
    | { type: 'ERROR', payload: string };

self.addEventListener('message', (event: MessageEvent<Clause[]>) => {
    try {
        const initialClauses = event.data;

        const result = autoSolve(initialClauses);

        self.postMessage({ type: 'SUCCESS', payload: result } as WorkerMessage);
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            payload: error instanceof Error ? error.message : 'An unknown math error occurred.'
        } as WorkerMessage);
    }
});