import type {Clause} from "./types.ts";
import { literalToString } from "./types"

export function checkTautology(clause: Clause): boolean {
    return clause.literals.some((lit1) =>
        clause.literals.some((lit2) =>
            lit1.name === lit2.name && lit1.polarity !== lit2.polarity
        )
    );
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

function getSubsumedClausesSafe(pool: Clause[]): Clause[] {
    return pool.filter((c1, i) => {
        return pool.some((c2, j) => {

            const isDifferentClause = i !== j;

            const isSmallerOrEqual = c2.literals.length <= c1.literals.length;

            const isSafeDuplicate = !(c1.literals.length === c2.literals.length && i < j);

            const isSubsuming = c2.literals.every(l2 =>
                c1.literals.some(l1 => l1.name === l2.name && l1.polarity === l2.polarity)
            );
            return isDifferentClause && isSmallerOrEqual && isSafeDuplicate && isSubsuming;
        });
    });
}

export function getPureLiteral(targetClauses: Clause, pool: Clause[]): Literal | null {
    for (const lit of targetClauses.literals) {
        const complementaryExists = pool.some(clause =>
            clause.literals.some(otherLit =>
                otherLit.name === lit.name && otherLit.polarity !== lit.polarity
            )
        );
        if (!complementaryExists) {
            return lit;
        }
    }
    return null;
}

export function runReductions(
    initialPool: Clause[],
    history: ProofStep[],
    initialStepCounter: number
): { pool: Clause[], stepCounter: number } {

    let pool = [...initialPool];
    let stepCounter = initialStepCounter;
    let madeReductions = true;

    while (madeReductions) {
        madeReductions = false;

        const tautologies = pool.filter(c => checkTautology(c));
        if (tautologies.length > 0) {
            history.push({
                stepNumber: stepCounter++,
                type: 'REDUCTION',
                message: {
                    key: 'engine.removedTautologies',
                    params: { count: tautologies.length }
                },
                poolBefore: [...pool],
                removedClauses: tautologies
            });
            pool = pool.filter(c => !tautologies.some(t => t.id === c.id));
            madeReductions = true;
        }
        else {
            const subsumed = getSubsumedClausesSafe(pool);
            if (subsumed.length > 0) {
                history.push({
                    stepNumber: stepCounter++,
                    type: 'REDUCTION',
                    message: {
                        key: 'engine.removedSubsumed',
                        params: { count: subsumed.length }
                    },
                    poolBefore: [...pool],
                    removedClauses: subsumed
                });
                pool = pool.filter(c => !subsumed.some(s => s.id === c.id));
                madeReductions = true;
            }
            else {
                const pureLiteralsFound = new Set<string>();

                const pureClauses = pool.filter(c => {
                    const pureLit = getPureLiteral(c, pool);
                    if (pureLit !== null) {
                        const litString = literalToString(pureLit);
                        pureLiteralsFound.add(litString);
                        return true;
                    }
                    return false;
                });

                if (pureClauses.length > 0) {
                    const pureNames = Array.from(pureLiteralsFound).join(', ');

                    history.push({
                        stepNumber: stepCounter++,
                        type: 'REDUCTION',
                        message: {
                            key: 'engine.removedPureLiterals',
                            params: { count: pureClauses.length, names: pureNames },
                        },
                        poolBefore: [...pool],
                        removedClauses: pureClauses
                    });
                    pool = pool.filter(c => !pureClauses.some(p => p.id === c.id));
                    madeReductions = true;
                }
            }
        }
    }
    return { pool, stepCounter };
}