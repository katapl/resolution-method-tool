import ReactFlow, { Background } from 'reactflow';
import 'reactflow/dist/style.css';
import type { ProofStep } from '../../engine/types';
import ClauseNode from '../sandbox_mode/ClauseNode';
import { useMemo } from 'react';
import { generateStepLayout } from '../../utils/layout';
import styles from './StepCanvas.module.css';

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
        <div className={styles.canvasWrapper}>
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
                nodeOrigin={[0.5, 0]}
            >
                <Background gap={16} size={1} />
            </ReactFlow>
        </div>
    );
}