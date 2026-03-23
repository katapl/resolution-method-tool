import ReactFlow, {type Node, type Edge, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import {type ProofStep } from '../../engine/resolver';
import { clauseToString } from "../../engine/types.ts";
import ClauseNode from './ClauseNode';

const nodeTypes = { clause: ClauseNode };
const defaultEdgeOptions = { animated: false };

interface StepCanvasProps {
    step: ProofStep;
}

export default function StepCanvas({ step }: StepCanvasProps) {
    const nodes: Node[] = []
    let parent1X = 0;
    let parent2X = 0;

    step.poolBefore.forEach((clause, index) => {
        const xPos = index * 180 + 50;

        const isParent = clause.id === step.parent1.id || clause.id === step.parent2.id;

        if (clause.id === step.parent1.id) parent1X = xPos;
        if (clause.id === step.parent2.id) parent2X = xPos;

        nodes.push({
            id: clause.id,
            type: 'clause',
            position: { x: xPos, y: 20 },
            data: {
                label: clauseToString(clause),
                isHighlighted: isParent,
                onRemove: () => {}
            }
        });
    });

    const resolventX = (parent1X + parent2X) / 2;

    nodes.push({
        id: step.resolvent.id,
        type: 'clause',
        position: { x: resolventX, y: 160 },
        data: {
            label: clauseToString(step.resolvent),
            isHighlighted: true,
            onRemove: () => {}
        }
    });

    const edges: Edge[] = [
        { id: `e1-${step.stepNumber}`, source: step.parent1.id, target: step.resolvent.id},
        { id: `e2-${step.stepNumber}`, source: step.parent2.id, target: step.resolvent.id }
    ];

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