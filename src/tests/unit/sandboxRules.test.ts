import { describe, it, expect } from 'vitest';
import { evaluateRemoval, evaluateResolution } from '../../engine/sandboxRules';
import type { Clause } from '../../engine/types';

describe('Sandbox Rules', () => {
    const makeClause = (
        id: string,
        literals: { name: string; polarity: boolean }[]
    ): Clause => ({
        id, literals, removed: false, parents: [], isNegatedConclusion: false
    });

    describe('evaluateRemoval', () => {
        it('should allow removal of a tautology', () => {
            const tautology = makeClause('c1', [{ name: 'A', polarity: true }, { name: 'A', polarity: false }]);
            const pool = [tautology];
            const result = evaluateRemoval('c1', pool);
            expect(result.success).toBe(true);
            expect(result.message.key).toBe('sandbox.removedTautology');
        });

        it('should block removal of a valid core clause', () => {
            const valid = makeClause('c1', [{ name: 'A', polarity: true }, { name: 'B', polarity: true }]);

            const pool = [
                valid,
                makeClause('c2', [{ name: 'A', polarity: false }]),
                makeClause('c3', [{ name: 'B', polarity: false }])
            ];

            const result = evaluateRemoval('c1', pool);

            expect(result.success).toBe(false);
            expect(result.message.key).toBe('sandbox.errInvalidRemoval');
        });
    });

    describe('evaluateResolution', () => {
        const c1 = makeClause('1', [{ name: 'A', polarity: true }]);
        const c2 = makeClause('2', [{ name: 'A', polarity: false }]);
        const c3 = makeClause('3', [{ name: 'A', polarity: true }, { name: 'B', polarity: true }]);

        it('should return INVALID if target literal is missing or polarities match', () => {
            const pool = [c1, c3];
            const result = evaluateResolution('1', '3', pool, new Set(), 'A');
            expect(result.status).toBe('INVALID');
        });

        it('should return DUPLICATE if pair was already resolved', () => {
            const pool = [c1, c2];
            const resolvedPairs = new Set(['1-2']);
            const result = evaluateResolution('1', '2', pool, resolvedPairs, 'A');
            expect(result.status).toBe('DUPLICATE');
        });

        it('should return RESOLVED and create empty clause (contradiction)', () => {
            const pool = [c1, c2]; // A and ~A
            const result = evaluateResolution('1', '2', pool, new Set(), 'A');
            expect(result.status).toBe('RESOLVED');
            expect(result.resolvent?.literals).toHaveLength(0);
            expect(result.message.key).toBe('sandbox.proofContradiction');
        });
    });
});