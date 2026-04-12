import ReactFlow, {type Node, type Edge, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import {type ProofStep } from '../../engine/resolver';
import { clauseToString } from "../../engine/types.ts";
import ClauseNode from '../sandbox_mode/ClauseNode';
import { useMemo } from 'react';
import { generateStepLayout } from '../../utils/layout';

const nodeTypes = { clause: ClauseNode };
const defaultEdgeOptions = { animated: false };

interface StepCanvasProps {
    step: ProofStep;
}

export default function StepCanvas({ step }: StepCanvasProps) {
    const { nodes, edges, dynamicMinZoom, translateExtent} = useMemo(() => {
        return generateStepLayout(step);
    }, [step]);

    return (
        <div style={{ flexGrow: 1, height: '500px', width: '100%', background: '#FFFFFF', borderRadius: '12px',}}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                defaultEdgeOptions={defaultEdgeOptions}
                nodeTypes={nodeTypes}
                panOnDrag={true}
                zoomOnScroll={true}
                zoomOnPinch={true}
                preventScrolling={false}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                fitView
                fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
                zoomOnDoubleClick={false}
                minZoom={dynamicMinZoom}
                maxZoom={2.0}
                translateExtent={translateExtent}
            >
                <Background gap={16} size={1} />
            </ReactFlow>
        </div>
    );
}