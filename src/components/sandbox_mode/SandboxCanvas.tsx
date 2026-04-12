import { useState, useCallback, useEffect, useRef } from 'react';
import Button from '../Button';
import ReactFlow, {
    Background, Controls, type Node, type Edge, type NodeChange, type EdgeChange, useNodesState, useEdgesState,
    applyNodeChanges, applyEdgeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useLocalStorage } from '../../hook/useLocalStorage';
import { useSandboxEngine } from '../../hook/useSandboxEngine';
import { type Clause, clauseToString } from "../../engine/types";
import ClauseNode from './ClauseNode';
import { useTranslation } from 'react-i18next';
import { generateSandboxLayout } from '../../utils/layout';

const nodeTypes = { clause: ClauseNode };

interface SandboxCanvasProps {
    initialClauses: Clause[];
}

export default function SandboxCanvas({ initialClauses }: SandboxCanvasProps) {
    const { t } = useTranslation();
    const {
        activePool, feedback, currentPhase, targetLiteral, availableVariables, reducibleClauseIds,
        handleRemoveRequest, handleResolution, handleLiteralSelect
    } = useSandboxEngine(initialClauses);

    const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [cameraBounds, setCameraBounds] = useState<[[number, number], [number, number]]>()

    const selectedIdsRef = useRef<string[]>([]);
    useEffect(() => {
        selectedIdsRef.current = selectedIds;
    }, [selectedIds]);

    const newPositionsRef = useRef<Record<string, { x: number, y: number }>>({});

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
                    return nds;
                });

                setEdges(eds => [
                    ...eds,
                    { id: `e-${id1}-${resolvent.id}`, source: id1, target: resolvent.id, animated: false, style: { stroke: '#999', strokeWidth: 2 } },
                    { id: `e-${id2}-${resolvent.id}`, source: id2, target: resolvent.id, animated: false, style: { stroke: '#999', strokeWidth: 2 } }
                ]);
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
                            onSelect: poolClause.removed ? undefined : () => handleNodeSelect(poolClause.id)
                        }
                    };
                });
            }

            currentNodes.forEach(node => {
                const poolClause = activePool.find(c => c.id === node.id);
                if (poolClause) {
                    nextNodes.push({
                        ...node,
                        data: {
                            ...node.data,
                            clause: poolClause,
                            currentPhase,
                            targetLiteral,
                            isSelected: selectedIds.includes(node.id),
                            isReducible: reducibleClauseIds.includes(poolClause.id),
                            onRemove: handleRemoveRequest,
                            onSelect: poolClause.removed ? undefined : () => handleNodeSelect(poolClause.id)
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
                    data: {
                        clause: clause,
                        currentPhase,
                        targetLiteral,
                        isSelected: selectedIds.includes(clause.id),
                        isReducible: reducibleClauseIds.includes(clause.id),
                        isHighlighted: true,
                        onRemove: handleRemoveRequest,
                        onSelect: clause.removed ? undefined : () => handleNodeSelect(clause.id)
                    }
                });
            });

            return nextNodes;
        });
        if (newCameraBounds) {
            setCameraBounds(newCameraBounds);
        }

    }, [activePool, currentPhase, targetLiteral, selectedIds, reducibleClauseIds, handleRemoveRequest, handleNodeSelect, setNodes]);

    return (
        <div style={{
            height: '80vh',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            borderRadius: '12px',
            border: '1px solid #ccc'
        }}>
            <div style={{
                padding: '1rem',
                background: 'white',
                borderBottom: '1px solid #ddd',

                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',

                minHeight: '4.5rem',
                transition: 'background 0.3s ease'
            }}>

                <strong style={{ color: 'grey', fontSize: '1.1rem', margin: 0 }}>
                    {t(feedback.msg.key, feedback.msg.params)}
                </strong>

                {currentPhase === 'LITERAL_SELECTION' && (
                    <div style={{
                        display: 'flex',
                        gap: '0.75rem',
                        alignItems: 'center'
                    }}>
                        {availableVariables.map(v => (
                            <Button
                                key={v}
                                onClick={() => handleLiteralSelect(v)}
                                style={{
                                    padding: '0.4rem 1.2rem',
                                    background: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    height: 'auto'
                                }}
                            >
                                {v}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ flexGrow: 1, background: '#ffffff' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    elementsSelectable={true}
                    fitView
                    translateExtent={cameraBounds}
                >
                    <Background gap={16} size={1} />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}