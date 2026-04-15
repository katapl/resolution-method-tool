import { describe, it, expect } from 'vitest';
import { autoSolve } from '../engine/resolver.ts';
import { parseFormulaToClauses } from '../engine/parser.ts';

describe('The Davis-Putnam Auto-Solver', () => {

    it('should find an Empty Clause (Contradiction) for an unsatisfiable formula', () => {
        const rawInput = "P, ~P v Q, ~Q";
        const initialPool = parseFormulaToClauses(rawInput);

        const { finalPool, history } = autoSolve(initialPool);

        expect(history.length).toBeGreaterThan(0);

        const hasEmptyClause = finalPool.some(clause => clause.literals.length === 0);
        expect(hasEmptyClause).toBe(true);
    });

    it('should return an Empty Set (Satisfiable) for a valid formula', () => {
        const rawInput = "P v Q, R";
        const initialPool = parseFormulaToClauses(rawInput);

        const { finalPool } = autoSolve(initialPool);

        expect(finalPool.length).toBe(0);
    });

    it('should handle the 4-variable Combinatorial Explosion correctly', () => {
        const massiveInput = "P v Q v R v S, P v Q v R v ~S, P v Q v ~R v S, P v Q v ~R v ~S, P v ~Q v R v S, P v ~Q v R v ~S, P v ~Q v ~R v S, P v ~Q v ~R v ~S, ~P v Q v R v S, ~P v Q v R v ~S, ~P v Q v ~R v S, ~P v Q v ~R v ~S, ~P v ~Q v R v S, ~P v ~Q v R v ~S, ~P v ~Q v ~R v S, ~P v ~Q v ~R v ~S";
        const initialPool = parseFormulaToClauses(massiveInput);

        const { finalPool } = autoSolve(initialPool);

        const hasEmptyClause = finalPool.some(clause => clause.literals.length === 0);
        expect(hasEmptyClause).toBe(true);
    });
});