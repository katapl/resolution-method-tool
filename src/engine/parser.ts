import type {Clause, Literal} from "./types.ts";

const generateId = () => `C-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

const parseLiteral = (rawLit: string): Literal | null => {
    const noSpaceLit = rawLit.replace(/\s+/g, '');
    if (!noSpaceLit) return null;

    const negationsMatch = noSpaceLit.match(/^[\~!]+/);
    const negationCount = negationsMatch ? negationsMatch[0].length : 0;

    const isNegated = negationCount % 2 !== 0;
    const name = noSpaceLit.replace(/^[\~!]+/, '');

    if (!name) return null;

    return { polarity: !isNegated, name };
};

const parsePremiseClause = (rawClause: string): Clause | null => {
    const rawLiterals = rawClause.trim().split(/\s+v\s+|\s*\|\s*/i);

    const literals = rawLiterals
        .map(parseLiteral)
        .filter((lit): lit is Literal => lit !== null);

    if (literals.length === 0) return null;

    return {
        id: generateId(),
        literals: literals
    };
};

const parseConclusionClause = (rawClause: string): Clause[] => {
    const rawLiterals = rawClause.trim().split(/\s+v\s+|\s*\|\s*/i);

    const literals = rawLiterals
        .map(parseLiteral)
        .filter((lit): lit is Literal => lit !== null);

    // De Morgan's Law: ~(A v B) -> ~A AND ~B (Separate unit clauses)
    return literals.map(lit => ({
        id: generateId(),
        literals: [{ polarity: !lit.polarity, name: lit.name }],
        isNegatedConclusion: true
    }));
};

export const parseFormulaToClauses = (input: string): Clause[] => {
    if (!input.trim()) return [];

    const parts = input.split(/\s*\|\=\s*/);
    const premisesStr = parts[0];
    const conclusionStr = parts[1] || '';

    const allClauses: Clause[] = [];

    if (premisesStr.trim()) {
        const premiseStrs = premisesStr.split(',');
        premiseStrs.forEach(str => {
            const clause = parsePremiseClause(str);
            if (clause) allClauses.push(clause);
        });
    }

    if (conclusionStr.trim()) {
        const conclusionStrs = conclusionStr.split(',');
        conclusionStrs.forEach(str => {
            const unitClauses = parseConclusionClause(str);
            allClauses.push(...unitClauses);
        });
    }

    return allClauses;
};