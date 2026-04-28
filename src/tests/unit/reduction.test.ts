import { checkTautology, checkSubsumption, runReductions } from '../../engine/reduction';
import type { Clause } from '../../engine/types';
import { describe, it, expect } from 'vitest';

describe('Reduction Engine', () => {
    const makeClause = (
        id: string,
        literals: { name: string; polarity: boolean }[]
    ): Clause => ({
        id,
        literals,
        removed: false,
    });

    describe('checkTautology', () => {
        it('should return true if clause contains A and ~A', () => {
            const tautology = makeClause('1', [
                { name: 'A', polarity: true },
                { name: 'A', polarity: false }
            ]);
            expect(checkTautology(tautology)).toBe(true);
        });

        it('should return false for valid clauses', () => {
            const valid = makeClause('2', [
                { name: 'A', polarity: true },
                { name: 'B', polarity: false }
            ]);
            expect(checkTautology(valid)).toBe(false);
        });
    });

    describe('checkSubsumption', () => {
        it('should return true if target clause is subsumed by a smaller/equal clause in pool', () => {
            const target = makeClause('1', [
                { name: 'A', polarity: true },
                { name: 'B', polarity: true }
            ]); // A v B
            const pool = [
                makeClause('2', [{ name: 'A', polarity: true }]) // A (Subsumes A v B)
            ];
            expect(checkSubsumption(target, pool)).toBe(true);
        });

        it('should return false if no clause in pool subsumes the target', () => {
            const target = makeClause('1', [{ name: 'A', polarity: true }]);
            const pool = [
                makeClause('2', [
                    { name: 'A', polarity: true },
                    { name: 'B', polarity: true }
                ])
            ];
            expect(checkSubsumption(target, pool)).toBe(false);
        });
    });

    describe('runReductions', () => {
        it('should iteratively remove tautologies, subsumed clauses, and pure literals', () => {
            const initialPool = [
                makeClause('1', [{ name: 'A', polarity: true }, { name: 'A', polarity: false }]),
                makeClause('2', [{ name: 'B', polarity: true }]),
                makeClause('3', [{ name: 'B', polarity: true }, { name: 'C', polarity: true }]),
                makeClause('4', [{ name: 'D', polarity: false }]),
                makeClause('5', [{ name: 'B', polarity: false }])
            ];

            const history: any[] = [];
            const result = runReductions(initialPool, history, 1);

            expect(result.pool).toHaveLength(2);

            const survivingIds = result.pool.map(c => c.id);
            expect(survivingIds).toContain('2');
            expect(survivingIds).toContain('5');

            expect(history).toHaveLength(3);
        });
    });
});