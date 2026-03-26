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
    resolvedPairs: Set<string>
): ResolutionResult {
    const c1 = currentPool.find(c => c.id === id1);
    const c2 = currentPool.find(c => c.id === id2);

    if (!c1 || !c2) {
        return {
            status: 'INVALID',
            message: "System Error: Clause not found in memory. Please click Start Over."
        };
    }

    const pairKey = `${id1}-${id2}`;
    if (resolvedPairs.has(pairKey) || resolvedPairs.has(`${id2}-${id1}`)) {
        return { status: 'DUPLICATE', message: "You have already resolved this exact pair." };
    }

    const targetLiteral = getComplementaryLiteral(c1, c2);
    if (!targetLiteral) {
        return { status: 'INVALID', message: "Invalid move! No complementary literal found." };
    }

    const newId = `sandbox-res-${Date.now()}`;
    const resolvent = resolve(targetLiteral, c1, c2, newId);

    const newResolvedPairs = new Set(resolvedPairs).add(pairKey).add(`${id2}-${id1}`);
    const tempPool = [...currentPool, resolvent];

    const posClauses = tempPool.filter(c => c.literals.some(l => l.name === targetLiteral.name && l.polarity === true));
    const negClauses = tempPool.filter(c => c.literals.some(l => l.name === targetLiteral.name && l.polarity === false));

    const hasUnresolvedPairs = posClauses.some(p =>
        negClauses.some(n => !newResolvedPairs.has(`${p.id}-${n.id}`))
    );

    if (hasUnresolvedPairs) {
        return {
            status: 'RESOLVED',
            message: `Resolved on "${targetLiteral.name}". Parents kept. You must finish resolving all "${targetLiteral.name}" pairs.`,
            resolvent,
            newPool: tempPool,
            newResolvedPairs,
            lockedLiteral: targetLiteral.name
        };
    } else {
        const clausesToRemove = tempPool.filter(c => c.literals.some(l => l.name === targetLiteral.name));
        const finalPool = tempPool.filter(c => !c.literals.some(l => l.name === targetLiteral.name));

        return {
            status: 'REMOVE_PARENTS',
            message: `All resolvents using "${targetLiteral.name}" are done. Parent clauses removed.`,
            resolvent,
            newPool: finalPool,
            sweptClauseIds: clausesToRemove.map(c => c.id),
            newResolvedPairs,
            lockedLiteral: null
        };
    }
}