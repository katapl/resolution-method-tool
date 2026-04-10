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

    const selectedIdsRef = useRef<string[]>([]);
    useEffect(() => {
        selectedIdsRef.current = selectedIds;
    }, [selectedIds]);

    useEffect(() => {
        setNodes(currentNodes => {
            const nextNodes: Node[] = [];

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
                            onSelect: poolClause.removed ? undefined : () => handleNodeSelect(poolClause.id)                        }
                    });
                }
            });

            const newClauses = activePool.filter(c => !currentNodes.some(n => n.id === c.id));

            newClauses.forEach((clause, index) => {
                const layoutIndex = nextNodes.length + index;
                nextNodes.push({
                    id: clause.id,
                    type: 'clause',
                    position: {
                        x: (layoutIndex % 5) * 200 + 50,
                        y: Math.floor(layoutIndex / 5) * 150 + 50
                    },
                    data: {
                        clause: clause,
                        currentPhase,
                        targetLiteral,
                        isSelected: selectedIds.includes(clause.id),
                        isReducible: reducibleClauseIds.includes(clause.id),
                        isHighlighted: false,
                        onRemove: handleRemoveRequest,
                        onSelect: clause.removed ? undefined : () => handleNodeSelect(clause.id)                    }
                });
            });

            return nextNodes;
        });
    }, [
        activePool,
        currentPhase,
        targetLiteral,
        selectedIds,
        reducibleClauseIds,
        handleRemoveRequest,
        setNodes
    ]);

    const handleNodeSelect = useCallback((clickedId: string) => {
        if (currentPhase !== 'RESOLUTION') return;

        const currentSelection = selectedIdsRef.current;

        if (selectedIds.includes(clickedId)) {
            setSelectedIds(selectedIds.filter(id => id !== clickedId));
            return;
        }

        const newSelection = [...currentSelection, clickedId];

        if (newSelection.length === 2) {
            const [id1, id2] = newSelection;
            const resolvent = handleResolution(id1, id2);

            if (resolvent) {
                setEdges(eds => [
                    ...eds,
                    { id: `e-${id1}-${resolvent.id}`, source: id1, target: resolvent.id, style: { stroke: '#9e9e9e', strokeWidth: 2 } },
                    { id: `e-${id2}-${resolvent.id}`, source: id2, target: resolvent.id, style: { stroke: '#9e9e9e', strokeWidth: 2 } }
                ]);
            }
            setSelectedIds([]);
        } else {
            setSelectedIds(newSelection);
        }
    }, [currentPhase, handleResolution, setEdges]);

    return (
        <div style={{ height: '70vh', width: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '1rem', background: 'white', borderBottom: '1px solid #ddd', textAlign: 'center', transition: 'background 0.3s ease' }}>
                <strong style={{ color: 'grey', fontSize: '1.1rem' }}>
                    {t(feedback.msg.key, feedback.msg.params)}
                </strong>
            </div>

            {currentPhase === 'LITERAL_SELECTION' && (
                <div style={{ padding: '1rem', background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>Select Literal to Resolve:</span>
                    {availableVariables.map(v => (
                        <Button
                            key={v}
                            onClick={() => handleLiteralSelect(v)}
                            style={{
                                padding: '0.5rem 1.5rem',
                                background: '#2196F3', color:
                                    'white', border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold'
                        }}
                        >
                            {v}
                        </Button>
                    ))}
                </div>
            )}

            <div style={{ flexGrow: 1, background: '#ffffff' }}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    elementsSelectable={false}
                    fitView
                >
                    <Background gap={16} size={1} />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}