import { useState, useCallback, useEffect } from 'react';
import ReactFlow, {
    Background, Controls, type Node, type Edge, type NodeChange, type EdgeChange,
    applyNodeChanges, applyEdgeChanges
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useLocalStorage } from '../../hook/useLocalStorage';
import { useSandboxEngine } from '../../hook/useSandboxEngine';
import { type Clause, clauseToString } from "../../engine/types";
import ClauseNode from './ClauseNode';

const nodeTypes = { clause: ClauseNode };

interface SandboxCanvasProps {
    initialClauses: Clause[];
}

export default function SandboxCanvas({ initialClauses }: SandboxCanvasProps) {
    const {
        activePool, feedback, currentPhase, targetLiteral, availableVariables,
        handleRemoveRequest, handleResolution, handleLiteralSelect
    } = useSandboxEngine(initialClauses);

    const [nodes, setNodes] = useLocalStorage<Node[]>('sandbox_nodes_active', []);
    const [edges, setEdges] = useLocalStorage<Edge[]>('sandbox_edges_active', []);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        setNodes(currentNodes => {
            let updated = [...currentNodes];

            updated = updated.map(n => {
                const poolClause = activePool.find(c => c.id === n.id);
                if (!poolClause) return n;

                return {
                    ...n,
                    data: {
                        ...n.data,
                        clause: poolClause,
                        currentPhase,
                        targetLiteral,
                        onRemove: (id: string) => handleRemoveRequest(id)
                    }
                };
            });

            const newClauses = activePool.filter(c => !updated.some(n => n.id === c.id));

            newClauses.forEach((c) => {
                updated.push({
                    id: c.id,
                    type: 'clause',
                    position: {
                        x: (updated.length % 5) * 200 + 50,
                        y: Math.floor(updated.length / 5) * 150 + 50
                    },
                    data: {
                        clause: c,
                        currentPhase,
                        targetLiteral,
                        isSelected: false,
                        isHighlighted: false,
                        onRemove: (id: string) => handleRemoveRequest(id)
                    }
                });
            });
            return updated;
        });
    }, [activePool, currentPhase, targetLiteral, handleRemoveRequest, setNodes]);

    useEffect(() => {
        setNodes(nds => nds.map(n => ({
            ...n,
            data: {
                ...n.data,
                isSelected: selectedIds.includes(n.id),
                onRemove: () => handleRemoveRequest(n.id)
            }
        })));
    }, [selectedIds, handleRemoveRequest, setNodes]);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );

    const onNodeClick = useCallback((event: React.MouseEvent, clickedNode: Node) => {
        if (clickedNode.data.isRemoved || clickedNode.data.isDisabled) return;
        if (currentPhase !== 'RESOLUTION') return;

        setSelectedIds(prev => {
            if (prev.includes(clickedNode.id)) {
                return prev.filter(id => id !== clickedNode.id);
            }

            const newSelection = [...prev, clickedNode.id];

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
                return [];
            }
            return newSelection;
        });
    }, [currentPhase, handleResolution, setEdges]);

    return (
        <div style={{ height: '70vh', width: '100%', display: 'flex', flexDirection: 'column', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
            <div style={{ padding: '1rem', background: 'white', borderBottom: '1px solid #ddd', textAlign: 'center', transition: 'background 0.3s ease' }}>
                <strong style={{ color: 'grey', fontSize: '1.1rem' }}>
                    {feedback.msg}
                </strong>
            </div>

            {currentPhase === 'LITERAL_SELECTION' && (
                <div style={{ padding: '1rem', background: '#fff', borderBottom: '1px solid #ddd', display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ fontWeight: 'bold' }}>Select Literal to Resolve:</span>
                    {availableVariables.map(v => (
                        <button
                            key={v}
                            onClick={() => handleLiteralSelect(v)}
                            style={{ padding: '0.5rem 1.5rem', background: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            {v}
                        </button>
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
                    onNodeClick={onNodeClick}
                    fitView
                >
                    <Background gap={16} size={1} />
                    <Controls />
                </ReactFlow>
            </div>
        </div>
    );
}