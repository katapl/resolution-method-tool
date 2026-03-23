import type {Clause} from "./types.ts";

//create unit tests during development
export function checkTautology(clause: Clause): boolean {
    let exists: boolean = false;
    for (const lit of clause.literals){
        exists = clause.literals.some(
            (u) => u.name === lit.name && u.polarity !== lit.polarity
        );
    }
    return exists;
}

export function removeTautologies(clauses: Clause[]){}

export function checkSubsumption(clauseA, clauseB): boolean

export function removeSubsumed(clauses: Clause[]){}

export function resolveClauses(clauseA, clauseB): { isValid: boolean, result?: Clause, error?: string }

export function isPureLiteral(clauses: Clause[]){}

export function removePureLiteralClauses(clauses: Clause[]){}

export function applySetReductions(clauses: Clause[]): Clause[] {}