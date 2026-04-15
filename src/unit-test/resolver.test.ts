import { describe, it, expect } from 'vitest';
import { resolve } from '../engine/resolver.ts';
import { checkTautology } from '../engine/reduction.ts';
import type { Clause, Literal } from '../engine/types.ts';

function makeClause(id: string, literals: { name: string, polarity: boolean }[]): Clause {
    return { id, literals };
}

describe('Core Resolution Logic', () => {

    describe('resolve', () => {
        it('should correctly merge parents and eliminate the target literal', () => {
            const c1 = makeClause('1', [{ name: 'P', polarity: true }, { name: 'R', polarity: true }]);
            const c2 = makeClause('2', [{ name: 'P', polarity: false }, { name: 'Q', polarity: true }]);
            const target: Literal = { name: 'P', polarity: true };

            const resolvent = resolve(target, c1, c2, 'child-1');

            expect(resolvent.literals.length).toBe(2);

            expect(resolvent.literals.some(l => l.name === 'P')).toBe(false);

            expect(resolvent.literals.some(l => l.name === 'R')).toBe(true);
            expect(resolvent.literals.some(l => l.name === 'Q')).toBe(true);
        });

        it('should generate an empty clause if parents are exact opposites', () => {
            const c1 = makeClause('1', [{ name: 'P', polarity: true }]);
            const c2 = makeClause('2', [{ name: 'P', polarity: false }]);
            const target: Literal = { name: 'P', polarity: true };

            const resolvent = resolve(target, c1, c2, 'child-empty');

            expect(resolvent.literals.length).toBe(0);
        });
    });

    describe('checkTautology', () => {
        it('should return true for a clause containing P and ~P', () => {
            const tautology = makeClause('1', [{ name: 'P', polarity: true }, { name: 'P', polarity: false }]);
            expect(checkTautology(tautology)).toBe(true);
        });

        it('should return false for a normal clause', () => {
            const normal = makeClause('2', [{ name: 'P', polarity: true }, { name: 'Q', polarity: false }]);
            expect(checkTautology(normal)).toBe(false);
        });
    });
});