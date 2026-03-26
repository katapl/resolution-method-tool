import { useState, useCallback } from 'react';
import type { Node, Edge } from 'reactflow';
import { useLocalStorage } from './useLocalStorage';
import { type Clause, clauseToString } from '../engine/types';
import { evaluateRemoval, evaluateResolution } from '../engine/sandboxRules';

export interface SandboxEngine {
    nodes: Node[];
    edges: Edge[];
    feedback: { type: 'success' | 'error' | 'info', msg: string };
    setNodes: (updater: Node[] | ((nds: Node[]) => Node[])) => void;
    setEdges: (updater: Edge[] | ((eds: Edge[]) => Edge[])) => void;
    handleRemoveRequest: (clauseId: string) => void;
    handleNodeClick: (nodeId: string, currentSelectedIds: string[]) => {
        newSelection: string[],
        shouldClearSelection: boolean
    };
}

export function useSandboxEngine(initialClauses: Clause[]): SandboxEngine {
    const [activePool, setActivePool] = useLocalStorage('sandbox_pool_active', initialClauses);
    const [resolvedPairsArray, setResolvedPairsArray] = useLocalStorage<string[]>('sandbox_pairs_active', []);
    const resolvedPairs = new Set(resolvedPairsArray);

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
    const [lockedLiteral, setLockedLiteral] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', msg: string }>({
        type: 'info', msg: 'Select two clauses to resolve, or click x to remove a redundant clause.'
    });

    const handleRemoveRequest = useCallback((clauseId: string) => {
        const result = evaluateRemoval(clauseId, activePool);

        if (result.success) {
            setFeedback({ type: 'success', msg: result.message });
            setActivePool(prev => prev.filter(c => c.id !== clauseId));
            setNodes(nds => nds.map(n => n.id === clauseId ? {
                ...n,
                data: {
                    ...n.data,
                    isRemoved: true,
                    isHighlighted: false,
                    isDisabled: true
                }
            } : n));
        } else {
            setFeedback({ type: 'error', msg: result.message });
        }
    }, [activePool, setNodes, setActivePool]);

    const handleNodeClick = useCallback(
        (nodeId: string, currentSelectedIds: string[]) => {
        let newSelection = [...currentSelectedIds];

        if (newSelection.includes(nodeId)) {
            newSelection = newSelection.filter(id => id !== nodeId);
            return { newSelection, shouldClearSelection: false };
        }
        newSelection.push(nodeId);

        if (newSelection.length === 2) {
            const [id1, id2] = newSelection;

            const result = evaluateResolution(id1, id2, activePool, resolvedPairs);

            if (result.status === 'DUPLICATE' || result.status === 'INVALID') {
                setFeedback({ type: 'error', msg: result.message });
                return { newSelection: [], shouldClearSelection: true };
            }

            setFeedback({ type: result.status === 'SWEEP' ? 'success' : 'info', msg: result.message });
            setResolvedPairsArray(Array.from(result.newResolvedPairs!));
            setActivePool(result.newPool!);
            setLockedLiteral(result.lockedLiteral!);

            setNodes(nds => {
                let updatedNodes = nds.map(n => (
                    {...n, data: { ...n.data, isHighlighted: false } }));

                if (result.status === 'SWEEP') {
                    updatedNodes = updatedNodes.map(n =>
                        result.sweptClauseIds!.includes(n.id)
                            ? { ...n, data: { ...n.data, isRemoved: true, isHighlighted: false, isDisabled: true } }
                            : n
                    );
                }

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
    }, [activePool, resolvedPairs, handleRemoveRequest, setNodes, setEdges, setResolvedPairsArray, setActivePool]);

    return { nodes, edges, feedback, setNodes, setEdges, handleRemoveRequest, handleNodeClick };
}