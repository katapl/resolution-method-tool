import { useState, useCallback, useMemo } from 'react';
import type { Clause, ProofMessage } from '../engine/types';
import { getReducibleClauseIds } from '../engine/sandboxRules';
import { getCurrentPhase, getAvailableVariables, executeResolutionStep, executeRemoveClause, executeSelectLiteral } from '../engine/sandboxEngine';

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
    hasInteracted: boolean;
}

export function useSandboxEngine(initialClauses: Clause[], savedState: SandboxState | null = null) {
    const [engineState, setEngineState] = useState<SandboxState>(
        savedState || {
            activePool: initialClauses,
            resolvedPairs: new Set(),
            targetLiteral: null,
            lastExhaustedLiteral: null,
            hasInteracted: false
        }
    );

    const [feedbackOverride, setFeedbackOverride] = useState<{
        type: 'success' | 'error' | 'info';
        msg: ProofMessage;
    } | null>(null);

    // const [hasInteracted, setHasInteracted] = useState(!!savedState);

    const hasNegatedConclusion = useMemo(() =>
            initialClauses.some(c => c.isNegatedConclusion),
        [initialClauses]);

    const isPristineEntailment = hasNegatedConclusion && !engineState.hasInteracted;

    // Získání stavu automatu a správa uživatelské interakce
    const { phase: currentPhase, feedback: dynamicFeedback } = useMemo(
        () => getCurrentPhase(engineState),
        [engineState]
    );
    // Dočasná chyba (override) má přednost před obecnou hláškou aktuální fáze
    const feedback
        = currentPhase === 'DONE' ? dynamicFeedback : (feedbackOverride ?? dynamicFeedback);

    const handleRemoveRequest = useCallback((clauseId: string) => {
        if (currentPhase !== 'REDUCTION' && currentPhase !== 'MANUAL_SWEEP') return;

        const { newState, error } = executeRemoveClause(engineState, clauseId, currentPhase);

        if (error) {
            setFeedbackOverride({ type: 'error', msg: error });
        } else {
            setEngineState({...newState, hasInteracted: true});
            setFeedbackOverride(null);
        }
    }, [engineState, currentPhase]);

    const handleResolution = useCallback((id1: string, id2: string) => {
        // 1. Ochrana před akcí v nesprávné fázi (Guard clause)
        if (currentPhase !== 'RESOLUTION') return null;
        // 2. Předání požadavku čisté funkci logického jádra
        const { newState, resolvent, feedback } = executeResolutionStep(engineState, id1, id2);
        // 3. Vyhodnocení výsledku: zachycení chyby vs. posun stavu
        if (feedback.type === 'error') {
            setFeedbackOverride(feedback); // Zobrazení chyby, logický stav se nemění
            return null;
        }

        setEngineState({ ...newState, hasInteracted: true });
        setFeedbackOverride(feedback); // Krok byl platný, automat přechází dál
        return resolvent;
    }, [engineState, currentPhase]);

    const handleLiteralSelect = useCallback((literalName: string) => {
        const { newState } = executeSelectLiteral(engineState, literalName, currentPhase);

        if (newState !== engineState) {
            setEngineState({ ...newState, hasInteracted: true });;
            setFeedbackOverride(null);
        }
    }, [engineState, currentPhase]);

    const availableVariables = useMemo(() => getAvailableVariables(engineState.activePool), [engineState.activePool]);

    const reducibleClauseIds = useMemo(() => {
        return currentPhase === 'REDUCTION' ? getReducibleClauseIds(engineState.activePool) : [];
    }, [currentPhase, engineState.activePool]);

    return {
        engineState,
        activePool: engineState.activePool,
        feedback,
        currentPhase,
        targetLiteral: engineState.targetLiteral,
        reducibleClauseIds,
        availableVariables,
        handleRemoveRequest,
        handleResolution,
        handleLiteralSelect,
        isPristineEntailment
    };
}