import {type Literal, type Clause, clauseToString} from "./types.ts";

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

export interface ProofStep {
    stepNumber: number;
    message: string;
    poolBefore: Clause[];
    parent1: Clause;
    parent2: Clause;
    resolvent: Clause;
}

export function autoSolve(initialClauses: Clause[]): { finalPool: Clause[], history: ProofStep[] } {
    let pool = [...initialClauses];
    const history: ProofStep[] = [];
    let stepCounter = 1;

    let nextStep = findFirstResolution(pool, stepCounter);

    while (nextStep !== null) {

        history.push(nextStep);

        pool = pool.filter(c => c.id !== nextStep!.parent1.id && c.id !== nextStep!.parent2.id);
        pool.push(nextStep.resolvent);

        if (nextStep.resolvent.literals.length === 0) {
            nextStep = null;
        } else {
            stepCounter++;
            nextStep = findFirstResolution(pool, stepCounter);
        }
    }

    return { finalPool: pool, history };
}

function findFirstResolution(pool: Clause[], stepCounter: number): ProofStep | null {
    for (let i = 0; i < pool.length; i++) {
        for (let j = i + 1; j < pool.length; j++) {
            const c1 = pool[i];
            const c2 = pool[j];

            const targetLiteral = getComplementaryLiteral(c1, c2);

            if (targetLiteral) {
                const newId = `auto-${stepCounter}`;
                const resolvent = resolve(targetLiteral, c1, c2, newId);

                return {
                    stepNumber: stepCounter,
                    message: `Resolved on "${targetLiteral.name}". Parents ${clauseToString(c1)} and ${clauseToString(c2)} removed.`,
                    poolBefore: [...pool],
                    parent1: c1,
                    parent2: c2,
                    resolvent: resolvent
                };
            }
        }
    }

    return null;
}