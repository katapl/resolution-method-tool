import { useState, useCallback, useMemo } from 'react';
import type { Node, Edge } from 'reactflow';
import { useLocalStorage } from './useLocalStorage';
import { type Clause, clauseToString } from '../engine/types';
import { evaluateRemoval, evaluateResolution, checkPendingReductions, checkUnresolvedPairsForLiteral } from '../engine/sandboxRules';

export type SandboxPhase = 'REDUCTION' | 'LITERAL_SELECTION' | 'RESOLUTION' | 'MANUAL_SWEEP' | 'DONE';

export function useSandboxEngine(initialClauses: Clause[]) {
    const [activePool, setActivePool] = useLocalStorage('sandbox_pool_active', initialClauses);
    const [resolvedPairsArray, setResolvedPairsArray] = useLocalStorage<string[]>('sandbox_pairs_active', []);
    const resolvedPairs = useMemo(() => new Set(resolvedPairsArray), [resolvedPairsArray]);

    const [nodes, setNodes] = useLocalStorage<Node[]>(
        'sandbox_nodes_active',
        initialClauses.map((clause, index) => ({
            id: clause.id,
            type: 'clause',
            position: { x: index * 200 + 50, y: 50 },
            data: {
                label:
                    clauseToString(clause),
                isHighlighted: false,
                isRemoved: false,
                isDisabled: false,
                isInteractive: true,
                onRemove: () => {} }
        }))
    );

    const [edges, setEdges] = useLocalStorage<Edge[]>('sandbox_edges_active', []);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', msg: string }>({
        type: 'info', msg: 'Select two clauses to resolve, or click x to remove a redundant clause.'
    });

    const [targetLiteral, setTargetLiteral] = useLocalStorage<string | null>('sandbox_target_literal_active', null);
    const [lastExhaustedLiteral, setLastExhaustedLiteral] = useState<string | null>(null);

    const hasReductions = checkPendingReductions(activePool);
    const stillHasPairs = targetLiteral ? checkUnresolvedPairsForLiteral(targetLiteral, activePool, resolvedPairs) : false;

    const needsManualSweep = targetLiteral && !stillHasPairs && activePool.some(c => c.literals.some(l => l.name === targetLiteral));

    const hasEmptyClause = activePool.some(c => c.literals.length === 0);
    const isPoolEmpty = activePool.length === 0;

    let currentPhase: SandboxPhase;
    let dynamicFeedback = { type: 'info' as const, msg: '' };

    if (hasEmptyClause) {
        currentPhase = 'DONE';
        dynamicFeedback = { type: 'success', msg: 'Proof Complete! Empty clause found (Contradiction).' };
    } else if (isPoolEmpty) {
        currentPhase = 'DONE';
        dynamicFeedback = { type: 'success', msg: 'Proof Complete! Empty set reached (Satisfiable).' };
    } else if (targetLiteral && stillHasPairs) {
        currentPhase = 'RESOLUTION';
        dynamicFeedback = { type: 'info', msg: `Resolving on "${targetLiteral}". Match remaining clauses.` };
    } else if (needsManualSweep) {
        currentPhase = 'MANUAL_SWEEP';
        dynamicFeedback = { type: 'info', msg: `All pairs for "${targetLiteral}" resolved. Now manually remove all clauses containing "${targetLiteral}".` };
    } else if (hasReductions) {
        currentPhase = 'REDUCTION';
        dynamicFeedback = {
            type: 'info',
            msg: lastExhaustedLiteral
                ? `All done resolving on "${lastExhaustedLiteral}". Now perform set reduction.`
                : 'Perform set reduction. Remove tautologies, subsumed clauses, or pure literals.'
        };
    } else if (!targetLiteral) {
        currentPhase = 'LITERAL_SELECTION';
        dynamicFeedback = { type: 'info', msg: 'Ready. Select a literal to resolve on.' };
    } else {
        currentPhase = 'LITERAL_SELECTION';
        dynamicFeedback = { type: 'success', msg: `Finished with "${targetLiteral}". Select next literal.` };
    }

    const handleRemoveRequest = useCallback((clauseId: string) => {
        if (currentPhase !== 'REDUCTION' && currentPhase !== 'MANUAL_SWEEP') {
            return;
        }

        const targetClause = activePool.find(c => c.id === clauseId);
        if (!targetClause) return;

        if (currentPhase === 'MANUAL_SWEEP') {
            const hasTarget = targetClause.literals.some(l => l.name === targetLiteral);
            if (!hasTarget) {
                setFeedback({ type: 'error', msg: result.message });
                return;
            }
        }

        const result = evaluateRemoval(clauseId, activePool);

        if (result.success || currentPhase === 'MANUAL_SWEEP') {
            setActivePool(prev => {
                const newPool = prev.filter(c => c.id !== clauseId);
                if (currentPhase === 'MANUAL_SWEEP' && !newPool.some(c => c.literals.some(l => l.name === targetLiteral))) {
                    setTargetLiteral(null);
                }
                return newPool;
            });
            setNodes(nds => nds.map(n => n.id === clauseId ? {
                ...n,
                data: {
                    ...n.data,
                    isRemoved: true,
                    isHighlighted: false,
                    isDisabled: true
                }
            } : n));
        }
    }, [activePool, currentPhase, targetLiteral, resolvedPairs, setNodes, setActivePool, setTargetLiteral]);

    const handleNodeClick = useCallback(
        (nodeId: string, currentSelectedIds: string[]) => {
            if (currentPhase !== 'RESOLUTION') {
                return { newSelection: [], shouldClearSelection: true };
            }

            let newSelection = [...currentSelectedIds];

            if (newSelection.includes(nodeId)) {
                newSelection = newSelection.filter(id => id !== nodeId);
                return { newSelection, shouldClearSelection: false };
            }
            newSelection.push(nodeId);

            if (newSelection.length === 2) {
                const [id1, id2] = newSelection;

                const result = evaluateResolution(id1, id2, activePool, resolvedPairs, targetLiteral);


                if (result.status === 'DUPLICATE' || result.status === 'INVALID') {
                    setFeedback({ type: 'error', msg: result.message });
                    return { newSelection: [], shouldClearSelection: true };
                }

                setFeedback({ type: result.status === 'SWEEP' ? 'success' : 'info', msg: result.message });
                setResolvedPairsArray(Array.from(result.newResolvedPairs!));
                setActivePool(result.newPool!);

                setNodes(nds => {
                    let updatedNodes = nds.map(n => (
                        {...n, data: { ...n.data, isHighlighted: false } }));

                    const p1Node = nds.find(n => n.id === id1);
                    const p2Node = nds.find(n => n.id === id2);
                    updatedNodes.push({
                        id: result.resolvent!.id, type: 'clause',
                        position: { x: (p1Node?.position.x! + p2Node?.position.x!) / 2, y: Math.max(p1Node?.position.y!, p2Node?.position.y!) + 120 },
                        data: {
                            label: clauseToString(result.resolvent!),
                            isHighlighted: true,
                            isRemoved: false,
                            isInteractive: true,
                            onRemove: () => handleRemoveRequest(result.resolvent!.id)
                        }
                    });
                    return updatedNodes;
                });

                setEdges(eds => [...eds,
                    { id: `e-${id1}-${result.resolvent!.id}`, source: id1, target: result.resolvent!.id, animated: false, style: { stroke: '#9e9e9e', strokeWidth: 2 } },
                    { id: `e-${id2}-${result.resolvent!.id}`, source: id2, target: result.resolvent!.id, animated: false, style: { stroke: '#9e9e9e', strokeWidth: 2 } }
                ]);

                return { newSelection: [], shouldClearSelection: true };
            }

            return { newSelection, shouldClearSelection: false };
        }, [currentPhase,
            activePool,
            resolvedPairs,
            handleRemoveRequest,
            setNodes,
            setEdges,
            setResolvedPairsArray,
            setActivePool,
            targetLiteral,
            setFeedback]);

    const handleLiteralSelect = useCallback((literalName: string) => {
        if (currentPhase === 'LITERAL_SELECTION' || (currentPhase === 'RESOLUTION' && targetLiteral === null)) {
            setTargetLiteral(literalName);
            setLastExhaustedLiteral(null);
        }
    }, [currentPhase, targetLiteral, setTargetLiteral, setLastExhaustedLiteral]);

    const availableVariables = useMemo(() => {
        return Array.from(new Set(
            activePool.flatMap(c => c.literals.map(l => l.name))
        )).sort();
    }, [activePool]);
    return { nodes, edges, feedback: dynamicFeedback, currentPhase, targetLiteral, setNodes, setEdges, handleRemoveRequest, handleNodeClick, handleLiteralSelect, availableVariables };
}