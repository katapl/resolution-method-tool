import { useState, useEffect, useRef, useCallback } from 'react';
import { useNodesState, useEdgesState, type ReactFlowInstance, type Edge, type Node } from 'reactflow';
import { generateSandboxLayout } from '../utils/layout';

export function useSandboxGraph(
    activePool: any[], currentPhase: string, targetLiteral: string | null,
    reducibleClauseIds: string[], handleRemoveRequest: any, handleResolution: any,
    initialNodes: any, initialEdges: any, initialSelected: any
) {

    const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>(initialNodes || []);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>(initialEdges || []);
    const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);

    const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
    const [cameraBounds, setCameraBounds] = useState<[[number, number], [number, number]]>()
    const selectedIdsRef = useRef<string[]>([]);
    const newPositionsRef = useRef<Record<string, { x: number, y: number }>>({});
    const prevNodeCount = useRef(nodes.length);

    useEffect(() => {
        selectedIdsRef.current = selectedIds;
    }, [selectedIds]);

    const handleNodeSelect = useCallback((clickedId: string) => {
        if (currentPhase !== 'RESOLUTION') return;

        const currentSelection = selectedIdsRef.current;

        if (currentSelection.includes(clickedId)) {
            setSelectedIds(prev => prev.filter(id => id !== clickedId));
            return;
        }

        const newSelection = [...currentSelection, clickedId];

        if (newSelection.length === 2) {
            const [id1, id2] = newSelection;
            const resolvent = handleResolution(id1, id2);

            if (resolvent) {
                setNodes(nds => {
                    const p1 = nds.find(n => n.id === id1);
                    const p2 = nds.find(n => n.id === id2);

                    if (p1 && p2) {
                        const newX = (p1.position.x + p2.position.x) / 2;
                        const newY = Math.max(p1.position.y, p2.position.y) + 150;
                        newPositionsRef.current[resolvent.id] = { x: newX, y: newY };
                    }
                    // return nds;
                    return nds.map(n => ({ ...n, selected: newSelection.includes(n.id) }));
                });

                setEdges(eds => [
                    ...eds,
                    { id: `e-${id1}-${resolvent.id}`, source: id1, target: resolvent.id, animated: false, style: { stroke: '#999', strokeWidth: 2 } },
                    { id: `e-${id2}-${resolvent.id}`, source: id2, target: resolvent.id, animated: false, style: { stroke: '#999', strokeWidth: 2 } }

                ]);
                if (resolvent.literals.length === 0) {
                    setSelectedIds([id1, id2]);
                } else {
                    setSelectedIds([]);
                }
            }
            setSelectedIds([]);
        } else {
            setSelectedIds(newSelection);
        }
    }, [currentPhase, handleResolution, setEdges, setNodes]);

    useEffect(() => {
        let newCameraBounds: [[number, number], [number, number]] | undefined = undefined;
        setNodes(currentNodes => {
            const nextNodes: Node[] = [];

            if (currentNodes.length === 0 && activePool.length > 0) {
                const { nodes: layoutNodes, translateExtent } = generateSandboxLayout(activePool, currentPhase, targetLiteral, []);

                newCameraBounds = translateExtent;

                return layoutNodes.map(n => {
                    const poolClause = activePool.find(c => c.id === n.id)!;
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            clause: poolClause,
                            currentPhase,
                            targetLiteral,
                            isSelected: selectedIds.includes(n.id),
                            isReducible: reducibleClauseIds.includes(n.id),
                            onRemove: handleRemoveRequest,
                        }
                    };
                });
            }

            currentNodes.forEach(node => {
                const poolClause = activePool.find(c => c.id === node.id);
                if (poolClause) {
                    nextNodes.push({
                        ...node,
                        selected: selectedIds.includes(node.id),
                        data: {
                            ...node.data,
                            clause: poolClause,
                            currentPhase,
                            targetLiteral,
                            isSelected: selectedIds.includes(node.id),
                            isReducible: reducibleClauseIds.includes(poolClause.id),
                            onRemove: handleRemoveRequest,
                        }
                    });
                }
            });

            const newClauses = activePool.filter(c => !currentNodes.some(n => n.id === c.id));

            newClauses.forEach((clause, index) => {
                let pos = newPositionsRef.current[clause.id];

                if (!pos) {
                    pos = { x: index * 200 + 50, y: 50 };
                }

                nextNodes.push({
                    id: clause.id,
                    type: 'clause',
                    position: pos,
                    selected: selectedIds.includes(clause.id),
                    data: {
                        clause: clause,
                        currentPhase,
                        targetLiteral,
                        isSelected: selectedIds.includes(clause.id),
                        isReducible: reducibleClauseIds.includes(clause.id),
                        isHighlighted: true,
                        onRemove: handleRemoveRequest,
                    }
                });
            });

            return nextNodes;
        });
        if (newCameraBounds) {
            setCameraBounds(newCameraBounds);
        }

    }, [activePool, currentPhase, targetLiteral, selectedIds, reducibleClauseIds, handleRemoveRequest, /*handleNodeSelect*/, setNodes]);

    useEffect(() => {
        if (rfInstance && nodes.length > prevNodeCount.current) {
            const timer = setTimeout(() => {
                rfInstance.fitView({
                    padding: 0.6,
                    duration: 800
                });
            }, 50);

            prevNodeCount.current = nodes.length;
            return () => clearTimeout(timer);
        }

        prevNodeCount.current = nodes.length;
    }, [nodes.length, rfInstance]);

    useEffect(() => {
        if (nodes.length > 0) {
            const padding = 600;

            const minX = Math.min(...nodes.map(n => n.position.x));
            const minY = Math.min(...nodes.map(n => n.position.y));
            const maxX = Math.max(...nodes.map(n => n.position.x));
            const maxY = Math.max(...nodes.map(n => n.position.y));

            setCameraBounds([
                [minX - padding, minY - padding],
                [maxX + padding, maxY + padding]
            ]);
        }
    }, [nodes]);

    return {
        nodes, edges, onNodesChange, onEdgesChange,
        selectedIds, cameraBounds, handleNodeSelect, setRfInstance
    };
}