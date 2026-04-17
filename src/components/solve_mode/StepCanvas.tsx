import type { ProofStep } from '../../engine/types';
import { useMemo } from 'react';
import { generateStepLayout } from '../../utils/layout';
import styles from './StepCanvas.module.css';
import BaseCanvas from "../BaseCanvas";

interface StepCanvasProps {
    step: ProofStep;
}

const proOptions = { hideAttribution: true };

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
            />
            {/*<ReactFlow*/}
            {/*    nodes={nodes}*/}
            {/*    edges={edges}*/}
            {/*    defaultEdgeOptions={defaultEdgeOptions}*/}
            {/*    nodeTypes={nodeTypes}*/}
            {/*    panOnDrag={true}*/}
            {/*    zoomOnScroll={true}*/}
            {/*    zoomOnPinch={true}*/}
            {/*    preventScrolling={false}*/}
            {/*    nodesDraggable={false}*/}
            {/*    nodesConnectable={false}*/}
            {/*    elementsSelectable={false}*/}
            {/*    fitView*/}
            {/*    fitViewOptions={{ padding: 0.2, maxZoom: 1.2 }}*/}
            {/*    zoomOnDoubleClick={false}*/}
            {/*    minZoom={dynamicMinZoom}*/}
            {/*    maxZoom={2.0}*/}
            {/*    translateExtent={translateExtent}*/}
            {/*    nodeOrigin={[0.5, 0]}*/}
            {/*    proOptions={proOptions}*/}
            {/*>*/}
            {/*    <Background gap={16} size={1} />*/}
            {/*</ReactFlow>*/}
        </div>
    );
}