import { describe, it, expect } from 'vitest';
import { parseFormulaToClauses } from '../../engine/parser';

describe('Parser: parseFormulaToClauses', () => {

    it('should correctly parse standard premises', () => {
        const clauses = parseFormulaToClauses('A v B, ~C');

        expect(clauses).toHaveLength(2);

        expect(clauses[0].literals).toHaveLength(2);
        expect(clauses[0].literals[0]).toEqual({ name: 'A', polarity: true });
        expect(clauses[0].literals[1]).toEqual({ name: 'B', polarity: true });

        expect(clauses[1].literals).toHaveLength(1);
        expect(clauses[1].literals[0]).toEqual({ name: 'C', polarity: false });
    });

    it('should negate the conclusion and apply De Morgan’s Law', () => {
        const clauses = parseFormulaToClauses('A |- B v C');

        expect(clauses).toHaveLength(3);

        const conclusion1 = clauses.find(c => c.literals[0].name === 'B');
        const conclusion2 = clauses.find(c => c.literals[0].name === 'C');

        expect(conclusion1?.literals[0].polarity).toBe(false);
        expect(conclusion1?.isNegatedConclusion).toBe(true);

        expect(conclusion2?.literals[0].polarity).toBe(false);
        expect(conclusion2?.isNegatedConclusion).toBe(true);
    });

    it('should quietly drop invalid literals returning null (Our safety net!)', () => {
        const clauses = parseFormulaToClauses('A v @');
        expect(clauses[0].literals).toHaveLength(1);
        expect(clauses[0].literals[0].name).toBe('A');
    });
});