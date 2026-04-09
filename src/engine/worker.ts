import { autoSolve } from './resolver';
import type { Clause } from './types';

self.addEventListener('message', (event: MessageEvent<Clause[]>) => {
    try {
        const initialClauses = event.data;

        const result = autoSolve(initialClauses);

        self.postMessage({ type: 'SUCCESS', payload: result });
    } catch (error) {
        self.postMessage({
            type: 'ERROR',
            payload: error instanceof Error ? error.message : 'An unknown math error occurred.'
        });
    }
});