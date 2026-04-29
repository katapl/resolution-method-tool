import Button from '../button/Button';
import { Controls } from 'reactflow';
import 'reactflow/dist/style.css';
import { useSandboxEngine } from '../../hook/useSandboxEngine';
import { useSandboxStorage } from '../../hook/useSandboxStorage';
import { useSandboxGraph } from '../../hook/useSandboxGraph';
import { type Clause } from "../../engine/types";
import { useTranslation } from 'react-i18next';
import styles from './SandboxCanvas.module.css';
import BaseCanvas from "../BaseCanvas";
import { ChevronLeft } from 'lucide-react';
import MessageFormatter from '../../utils/MessageFormatter';

interface SandboxCanvasProps {
    initialClauses: Clause[];
    onBack: () => void;
}

export default function SandboxCanvas({ initialClauses, onBack }: SandboxCanvasProps) {
    const { t } = useTranslation();
    const storageKey = initialClauses.length > 0 ? initialClauses[0].id : 'empty';

    const { initialEngineState, initialNodes, initialEdges, initialSelected } =
        useSandboxStorage(storageKey);

    const {
        engineState, activePool, feedback, currentPhase, targetLiteral,
        availableVariables, reducibleClauseIds, handleRemoveRequest,
        handleResolution, handleLiteralSelect, isPristineEntailment
    } = useSandboxEngine(initialClauses, initialEngineState);

    const {
        nodes, edges, onNodesChange, onEdgesChange, selectedIds,
        cameraBounds, handleNodeSelect, setRfInstance
    } = useSandboxGraph(
        activePool, currentPhase, targetLiteral, reducibleClauseIds,
        handleRemoveRequest, handleResolution, initialNodes, initialEdges, initialSelected
    );

    useSandboxStorage(storageKey, engineState, nodes, edges, selectedIds);

    return (
        <div className={styles.mainContainer}>
            <Button onClick={onBack} className={styles.floatingBackBtn}>
                <ChevronLeft size={28} />
                {t('input.back')}
            </Button>

                <div className={styles.floatingHeader}>
                    <p className={styles.feedbackText}>
                        {isPristineEntailment && `${t('sandbox.entailmentPrefix')} `}
                        <MessageFormatter
                            text={t(feedback.msg.key, feedback.msg.params)}
                        />
                    </p>

                {currentPhase === 'LITERAL_SELECTION' && (
                    <div className={styles.literalGroup}>
                        {availableVariables.map(v => (
                            <Button
                                key={v}
                                onClick={() => handleLiteralSelect(v)}
                                className={styles.literalBtn}
                            >
                                {v}
                            </Button>
                        ))}
                    </div>
                )}
                </div>

            <div className={styles.canvasBody}>
                <BaseCanvas
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={(_, node) => {
                        if (!node.data.clause.removed) handleNodeSelect(node.id);
                    }}
                    elementsSelectable={true}
                    nodeDragThreshold={10}
                    fitView
                    fitViewOptions={{ padding: 0.8, maxZoom: 1.2 }}
                    translateExtent={cameraBounds}
                    onInit={setRfInstance}
                >
                    <Controls/>
                </BaseCanvas>
            </div>
        </div>
    );
}