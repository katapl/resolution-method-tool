import type { Clause, ProofMessage } from "./types";
import type { SandboxPhase } from "../hook/useSandboxEngine";
import {
    checkPendingReductions,
    checkUnresolvedPairsForLiteral,
    evaluateResolution,
} from "./sandboxRules";


export interface SandboxState {
    activePool: Clause[];
    resolvedPairs: Set<string>;
    targetLiteral: string | null;
    lastExhaustedLiteral: string | null;
}

export function getCurrentPhase(state: SandboxState): {
    phase: SandboxPhase;
    feedback: { type: 'success' | 'error' | 'info'; msg: ProofMessage };
} {
    const { activePool, targetLiteral, resolvedPairs, lastExhaustedLiteral } = state;

    const logicalPool = activePool.filter(c => !c.removed);
    const hasReductions = checkPendingReductions(activePool);
    const stillHasPairs = targetLiteral
        ? checkUnresolvedPairsForLiteral(targetLiteral, activePool, resolvedPairs)
        : false;

    const needsManualSweep =
        targetLiteral &&
        !stillHasPairs &&
        logicalPool.some(c => c.literals.some(l => l.name === targetLiteral));

    const hasEmptyClause = logicalPool.some(c => c.literals.length === 0);
    const isPoolEmpty = logicalPool.length === 0;

    if (hasEmptyClause) {
        return {
            phase: 'DONE',
            feedback: { type: 'success', msg: { key: 'sandbox.proofContradiction' } }
        };
    }

    if (isPoolEmpty) {
        return {
            phase: 'DONE',
            feedback: { type: 'success', msg: { key: 'sandbox.proofSatisfiable' } }
        };
    }

    if (targetLiteral && stillHasPairs) {
        return {
            phase: 'RESOLUTION',
            feedback: {
                type: 'info',
                msg: {key: 'sandbox.phaseResolving', params: {literal: targetLiteral}}
            }
        };
    }

    if (needsManualSweep) {
        return {
            phase: 'MANUAL_SWEEP',
            feedback: {
                type: 'info',
                msg: { key: 'sandbox.phaseSweep', params: { literal: targetLiteral } }
            }
        };
    }

    if (hasReductions) {
        return {
            phase: 'REDUCTION',
            feedback: {
                type: 'info',
                msg: lastExhaustedLiteral
                    ? { key: 'sandbox.phaseReductionAfter', params: { literal: lastExhaustedLiteral } }
                    : { key: 'sandbox.phaseReductionBasic' }
            }
        };
    }

    if (!targetLiteral) {
        return {
            phase: 'LITERAL_SELECTION',
            feedback: { type: 'info', msg: { key: 'sandbox.phaseSelectLiteral' } }
        };
    }

    return {
        phase: 'LITERAL_SELECTION',
        msg: { key: 'sandbox.phaseFinishedLiteral', params: { literal: targetLiteral } }
    };
}

export function resolveStep(state: SandboxState, id1: string, id2: string) {
    const result = evaluateResolution(
        id1,
        id2,
        state.activePool,
        state.resolvedPairs,
        state.targetLiteral
    );

    if (!result.newPool) {
        return { error: result.message };
    }

    return {
        newState: {
            ...state,
            activePool: result.newPool,
            resolvedPairs: result.newResolvedPairs!,
        },
        resolvent: result.resolvent,
        message: result.message,
        status: result.status
    };
}

export function removeClauseStep(state: SandboxState, clauseId: string) {
    const newPool = state.activePool.filter(c => c.id !== clauseId);

    let newTarget = state.targetLiteral;

    if (
        state.targetLiteral &&
        !newPool.some(c => c.literals.some(l => l.name === state.targetLiteral))
    ) {
        newTarget = null;
    }

    return {
        newState: {
            ...state,
            activePool: newPool,
            targetLiteral: newTarget
        }
    };
}


export function selectLiteral(state: SandboxState, literal: string) {
    return {
        state: {
            ...state,
            targetLiteral: literal,
            lastExhaustedLiteral: null
        }
    };
}