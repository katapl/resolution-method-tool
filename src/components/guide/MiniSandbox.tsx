import { useState } from 'react';
import ReactFlow, { Background, type Node, type Edge } from 'reactflow';
import 'reactflow/dist/style.css';
import ClauseNode from "../sandbox_mode/ClauseNode"
import styles from './MiniGuide.module.css';
import { useTranslation } from 'react-i18next';
import Button from '../button/Button';

const nodeTypes = { clause: ClauseNode };

export default function MiniSandbox() {
    const { t } = useTranslation();
    const [step, setStep] = useState<number>(0);

    const handleRemoveClick = (id: string) => {
        if (step === 0 && id === 'tautology') setStep(1);
    };

    const getBaseNodes = (): Node[] => [
        {
            id: 'c1',
            type: 'clause',
            position: { x: 250, y: 50 },
            data: {
                clause: {
                    id: 'c1',
                    literals: [{ name: 'A', polarity: true }, { name: 'B', polarity: true }],
                    removed: false
                }
            }
        },
        {
            id: 'c2',
            type: 'clause',
            position: { x: 400, y: 50 },
            data: {
                clause: {
                    id: 'c2',
                    literals: [{ name: 'A', polarity: false }, { name: 'C', polarity: true }],
                    removed: false
                }
            }
        }
    ];

    const getTautologyNode = (isRemoved: boolean, phase: string): Node => ({
        id: 'tautology', type: 'clause', position: { x: 100, y: 50 },
        data: {
            clause: {
                id: 'tautology',
                literals: [{ name: 'A', polarity: true }, { name: 'A', polarity: false }],
                removed: isRemoved
            },
            isReducible: !isRemoved,
            currentPhase: phase,
            onRemove: handleRemoveClick
        }
    });

    let nodes: Node[] = [];
    let edges: Edge[] = [];

    if (step === 0) {
        nodes = [ getTautologyNode(false, 'REDUCTION'), ...getBaseNodes() ];
    } else if (step === 1) {
        nodes = [ getTautologyNode(true, 'RESOLUTION'), ...getBaseNodes().map(
            n => ({ ...n, data: { ...n.data, currentPhase: 'RESOLUTION' } })) ];
    } else if (step === 2) {
        nodes = [
            getTautologyNode(true, 'RESOLUTION'),
            ...getBaseNodes().map(n => n.id === 'c1'
                ? { ...n, data: { ...n.data, isSelected: true, currentPhase: 'RESOLUTION' } }
                : { ...n, data: { ...n.data, currentPhase: 'RESOLUTION' } })
        ];
    } else if (step === 3) {
        nodes = [
            getTautologyNode(true, 'RESOLUTION'),
            ...getBaseNodes(),
            {
                id: 'res',
                type: 'clause',
                position: { x: 325, y: 150 },
                data: {
                    clause: {
                        id: 'res',
                        literals: [{ name: 'B', polarity: true }, { name: 'C', polarity: true }],
                        removed: false
                    },
                    isHighlighted: true
                }
            }
        ];
        edges = [
            { id: 'e1', source: 'c1', target: 'res', animated: true, style: { stroke: '#999', strokeWidth: 2 } },
            { id: 'e2', source: 'c2', target: 'res', animated: true, style: { stroke: '#999', strokeWidth: 2 } }
        ];
    }

    const handleNodeClick = (_: any, node: Node) => {
        if (step === 1 && node.id === 'c1') setStep(2);
        if (step === 2 && node.id === 'c2') setStep(3);
    };

    return (
        <div className={styles.container}>
            <h4 className={styles.title}>{t('tutorial.sandboxTitle')}</h4>
            <div className={styles.instructionText} style={{ fontWeight: '500' }}>
                {step === 0 && t('tutorial.sandboxStep1')}
                {step === 1 && t('tutorial.sandboxStep2')}
                {step === 2 && t('tutorial.sandboxStep3')}
                {step === 3 && t('tutorial.sandboxStep4')}
            </div>

            <div className={styles.canvasWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onNodeClick={handleNodeClick}
                    defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
                    nodesDraggable={true}
                    zoomOnScroll={false}
                    panOnDrag={true}
                    preventScrolling={false}
                    nodeOrigin={[0.5, 0]}
                    translateExtent={[[-100, -50], [600, 300]]}
                >
                    <Background gap={16} size={1} />
                </ReactFlow>
            </div>
                <div className={styles.controls}>
                    <Button
                        onClick={() => setStep(0)}
                    >
                        {t('tutorial.btnReset')}
                    </Button>
                </div>
        </div>
    );
}