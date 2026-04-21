import { describe, it, expect } from 'vitest';
import { validateFormula } from '../../engine/validator';

describe('validateFormula', () => {

    it('return null for valid satisfiability formulas', () => {
        expect(validateFormula('A v B, ~C v D')).toBeNull();
        expect(validateFormula('A, B, C, D')).toBeNull();
        expect(validateFormula('(A v B), (~A v C)')).toBeNull(); // Parentheses handled
    });

    it('return null for valid entailment formulas', () => {
        expect(validateFormula('A v B, ~B |- A')).toBeNull();
        expect(validateFormula('p ⊢ q')).toBeNull();
    });

    it('catch invalid characters', () => {
        const result = validateFormula('A v B, C @ D');
        expect(result?.key).toBe('input.errInvalidChar');
        expect(result?.params?.char).toBe('@');
    });

    it('catch trailing negations', () => {
        const result = validateFormula('~A v ~B¬');
        expect(result?.key).toBe('input.errTrailingNegation');
    });

    it('block multiple character variables', () => {
        const result = validateFormula('Dog v Cat');
        expect(result?.key).toBe('input.errMultiChar');
        expect(result?.params?.literal).toBe('Dog');
    });

    it('block multiple entailment symbols', () => {
        const result = validateFormula('A |- B |- C');
        expect(result?.key).toBe('input.errMultipleEntailment');
    });

    it('block missing conclusions after an entailment symbol', () => {
        const result = validateFormula('A v B |- ');
        expect(result?.key).toBe('input.errMissingConclusion');
    });

    it('enforce the maximum limit of 26 variables', () => {
        const alphabet = "A,B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,W,X,Y,Z,a,b";
        const result = validateFormula(alphabet);
        expect(result?.key).toBe('input.errMaxVariables');
    });
});