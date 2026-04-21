import { useState, useEffect } from 'react';
import { type Node, type Edge, useNodesState, useEdgesState } from 'reactflow';
import 'reactflow/dist/style.css';
import styles from './Guide.module.css';
import { useTranslation } from 'react-i18next';
import Button from '../button/Button';
import BaseCanvas from "../BaseCanvas"

export default function MiniSandbox() {
    const { t } = useTranslation();
    const [step, setStep] = useState<number>(0);

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

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


    useEffect(() => {
        let nextNodes: Node[] = [];
        let nextEdges: Edge[] = [];

        if (step === 0) {
            nextNodes = [getTautologyNode(false, 'REDUCTION'), ...getBaseNodes()];
        } else if (step === 1) {
            nextNodes = [getTautologyNode(true, 'RESOLUTION'), ...getBaseNodes().map(
                n => ({ ...n, data: { ...n.data, currentPhase: 'RESOLUTION' } }))];
        } else if (step === 2) {
            nextNodes = [
                getTautologyNode(true, 'RESOLUTION'),
                ...getBaseNodes().map(n => n.id === 'c1'
                    ? { ...n, data: { ...n.data, isSelected: true, currentPhase: 'RESOLUTION' } }
                    : { ...n, data: { ...n.data, currentPhase: 'RESOLUTION' } })
            ];
        } else if (step === 3) {
            nextNodes = [
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
            nextEdges = [
                { id: 'e1', source: 'c1', target: 'res', animated: false, style: { stroke: '#999', strokeWidth: 2 } },
                { id: 'e2', source: 'c2', target: 'res', animated: false, style: { stroke: '#999', strokeWidth: 2 } }
            ];
        }

        setNodes((currentNodes) => {
            return nextNodes.map(nextNode => {
                const existingNode = currentNodes.find(n => n.id === nextNode.id);
                if (existingNode) {
                    return { ...nextNode, position: existingNode.position };
                }
                return nextNode;
            });
        });

        setEdges(nextEdges);
    }, [step]);


    const handleNodeClick = (_: any, node: Node) => {
        if (step === 1 && node.id === 'c1') setStep(2);
        if (step === 2 && node.id === 'c2') setStep(3);
    };

    return (
        <div className={styles.container}>
            <h4 className={styles.text}>{t('tutorial.sandboxTitle')}</h4>
            <p className={styles.instructionText}>{t('tutorial.practiceExplanation')}</p>
            <div className={styles.instructionText}>
                {step === 0 && t('tutorial.sandboxStep1')}
                {step === 1 && t('tutorial.sandboxStep2')}
                {step === 2 && t('tutorial.sandboxStep3')}
                {step === 3 && t('tutorial.sandboxStep4')}
            </div>

            <div className={styles.canvasWrapper}>
                <BaseCanvas
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={handleNodeClick}
                    nodesDraggable={true}
                    zoomOnScroll={false}
                    defaultViewport={{ x: 0, y: 0, zoom: 1.5 }}
                    translateExtent={[[-100, -50], [600, 300]]}
                />
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