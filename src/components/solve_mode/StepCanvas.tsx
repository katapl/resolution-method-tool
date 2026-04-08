import ReactFlow, {type Node, type Edge, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import {type ProofStep } from '../../engine/resolver';
import { clauseToString } from "../../engine/types.ts";
import ClauseNode from '../sandbox_mode/ClauseNode';

const nodeTypes = { clause: ClauseNode };
const defaultEdgeOptions = { animated: false };

interface StepCanvasProps {
    step: ProofStep;
}

export default function StepCanvas({ step }: StepCanvasProps) {
    const nodes: Node[] = []
    let edges: Edge[] = [];

    const NODES_PER_ROW = 5;
    const X_SPACING = 200;
    const Y_SPACING = 100;

    const activeColumns = Math.min(step.poolBefore.length, NODES_PER_ROW);
    const startX = -((activeColumns - 1) * X_SPACING) / 2;

    if (step.type === 'REDUCTION' || step.type === 'INIT') {
        step.poolBefore.forEach((clause, index) => {
            const row = Math.floor(index / NODES_PER_ROW);
            const col = index % NODES_PER_ROW;

            const isRemoved = step.removedClauses ? step.removedClauses.some(r => r.id === clause.id) : false;

            const isHighlighted = step.type === 'INIT' && clause.isNegatedConclusion === true;

            nodes.push({
                id: clause.id,
                type: 'clause',
                position: { x: col * X_SPACING + 50, y: row * Y_SPACING + 50 },
                data: {
                    clause: { ...clause, removed: isRemoved },
                    currentPhase: 'DONE',
                    isSelected: false,
                    isHighlighted: isHighlighted
                }
            });
        });
    }
    else {
    let parent1X = 0;
    let parent2X = 0;
        let maxRow = 0;

        step.poolBefore.forEach((clause, index) => {
            const row = Math.floor(index / NODES_PER_ROW);
            const col = index % NODES_PER_ROW;

            if (row > maxRow) maxRow = row;

            const xPos = startX + col * X_SPACING;
            const yPos = row * Y_SPACING + 20;

            const isParent = clause.id === step.parent1!.id || clause.id === step.parent2!.id;

            if (clause.id === step.parent1!.id) parent1X = xPos;
            if (clause.id === step.parent2!.id) parent2X = xPos;

            nodes.push({
                id: clause.id,
                type: 'clause',
                position: { x: xPos, y: yPos },
                data: {
                    clause: { ...clause, removed: false },
                    currentPhase: 'DONE',
                    isSelected: false,
                    isHighlighted: isParent,
                }
            });
        });

        const resolventX = (parent1X + parent2X) / 2;
        const resolventY = (maxRow + 1) * Y_SPACING + 60;
        nodes.push({
            id: step.resolvent!.id,
            type: 'clause',
            position: { x: resolventX, y: 160 },
            data: {
                clause: { ...step.resolvent!, removed: false },
                currentPhase: 'DONE',
                isSelected: false,
                isHighlighted: true,
            }
        });

        edges = [
            { id: `e1-${step.stepNumber}`, source: step.parent1!.id, target: step.resolvent!.id, animated: false, style: { stroke: 'grey', strokeWidth: 2 } },
            { id: `e2-${step.stepNumber}`, source: step.parent2!.id, target: step.resolvent!.id, animated: false, style: { stroke: 'grey', strokeWidth: 2 } }
        ];
    }

    return (
        // pointer events none to keep flow static
        <div style={{ height: '280px', width: '100%', background: '#fafafa', borderRadius: '8px', border: '1px solid #eee', pointerEvents: 'none' }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                defaultEdgeOptions={defaultEdgeOptions}
                nodeTypes={nodeTypes}
                panOnDrag={false}
                zoomOnScroll={false}
                preventScrolling={false}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
            >
                <Background gap={12} size={1} />
            </ReactFlow>
        </div>
    );
}