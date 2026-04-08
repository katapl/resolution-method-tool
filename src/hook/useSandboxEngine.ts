import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './useLocalStorage';
import type { Clause } from '../engine/types';
import { evaluateResolution } from '../engine/sandboxRules';
import { getCurrentPhase } from '../engine/sandboxEngine';

export type SandboxPhase =
    | 'REDUCTION'
    | 'LITERAL_SELECTION'
    | 'RESOLUTION'
    | 'MANUAL_SWEEP'
    | 'DONE';

interface SandboxState {
    activePool: Clause[];
    resolvedPairs: string[];
    targetLiteral: string | null;
    lastExhaustedLiteral: string | null;
}

export function useSandboxEngine(initialClauses: Clause[]) {
    const [engineState, setEngineState] = useLocalStorage<SandboxState>(
        'sandbox_engine',
        {
            activePool: initialClauses,
            resolvedPairs: [],
            targetLiteral: null,
            lastExhaustedLiteral: null
        }
    );

    const [feedbackOverride, setFeedbackOverride] = useState<{
        type: 'success' | 'error' | 'info';
        msg: string;
    } | null>(null);

    const { activePool, targetLiteral, lastExhaustedLiteral } = engineState;
    const resolvedPairs = useMemo(
        () => new Set(engineState.resolvedPairs),
        [engineState.resolvedPairs]
    );

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
                    msg: 'You must remove clauses containing the selected literal.'
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
            resolvedPairs: Array.from(result.newResolvedPairs!)
        }));

        setFeedbackOverride({
            type: result.status === 'SWEEP' ? 'success' : 'info',
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

    return {
        activePool,
        feedback,
        currentPhase,
        targetLiteral,
        availableVariables,
        handleRemoveRequest,
        handleResolution,
        handleLiteralSelect
    };
}