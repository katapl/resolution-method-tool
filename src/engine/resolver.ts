import {type Literal, type Clause, type ProofStep, clauseToString} from "./types.ts";
import { runReductions } from "./reduction.ts"

export function resolve(literal: Literal, c1: Clause, c2: Clause, newId: string): Clause {
    const combined = [...c1.literals, ...c2.literals];

    const filtered = combined.filter((lit) => lit.name !== literal.name);

    const uniqueLiterals: Literal[] = [];
    for (const lit of filtered) {
        const exists = uniqueLiterals.some(
            (u) => u.name === lit.name && u.polarity === lit.polarity
        );
        if (!exists) uniqueLiterals.push(lit);
    }

    return {
        id: newId,
        literals: uniqueLiterals,
        parents: [c1.id, c2.id],
    };
}

export function getComplementaryLiteral(c1: Clause, c2: Clause): Literal | null {
    for (const l1 of c1.literals) {
        for (const l2 of c2.literals) {
            if (l1.name === l2.name && l1.polarity !== l2.polarity) {
                return l1;
            }
        }
    }
    return null;
}

function getVariables(pool: Clause[]): string[] {
    const vars = new Set<string>();
    pool.forEach(c => c.literals.forEach(l => vars.add(l.name)));
    return Array.from(vars);
}

export function autoSolve(initialClauses: Clause[]): { finalPool: Clause[], history: ProofStep[] } {
    let pool = [...initialClauses];
    const history: ProofStep[] = [];
    let stepCounter = 1;

    let reductionResult = runReductions(pool, history, stepCounter);
    pool = reductionResult.pool;
    stepCounter = reductionResult.stepCounter;

    let vars = getVariables(pool);
    let emptyClauseFound = false;

    while (vars.length > 0 && !emptyClauseFound) {

        vars.sort((a, b) => {
            const aPos = pool.filter(c => c.literals.some(l => l.name === a && l.polarity)).length;
            const aNeg = pool.filter(c => c.literals.some(l => l.name === a && !l.polarity)).length;
            const bPos = pool.filter(c => c.literals.some(l => l.name === b && l.polarity)).length;
            const bNeg = pool.filter(c => c.literals.some(l => l.name === b && !l.polarity)).length;
            return (aPos * aNeg) - (bPos * bNeg);
        });

        const targetVar = vars.shift()!;

        const posClauses = pool.filter(c => c.literals.some(l => l.name === targetVar && l.polarity));
        const negClauses = pool.filter(c => c.literals.some(l => l.name === targetVar && !l.polarity));

        if (posClauses.length > 0 && negClauses.length > 0) {
            const newResolvents: Clause[] = [];
            const parentsToRemove = [...posClauses, ...negClauses];

            posClauses.some(pos => {
                return negClauses.some(neg => {
                    const targetLiteral = pos.literals.find(l => l.name === targetVar)!;
                    const newId = `auto-res-${stepCounter}`;
                    const resolvent = resolve(targetLiteral, pos, neg, newId);

                    history.push({
                        stepNumber: stepCounter++,
                        type: 'RESOLUTION',
                        message: `Resolved on "${targetVar}".`,
                        poolBefore: [...pool, ...newResolvents],
                        parent1: pos,
                        parent2: neg,
                        resolvent: resolvent
                    });

                    newResolvents.push(resolvent);

                    if (resolvent.literals.length === 0) {
                        emptyClauseFound = true;
                        return true;
                    }
                    return false;
                });
            });

            pool = [...pool, ...newResolvents];

            if (!emptyClauseFound) {
                history.push({
                    stepNumber: stepCounter++,
                    type: 'REDUCTION',
                    message: `Removed parent clauses containing "${targetVar}".`,
                    poolBefore: [...pool],
                    removedClauses: parentsToRemove
                });

                pool = pool.filter(c => !parentsToRemove.some(p => p.id === c.id));

                reductionResult = runReductions(pool, history, stepCounter);
                pool = reductionResult.pool;
                stepCounter = reductionResult.stepCounter;

                vars = getVariables(pool);
            }
        }
    }

    return { finalPool: pool, history };
}

export function findFirstResolution(pool: Clause[], stepCounter: number, resolvedPairs: Set<string>): ProofStep | null {
    for (let i = 0; i < pool.length; i++) {
        for (let j = i + 1; j < pool.length; j++) {
            const c1 = pool[i];
            const c2 = pool[j];

            const pairKey = `${c1.id}-${c2.id}`;
            if (resolvedPairs.has(pairKey)) continue;

            const targetLiteral = getComplementaryLiteral(c1, c2);

            if (targetLiteral) {
                const newId = `auto-${stepCounter}`;
                return {
                    stepNumber: stepCounter,
                    type: 'RESOLUTION',
                    message: `Resolved on "${targetLiteral.name}".`,
                    poolBefore: [...pool],
                    parent1: c1,
                    parent2: c2,
                    resolvent: resolve(targetLiteral, c1, c2, newId)
                };
            }
        }
    }
    return null;
}