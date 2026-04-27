import type {Clause, Literal} from "./types.ts";

const generateId = () => `C-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;

const parseLiteral = (rawLit: string): Literal | null => {
    const noSpaceLit = rawLit.replace(/\s+/g, '');
    if (!noSpaceLit) return null;

    // Identifikace a spočítání všech symbolů negace (podpora různých notací)
    const negationsMatch = noSpaceLit.match(/^[\~!¬]+/);
    const negationCount = negationsMatch ? negationsMatch[0].length : 0;
    // Vyhodnocení polarity pomocí modula (redukce dvojité negace ~~A -> A)
    const isNegated = negationCount % 2 !== 0;

    // Normalizace názvu proměnné na velká písmena
    const name = noSpaceLit.replace(/^[\~!¬]+/, '').toUpperCase();
    if (!name) return null;

    // Striktní validace: Povoleny jsou pouze samostatné znaky abecedy
    if (!/^[a-zA-Z]$/.test(name)) {
        return null;
    }

    return { polarity: !isNegated, name };
};

const parsePremiseClause = (rawClause: string): Clause | null => {
    const rawLiterals = rawClause.trim().split(/\s+v\s+|\s*\|\s*|\s*∨\s*|\s*\+\s*/i);
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
    const rawLiterals = rawClause.trim().split(/\s+v\s+|\s*\|\s*|\s*∨\s*|\s*\+\s*/i);

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

export const parseFormulaToClauses = (rawInput: string): Clause[] => {
    const input = rawInput.replace(/[()]/g, '');
    if (!input.trim()) return [];

    const parts = input.split(/\s*\|\=\s*|\s*⊢\s*|\s*\|-\s*/);
    const premisesStr = parts[0];
    const conclusionStr = parts[1] || '';

    const allClauses: Clause[] = [];

    if (premisesStr.trim()) {
        const premiseStrs = premisesStr.split(/\s*,\s*|\s*\^\s*|\s*∧\s*|\s*&\s*/);
        premiseStrs.forEach(str => {
            const clause = parsePremiseClause(str);
            if (clause) allClauses.push(clause);
        });
    }

    if (conclusionStr.trim()) {
        const conclusionStrs = conclusionStr.split(/\s*,\s*|\s*\^\s*|\s*∧\s*|\s*&\s*/);
        conclusionStrs.forEach(str => {
            const unitClauses = parseConclusionClause(str);
            allClauses.push(...unitClauses);
        });
    }

    return allClauses;
};