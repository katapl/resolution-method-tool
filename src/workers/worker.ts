import { autoSolve } from '../engine/resolver';
import type { Clause, ProofStep } from '../engine/types';

export type WorkerSuccessPayload = { finalPool: Clause[], history: ProofStep[] };
export type WorkerMessage =
    | { type: 'SUCCESS', payload: WorkerSuccessPayload }
    | { type: 'ERROR', payload: string };

self.addEventListener('message', (event: MessageEvent<Clause[]>) => {
    try {
        // Přijetí inicializačních dat z hlavního vlákna (UI)
        const initialClauses = event.data;
        // Spuštění výpočetně náročného logického stroje na pozadí
        const result = autoSolve(initialClauses);
        // Odeslání výsledku a časové osy důkazu zpět do uživatelského rozhraní
        self.postMessage({ type: 'SUCCESS', payload: result } as WorkerMessage);
    } catch (error) {
        // Bezpečné zachycení chyb (např. překročení povoleného počtu kroků či času)
        self.postMessage({
            type: 'ERROR',
            payload: error instanceof Error ? error.message : 'An unknown math error occurred.'
        } as WorkerMessage);
    }
});