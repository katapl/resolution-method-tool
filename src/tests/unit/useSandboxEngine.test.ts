import { describe, it, expect } from 'vitest';
import { getCurrentPhase, executeSelectLiteral, executeRemoveClause } from '../../engine/sandboxEngine';
import type { Clause } from '../../engine/types';

describe('Sandbox Engine (State Machine)', () => {
    const makeClause = (
        id: string,
        literals:{ name: string; polarity: boolean }[],
        removed = false
    ): Clause => ({
        id, literals, removed, parents: [], isNegatedConclusion: false
    });

    describe('getCurrentPhase', () => {
        it('should return DONE if empty clause exists', () => {
            const state = {
                activePool: [makeClause('1', [])],
                resolvedPairs: new Set<string>(),
                targetLiteral: null,
                lastExhaustedLiteral: null
            };
            const result = getCurrentPhase(state);
            expect(result.phase).toBe('DONE');
        });

        it('should return REDUCTION if pool has tautologies', () => {
            const state = {
                activePool: [makeClause('1', [{ name: 'A', polarity: true }, { name: 'A', polarity: false }])],
                resolvedPairs: new Set<string>(),
                targetLiteral: null,
                lastExhaustedLiteral: null
            };
            const result = getCurrentPhase(state);
            expect(result.phase).toBe('REDUCTION');
        });

        it('should return LITERAL_SELECTION if no target literal is set and no reductions pending', () => {
            const state = {
                activePool: [
                    makeClause('1', [{ name: 'A', polarity: true }]),
                    makeClause('2', [{ name: 'A', polarity: false }])
                ],
                resolvedPairs: new Set<string>(),
                targetLiteral: null,
                lastExhaustedLiteral: null
            };
            const result = getCurrentPhase(state);
            expect(result.phase).toBe('LITERAL_SELECTION');
        });
    });

    describe('executeRemoveClause', () => {
        it('should block removing a clause in MANUAL_SWEEP if it does not contain the target literal', () => {
            const state = {
                activePool: [makeClause('1', [{ name: 'B', polarity: true }])],
                resolvedPairs: new Set<string>(),
                targetLiteral: 'A', // Cílový literál je A
                lastExhaustedLiteral: null
            };
            const { error } = executeRemoveClause(state, '1', 'MANUAL_SWEEP');
            expect(error?.key).toBe('sandbox.errMustRemoveTarget');
        });
    });
});