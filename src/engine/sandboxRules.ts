import { type Clause } from './types';
import { getComplementaryLiteral, resolve } from './resolver';
import { checkTautology, checkSubsumption, getPureLiteral } from './reduction';

export interface RemovalResult {
    success: boolean;
    message: string;
}

export interface ResolutionResult {
    status: 'DUPLICATE' | 'INVALID' | 'RESOLVED' | 'REMOVE_PARENTS';
    message: string;
    resolvent?: Clause;
    newPool?: Clause[];
    sweptClauseIds?: string[];
    newResolvedPairs?: Set<string>;
    lockedLiteral?: string | null;
}

export function evaluateRemoval(clauseId: string, currentPool: Clause[]): RemovalResult {
    const targetClause = currentPool.find(c => c.id === clauseId);
    if (!targetClause) return { success: false, message: "Clause not found." };

    if (checkTautology(targetClause)) {
        return { success: true, message: "You removed a Tautology." };
    }
    if (checkSubsumption(targetClause, currentPool)) {
        return { success: true, message: "You removed a subsumed clause." };
    }
    const pureLit = getPureLiteral(targetClause, currentPool);
    if (pureLit) {
        return { success: true, message: `Clause removed because "${pureLit.name}" is a pure literal.` };
    }

    return {
        success: false,
        message: "This clause is not a tautology, is not subsumed, and has no pure literals."
    };
}

export function evaluateResolution(
    id1: string,
    id2: string,
    currentPool: Clause[],
    resolvedPairs: Set<string>,
activeTargetLiteral: string | null
): ResolutionResult {
    const c1 = currentPool.find(c => c.id === id1);
    const c2 = currentPool.find(c => c.id === id2);

    if (!c1 || !c2) {
        return {
            status: 'INVALID',
            message: "System Error: Clause not found in memory. Please click Start Over."
        };
    }
    if (!activeTargetLiteral) return { status: 'INVALID', message: "No target literal selected." };

    const pairKey = `${id1}-${id2}`;
    if (resolvedPairs.has(pairKey) || resolvedPairs.has(`${id2}-${id1}`)) {
        return { status: 'DUPLICATE', message: "You have already resolved this exact pair." };
    }

    const l1 = c1.literals.find(l => l.name === activeTargetLiteral);
    const l2 = c2.literals.find(l => l.name === activeTargetLiteral);

    if (!l1 || !l2 || l1.polarity === l2.polarity) {
        return { status: 'INVALID', message: `Invalid move! These clauses do not resolve on "${activeTargetLiteral}".` };
    }

    const targetLiteral = l1;
    const newId = `sandbox-res-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const resolvent = resolve(targetLiteral, c1, c2, newId);

    const newResolvedPairs = new Set(resolvedPairs).add(pairKey).add(`${id2}-${id1}`);
    const tempPool = [...currentPool, resolvent];

    if (resolvent.literals.length === 0) {
        return {
            status: 'RESOLVED',
            message: 'Proof Complete! Empty clause found (Contradiction).',
            resolvent,
            newPool: tempPool,
            newResolvedPairs
        };
    }

    const stillHasPairs = checkUnresolvedPairsForLiteral(activeTargetLiteral!, tempPool, newResolvedPairs);

    if (stillHasPairs) {
        return {
            status: 'RESOLVED',
            message: `Resolved on "${activeTargetLiteral}". Continue matching pairs.`,
            resolvent,
            newPool: tempPool,
            newResolvedPairs
        };
    } else {
        const clausesToSweep = tempPool.filter(c => !c.removed && c.literals.some(l => l.name === activeTargetLiteral));
        return {
            status: 'SWEEP',
            message: `All resolutions for "${activeTargetLiteral}" are done. Now you must manually remove all clauses containing "${activeTargetLiteral}".`,
            resolvent,
            newPool: tempPool,
            sweptClauseIds: clausesToSweep.map(c => c.id),
            newResolvedPairs
        };
    }
}

export function checkPendingReductions(currentPool: Clause[]): boolean {
    const logicalPool = currentPool.filter(c => !c.removed);
    return logicalPool.some(clause =>
        checkTautology(clause) ||
        checkSubsumption(clause, logicalPool) ||
        getPureLiteral(clause, logicalPool) !== null
    );
}

export function checkUnresolvedPairsForLiteral(
    literalName: string,
    currentPool: Clause[],
    resolvedPairs: Set<string>
): boolean {
    const logicalPool = currentPool.filter(c => !c.removed);
    const posClauses = logicalPool.filter(c => c.literals.some(l => l.name === literalName && l.polarity === true));
    const negClauses = logicalPool.filter(c => c.literals.some(l => l.name === literalName && l.polarity === false));

    return posClauses.some(p =>
        negClauses.some(n => !resolvedPairs.has(`${p.id}-${n.id}`))
    );
}