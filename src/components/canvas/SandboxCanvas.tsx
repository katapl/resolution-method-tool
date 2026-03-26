import {useState, useCallback, useEffect} from 'react';
import ReactFlow, {
    Background, Controls, type Node, type Edge,
    useNodesState, useEdgesState, applyNodeChanges, type NodeChange
} from 'reactflow';
import 'reactflow/dist/style.css';

import {type Clause, clauseToString} from "../../engine/types";
import {getComplementaryLiteral, resolve} from "../../engine/resolver";
import {checkTautology, checkSubsumption, getPureLiteral} from "../../engine/reduction";
import ClauseNode from './ClauseNode';

const nodeTypes = {clause: ClauseNode};

interface SandboxCanvasProps {
    initialClauses: Clause[];
}

export default function SandboxCanvas({initialClauses}: SandboxCanvasProps) {
    const [nodes, setNodes] = useNodesState([]);
    const [edges, setEdges] = useEdgesState([]);
    const [activePool, setActivePool] = useState<Clause[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [lockedLiteral, setLockedLiteral] = useState<string | null>(null);
    const [resolvedPairs, setResolvedPairs] = useState<Set<string>>(new Set());

    const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'info', msg: string }>({
        type: 'info', msg: 'Select two clauses to resolve, or click x to remove a redundant clause.'
    });

    const handleRemoveRequest = useCallback((clauseId: string) => {
        const targetClause = activePool.find(c => c.id === clauseId);
        if (!targetClause) return;

        const executeRemoval = (successMessage: string) => {
            setFeedback({type: 'success', msg: successMessage});
            setActivePool(prev => prev.filter(c => c.id !== clauseId));
            setNodes(nds => nds.map(
                n => n.id === clauseId ? {
                    ...n,
                    data: {
                        ...n.data,
                        isRemoved: true,
                        isHighlighted: false,
                        isDisabled: true
                    }
                } : n));
            setSelectedIds(prev => prev.filter(id => id !== clauseId));
        };

        if (checkTautology(targetClause)) {
            executeRemoval("You removed a Tautology.");
            return;
        }
        if (checkSubsumption(targetClause, activePool)) {
            executeRemoval("You removed a subsumed clause.");
            return;
        }
        const pureLit = getPureLiteral(targetClause, activePool);
        if (pureLit) {
            executeRemoval(`Clause removed because "${pureLit.name}" is a pure literal.`);
            return;
        }

        setFeedback({type: 'error', msg: "This clause is not a tautology, is not subsumed, and has no pure literals."});
    }, [activePool, setNodes]);

    useEffect(() => {
        setActivePool(initialClauses);
        const initialNodes: Node[] = initialClauses.map((clause, index) => ({
            id: clause.id,
            type: 'clause',
            position: {x: index * 200 + 50, y: 50},
            data: {
                label: clauseToString(clause),
                isHighlighted: false,
                isRemoved: false,
                isDisabled: false,
                isInteractive: true,
                onRemove: () => {
                }
            }
        }));
        setNodes(initialNodes);
        setEdges([]);
        setSelectedIds([]);
        setLockedLiteral(null);
    }, [initialClauses, setNodes, setEdges]);

    useEffect(() => {
        setNodes(nds => nds.map(n => {
            const clause = activePool.find(c => c.id === n.id);
            if (!clause || n.data.isRemoved) return n;

            let isDisabled = false;

            if (lockedLiteral) {
                const containsLock = clause.literals.some(l => l.name === lockedLiteral);
                if (!containsLock) isDisabled = true;
            }

            if (selectedIds.length === 1 && !isDisabled) {
                const selectedClauseId = selectedIds[0];
                if (n.id !== selectedClauseId) {
                    const selectedClause = activePool.find(c => c.id === selectedClauseId)!;
                    const canResolve = !!getComplementaryLiteral(selectedClause, clause);
                    if (!canResolve) isDisabled = true;
                }
            }

            return {
                ...n,
                data: {
                    ...n.data,
                    isSelected: selectedIds.includes(n.id),
                    isDisabled: isDisabled,
                    onRemove: () => handleRemoveRequest(n.id)
                }
            };
        }));
    }, [selectedIds, activePool, lockedLiteral, setNodes, handleRemoveRequest]);

    const onNodeClick = useCallback(
        (event: React.MouseEvent, clickedNode: Node) => {
            if (clickedNode.data.isRemoved || clickedNode.data.isDisabled) return;

            const nodeId = clickedNode.id;
            let newSelection = [...selectedIds];

            if (newSelection.includes(nodeId)) {
                newSelection = newSelection.filter(id => id !== nodeId);
            } else {
                newSelection.push(nodeId);
            }

            if (newSelection.length === 2) {
                const [id1, id2] = newSelection;
                const c1 = activePool.find(c => c.id === id1)!;
                const c2 = activePool.find(c => c.id === id2)!;

                const pairKey = `${id1}-${id2}`;
                if (resolvedPairs.has(pairKey) || resolvedPairs.has(`${id2}-${id1}`)) {
                    setFeedback({type: 'error', msg: "You have already resolved this exact pair"});
                    setSelectedIds([]);
                    return;
                }

                const targetLiteral = getComplementaryLiteral(c1, c2);

                if (targetLiteral) {
                    const newId = `sandbox-res-${Date.now()}`;
                    const resolvent = resolve(targetLiteral, c1, c2, newId);

                    const newResolved = new Set(resolvedPairs).add(pairKey).add(`${id2}-${id1}`);
                    setResolvedPairs(newResolved);

                    let newPool = [...activePool, resolvent];

                    const posClauses = newPool.filter(
                        c => c.literals.some(l => l.name === targetLiteral.name && l.polarity === true));
                    const negClauses = newPool.filter(
                        c => c.literals.some(l => l.name === targetLiteral.name && l.polarity === false));

                    let hasUnresolvedPairs = false;
                    for (const p of posClauses) {
                        for (const n of negClauses) {
                            if (!newResolved.has(`${p.id}-${n.id}`)) {
                                hasUnresolvedPairs = true;
                                break;
                            }
                        }
                    }

                    if (hasUnresolvedPairs) {
                        setLockedLiteral(targetLiteral.name);
                        setFeedback({
                            type: 'info',
                            msg: `Resolved on "${targetLiteral.name}". Parents kept. You must finish resolving all "${targetLiteral.name}" pairs.`
                        });

                        setActivePool(newPool);
                        setNodes(nds => {
                            const updatedNodes = nds.map(
                                n => ({...n, data: {...n.data, isHighlighted: false}}));
                            const p1Node = nds.find(
                                n => n.id === id1);
                            const p2Node = nds.find(
                                n => n.id === id2);
                            updatedNodes.push({
                                id: resolvent.id,
                                type: 'clause',
                                position: {
                                    x: (p1Node?.position.x! + p2Node?.position.x!) / 2,
                                    y: Math.max(p1Node?.position.y!, p2Node?.position.y!) + 120
                                },
                                data: {
                                    label: clauseToString(resolvent),
                                    isHighlighted: true,
                                    isRemoved: false,
                                    isInteractive: true,
                                    onRemove: () => handleRemoveRequest(resolvent.id)
                                }
                            });
                            return updatedNodes;
                        });
                    } else {
                        setLockedLiteral(null);
                        setFeedback({
                            type: 'success',
                            msg: `"${targetLiteral.name}" is completely resolved. Parent clauses removed.`
                        });

                        newPool = newPool.filter(c => !c.literals.some(l => l.name === targetLiteral.name));
                        setActivePool(newPool);

                        setNodes(nds => {
                            const updatedNodes = nds.map(n => {
                                const clause = activePool.find(c => c.id === n.id);
                                if (clause && clause.literals.some(l => l.name === targetLiteral.name)) {
                                    return {
                                        ...n,
                                        data: {
                                            ...n.data,
                                            isRemoved: true,
                                            isHighlighted: false,
                                            isDisabled: true
                                        }
                                    };
                                }
                                return {
                                    ...n,
                                    data: {
                                        ...n.data,
                                        isHighlighted: false
                                    }};
                            });
                            const p1Node = nds.find(
                                n => n.id === id1);
                            const p2Node = nds.find(
                                n => n.id === id2);
                            updatedNodes.push({
                                id: resolvent.id,
                                type: 'clause',
                                position: {
                                    x: (p1Node?.position.x! + p2Node?.position.x!) / 2,
                                    y: Math.max(p1Node?.position.y!, p2Node?.position.y!) + 120
                                },
                                data: {
                                    label: clauseToString(resolvent),
                                    isHighlighted: true,
                                    isRemoved: false,
                                    isInteractive: true,
                                    onRemove: () => handleRemoveRequest(resolvent.id)
                                }
                            });
                            return updatedNodes;
                        });
                    }

                    setEdges(eds => [...eds, {
                        id: `e-${id1}-${newId}`,
                        source: id1,
                        target: newId,
                        animated: false,
                        style: {stroke: '#9e9e9e', strokeWidth: 2}
                    }, {
                        id: `e-${id2}-${newId}`,
                        source: id2,
                        target: newId,
                        animated: false,
                        style: {stroke: '#9e9e9e', strokeWidth: 2}
                    }]);

                } else {
                    setFeedback({type: 'error', msg: "Invalid move!"});
                }
                setSelectedIds([]);
            } else {
                setSelectedIds(newSelection);
            }
        }, [selectedIds, activePool, handleRemoveRequest, setNodes, setEdges]);

    const onNodesChange = useCallback((changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)), [setNodes]);

    const getFeedbackColor = () => {
        if (feedback.type === 'success') return 'white';
        if (feedback.type === 'error') return 'white';
        return 'white';
    };

    return (
        <div style={{
            height: '70vh',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
        }}>
            <div style={{
                padding: '1rem',
                background: getFeedbackColor(),
                borderBottom: '1px solid #ddd',
                textAlign: 'center',
                transition: 'background 0.3s ease'
            }}>
                <strong style={{
                    color: feedback.type === 'error' ? 'grey' : (feedback.type === 'success' ? 'grey' : 'grey'),
                    fontSize: '1.1rem'
                }}>
                    {feedback.msg}
                </strong>
            </div>
            <div style={{flexGrow: 1, background: '#ffffff'}}>
                <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange}
                           onNodeClick={onNodeClick} fitView>
                    <Background gap={16} size={1}/>
                    <Controls/>
                </ReactFlow>
            </div>
        </div>
    );
}