import type { ProofStep } from '../../engine/types';
import { useMemo } from 'react';
import { generateStepLayout } from '../../utils/layout';
import styles from './StepCanvas.module.css';
import BaseCanvas from "../BaseCanvas";
import { Controls } from 'reactflow';

interface StepCanvasProps {
    step: ProofStep;
}

export default function StepCanvas({ step }: StepCanvasProps) {
    const { nodes, edges, dynamicMinZoom, translateExtent} = useMemo(() => {
        return generateStepLayout(step);
    }, [step]);

    return (
        <div className={styles.canvasWrapper}>
            <BaseCanvas
                nodes={nodes}
                edges={edges}
                // defaultEdgeOptions={defaultEdgeOptions}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                zoomOnScroll={true}
                zoomOnPinch={true}
                zoomOnDoubleClick={false}
                fitView
                fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}
                minZoom={dynamicMinZoom}
                maxZoom={2.0}
                translateExtent={translateExtent}
            >
                <Controls/>
            </BaseCanvas>
        </div>
    );
}