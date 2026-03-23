import type {Clause} from "./types.ts";

//create unit tests during development
export function checkTautology(clause: Clause): boolean {
    return clause.literals.some((lit1) =>
        clause.literals.some((lit2) =>
            lit1.name === lit2.name && lit1.polarity !== lit2.polarity
        )
    );
}

export function removeTautologies(clauses: Clause[]){

}

export function checkSubsumption(targetClause: Clause, pool: Clause[]): boolean {
    return pool.some(otherClause => {
        if (otherClause.id === targetClause.id) return false;

        if (otherClause.literals.length > targetClause.literals.length) return false;

        return otherClause.literals.every(otherLit =>
            targetClause.literals.some(targetLit =>
                targetLit.name === otherLit.name && targetLit.polarity === otherLit.polarity
            )
        );
    });
}

export function removeSubsumed(clauses: Clause[]){}

export function resolveClauses(clauseA, clauseB): { isValid: boolean, result?: Clause, error?: string }

export function getPureLiteral(targetClauses: Clause, pool: Clause[]): Literal | null {
    for (const lit of targetClauses.literals) {
        const oppositeExists = pool.some(clause =>
            clause.literals.some(otherLit =>
                otherLit.name === lit.name && otherLit.polarity !== lit.polarity
            )
        );
        if (!oppositeExists) {
            return lit;
        }
    }
    return null;
}

export function removePureLiteralClauses(clauses: Clause[]){}

export function applySetReductions(clauses: Clause[]): Clause[] {}