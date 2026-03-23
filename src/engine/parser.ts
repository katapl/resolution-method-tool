import type {Clause, Literal} from "./types.ts";

// add |= parsing
export const parseFormulaToClauses = (input: string): Clause[] => {
    if (!input.trim()) return [];

    const rawClauses = input.split(',');

    return rawClauses.map((rawClause, index) => {
        const rawLiterals = rawClause.trim().split(/\s+v\s+|\s*\|\s*/i);

        const literals: Literal[] = rawLiterals.map(rawLit => {
            const cleanLit = rawLit.trim();
            const isNegated = /^[\~!]/.test(cleanLit);
            const name = cleanLit.replace(/^[\~!]/, '').trim();

            return {
                polarity: !isNegated,
                name: name
            };
        }).filter(lit => lit.name !== '');

        return {
            id: `C${index + 1}`,
            literals: literals
        };
    }).filter(clause => clause.literals.length > 0);
};