import {useState, useCallback, useEffect} from 'react';
import ReactFlow, {
    Background, Controls, type Node, type Edge,
    useNodesState, useEdgesState, applyNodeChanges, applyEdgeChanges, type NodeChange
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useLocalStorage } from '../../hook/useLocalStorage';
import { useSandboxEngine } from '../../hook/useSandboxEngine';
import {type Clause, clauseToString} from "../../engine/types";
import {getComplementaryLiteral, resolve} from "../../engine/resolver";
import {checkTautology, checkSubsumption, getPureLiteral} from "../../engine/reduction";
import ClauseNode from './ClauseNode';

const nodeTypes = {clause: ClauseNode};

interface SandboxCanvasProps {
    initialClauses: Clause[];
}

export default function SandboxCanvas({ initialClauses }: SandboxCanvasProps) {

    const {
        nodes, edges, feedback, currentPhase, targetLiteral, availableVariables,
        setNodes, setEdges,
        handleRemoveRequest, handleNodeClick, handleLiteralSelect
    } = useSandboxEngine(initialClauses);

    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
        [setNodes]
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
        [setEdges]
    );

    const onNodeClick = useCallback((event: React.MouseEvent, clickedNode: any) => {
        if (clickedNode.data.isRemoved || clickedNode.data.isDisabled) return;

        const result = handleNodeClick(clickedNode.id, selectedIds);

        setSelectedIds(result.newSelection);

        if (result.shouldClearSelection) {
            setSelectedIds([]);
        }

    }, [selectedIds, handleNodeClick]);

    useEffect(() => {
        setNodes(nds => nds.map(n => ({
            ...n,
            data: {
                ...n.data,
                isSelected: selectedIds.includes(n.id),
                onRemove: () => handleRemoveRequest(n.id)
            }
        })));
    }, [selectedIds, setNodes, handleRemoveRequest]);

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