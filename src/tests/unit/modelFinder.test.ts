import { findAllModels } from '../../engine/modelFinder';
import type { Clause } from '../../engine/types';

describe('findAllModels (Backtracking Engine)', () => {
    const makeClause = (
        id: string,
        literals: { name: string; polarity: boolean }[]
    ): Clause => ({
        id,
        literals,
        removed: false,
        parents: []
    });

    it('should find the correct model for a satisfiable formula', () => {
        const clauses = [
            makeClause('1', [{ name: 'A', polarity: true }, { name: 'B', polarity: true }]), // A v B
            makeClause('2', [{ name: 'A', polarity: false }]) // ~A
        ];

        const models = findAllModels(clauses);

        expect(models).toHaveLength(1);
        expect(models[0]).toEqual({ A: false, B: true });
    });

    it('should return an empty array for an unsatisfiable formula', () => {
        const clauses = [
            makeClause('1', [{ name: 'A', polarity: true }]),  // A
            makeClause('2', [{ name: 'A', polarity: false }]) // ~A
        ];

        const models = findAllModels(clauses);
        expect(models).toHaveLength(0);
    });

    it('should return no models if the set contains an empty clause', () => {
        const clauses = [
            makeClause('1', [{ name: 'A', polarity: true }]),
            makeClause('2', [])
        ];

        const models = findAllModels(clauses);
        expect(models).toHaveLength(0);
    });

    it('should return all possible models for a tautology', () => {
        const clauses = [
            makeClause('1', [{ name: 'A', polarity: true }, { name: 'A', polarity: false }])
        ];

        const models = findAllModels(clauses);

        expect(models).toHaveLength(2);
        expect(models).toContainEqual({ A: true });
        expect(models).toContainEqual({ A: false });
    });
});