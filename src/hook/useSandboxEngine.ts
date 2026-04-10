import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Clause, ProofMessage } from '../engine/types';
import { evaluateResolution } from '../engine/sandboxRules';
import { getCurrentPhase } from '../engine/sandboxEngine';
import { checkTautology, checkSubsumption, getPureLiteral } from '../engine/reduction';

export type SandboxPhase =
    | 'REDUCTION'
    | 'LITERAL_SELECTION'
    | 'RESOLUTION'
    | 'MANUAL_SWEEP'
    | 'DONE';

interface SandboxState {
    activePool: Clause[];
    resolvedPairs: Set<string>;
    targetLiteral: string | null;
    lastExhaustedLiteral: string | null;
}

export function useSandboxEngine(initialClauses: Clause[]) {
    const [engineState, setEngineState] = useState<SandboxState>({
        activePool: initialClauses,
        resolvedPairs: new Set(),
        targetLiteral: null,
        lastExhaustedLiteral: null
    });

    const [feedbackOverride, setFeedbackOverride] = useState<{
        type: 'success' | 'error' | 'info';
        msg: ProofMessage;
    } | null>(null);

    const { activePool, targetLiteral, lastExhaustedLiteral, resolvedPairs } = engineState;

    const { phase: currentPhase, feedback: dynamicFeedback } = useMemo(
        () =>
            getCurrentPhase({
                activePool,
                resolvedPairs,
                targetLiteral,
                lastExhaustedLiteral
            }),
        [activePool, resolvedPairs, targetLiteral, lastExhaustedLiteral]
    );

    const feedback = currentPhase === 'DONE' ? dynamicFeedback : (feedbackOverride ?? dynamicFeedback);

    const handleRemoveRequest = useCallback((clauseId: string) => {
        if (currentPhase !== 'REDUCTION' && currentPhase !== 'MANUAL_SWEEP') return;

        const targetClause = activePool.find(c => c.id === clauseId);
        if (!targetClause) return;

        if (currentPhase === 'MANUAL_SWEEP') {
            const hasTarget = targetClause.literals.some(l => l.name === targetLiteral);
            if (!hasTarget) {
                setFeedbackOverride({
                    type: 'error',
                    msg: { key: 'sandbox.errMustRemoveTarget' }
                });
                return;
            }
        }

        setEngineState(prev => {
            const newPool = prev.activePool.map(c =>
                c.id === clauseId ? { ...c, removed: true } : c
            );

            let newTarget = prev.targetLiteral;
            if (prev.targetLiteral && !newPool.some(c => !c.removed && c.literals.some(l => l.name === prev.targetLiteral))) {
                newTarget = null;
            }

            return { ...prev, activePool: newPool, targetLiteral: newTarget };
        });
        setFeedbackOverride(null);
    }, [activePool, currentPhase, targetLiteral, setEngineState]);

    const handleResolution = useCallback((id1: string, id2: string) => {
        if (currentPhase !== 'RESOLUTION') return null;

        const result = evaluateResolution(id1, id2, activePool, resolvedPairs, targetLiteral);

        if (result.status === 'DUPLICATE' || result.status === 'INVALID') {
            setFeedbackOverride({ type: 'error', msg: result.message });
            return null;
        }

        setEngineState(prev => ({
            ...prev,
            activePool: result.newPool!,
            resolvedPairs: result.newResolvedPairs!
        }));

        setFeedbackOverride({
            type: result.status === 'REMOVE_PARENTS' ? 'success' : 'info',
            msg: result.message
        });

        return result.resolvent;
    }, [currentPhase, activePool, resolvedPairs, targetLiteral, setEngineState]);

    const handleLiteralSelect = useCallback((literalName: string) => {
        if (currentPhase === 'LITERAL_SELECTION' || (currentPhase === 'RESOLUTION' && targetLiteral === null)) {
            setEngineState(prev => ({
                ...prev,
                targetLiteral: literalName,
                lastExhaustedLiteral: null
            }));
            setFeedbackOverride(null);
        }
    }, [currentPhase, targetLiteral, setEngineState]);

    const availableVariables = useMemo(() => {
        return Array.from(
            new Set(activePool.filter(c => !c.removed).flatMap(c => c.literals.map(l => l.name)))
        ).sort();
    }, [activePool]);

    const reducibleClauseIds = useMemo(() => {
        if (currentPhase !== 'REDUCTION') return [];

        const logicalPool = activePool.filter(c => !c.removed);
        return logicalPool.filter(clause =>
            checkTautology(clause) ||
            checkSubsumption(clause, logicalPool) ||
            getPureLiteral(clause, logicalPool) !== null
        ).map(c => c.id);
    }, [currentPhase, activePool]);

    return {
        activePool,
        feedback,
        currentPhase,
        targetLiteral,
        reducibleClauseIds,
        availableVariables,
        handleRemoveRequest,
        handleResolution,
        handleLiteralSelect
    };
}