import {type Literal, type Clause, type ProofStep, clauseToString} from "./types.ts";
import { runReductions } from "./reduction.ts"
import { useTranslation } from "react-i18next"

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
    };
}

function getVariables(pool: Clause[]): string[] {
    const vars = new Set<string>();
    pool.forEach(c => c.literals.forEach(l => vars.add(l.name)));
    return Array.from(vars);
}

function selectNextVariable(pool: Clause[], vars: string[]): string {
    const sortedVars = [...vars].sort((a, b) => {
        const aPos = pool.filter(c => c.literals.some(l => l.name === a && l.polarity)).length;
        const aNeg = pool.filter(c => c.literals.some(l => l.name === a && !l.polarity)).length;
        const bPos = pool.filter(c => c.literals.some(l => l.name === b && l.polarity)).length;
        const bNeg = pool.filter(c => c.literals.some(l => l.name === b && !l.polarity)).length;

        return (aPos * aNeg) - (bPos * bNeg);
    });

    return sortedVars[0];
}

function generateResolventsPhase(
    currentPool: Clause[],
    posClauses: Clause[],
    negClauses: Clause[],
    targetVar: string,
    initialStepCounter: number,
    history: ProofStep[],
    maxSteps: number
): { newResolvents: Clause[], emptyClauseFound: boolean, nextStepCounter: number } {

    const newResolvents: Clause[] = [];
    let emptyClauseFound = false;
    let stepCounter = initialStepCounter;

    posClauses.some(pos => {
        return negClauses.some(neg => {
            if (stepCounter >= maxSteps) {
                throw new Error(`Calculation halted: Surpassed the maximum limit of ${maxSteps} steps during resolution.`);
            }
            const targetLiteral = pos.literals.find(l => l.name === targetVar)!;
            const newId = `auto-res-${stepCounter}`;
            const resolvent = resolve(targetLiteral, pos, neg, newId);

            history.push({
                stepNumber: stepCounter++,
                type: 'RESOLUTION',
                message: {
                    key: 'engine.resolvedOn',
                    params: { literal: targetVar }
                },
                poolBefore: [...currentPool, ...newResolvents],
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

    return { newResolvents, emptyClauseFound, nextStepCounter: stepCounter };
}

export function autoSolve(initialClauses: Clause[]): { finalPool: Clause[], history: ProofStep[] } {
    const MAX_STEPS = 2000;
    const MAX_TIME_MS = 5000; // 5 seconds
    const startTime = Date.now();

    let pool = [...initialClauses];
    const history: ProofStep[] = [];
    let stepCounter = 1;

    const hasNegatedConclusion = pool.some(c => c.isNegatedConclusion);
    if (hasNegatedConclusion) {
        history.push({
            stepNumber: stepCounter++,
            type: 'INIT',
            message: {
                key: 'engine.negateConclusion',
                params: {}
            },
            poolBefore: [...pool]
        });
    }

    let reductionResult = runReductions(pool, history, stepCounter);
    pool = reductionResult.pool;
    stepCounter = reductionResult.stepCounter;

    let vars = getVariables(pool);
    let emptyClauseFound = false;

    while (vars.length > 0 && !emptyClauseFound) {
        if (stepCounter >= MAX_STEPS) {
            throw new Error(`Calculation halted: Surpassed the maximum limit of ${MAX_STEPS} steps.`);
        }
        if (Date.now() - startTime > MAX_TIME_MS) {
            throw new Error(`Calculation halted: Execution timed out after ${MAX_TIME_MS / 1000} seconds.`);
        }

        const targetVar = selectNextVariable(pool, vars);
        const posClauses = pool.filter(
            c => c.literals.some(l => l.name === targetVar && l.polarity)
        );
        const negClauses = pool.filter(
            c => c.literals.some(l => l.name === targetVar && !l.polarity)
        );

        if (posClauses.length > 0 && negClauses.length > 0) {

            const phaseAResult = generateResolventsPhase(pool, posClauses, negClauses, targetVar, stepCounter, history, MAX_STEPS);
            const newResolvents = phaseAResult.newResolvents;
            emptyClauseFound = phaseAResult.emptyClauseFound;
            stepCounter = phaseAResult.nextStepCounter;

            pool = [...pool, ...newResolvents];

            if (!emptyClauseFound) {
                const parentsToRemove = [...posClauses, ...negClauses];

                history.push({
                    stepNumber: stepCounter++,
                    type: 'REDUCTION',
                    message: {
                        key: 'engine.removeParents',
                        params: { literal: targetVar }
                    },
                    poolBefore: [...pool],
                    removedClauses: parentsToRemove
                });

                pool = pool.filter(c => !parentsToRemove.some(p => p.id === c.id));

                reductionResult = runReductions(pool, history, stepCounter);
                pool = reductionResult.pool;
                stepCounter = reductionResult.stepCounter;

                vars = getVariables(pool);
            }
        } else {
            vars = vars.filter(v => v !== targetVar);
        }
    }

    return { finalPool: pool, history };
}

