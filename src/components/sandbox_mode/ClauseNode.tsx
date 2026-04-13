import { Handle, Position, type NodeProps } from 'reactflow';
import type { Clause } from '../../engine/types';
import type { SandboxPhase } from '../../hook/useSandboxEngine';
import { clauseToString, clauseToLatex } from '../../engine/types';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';
import styles from './ClauseNode.module.css';

export type ClauseNodeData = {
    clause: Clause;
    currentPhase?: SandboxPhase;
    targetLiteral?: string | null;
    isSelected?: boolean;
    isHighlighted?: boolean;
    isReducible?: boolean;
    onRemove?: (id: string) => void;
    onSelect?: () => void;
};

export default function ClauseNode({ id, data }: NodeProps<ClauseNodeData>) {
    if (!data || !data.clause) {
        return null;
    }

    const { clause, currentPhase, targetLiteral, isSelected, isHighlighted, onRemove, isReducible } = data;

    const isRemoved = clause.removed === true;

    let isInteractive = false;
    if (!isRemoved && onRemove && currentPhase) {
        if (currentPhase === 'MANUAL_SWEEP' && targetLiteral) {
            isInteractive = clause.literals.some(l => l.name === targetLiteral);
        } else if (currentPhase === 'REDUCTION') {
            isInteractive = isReducible === true;
        }
    }

    let nodeClass = styles.node;
    if (isRemoved) {
        nodeClass += ` ${styles.removed}`;
    } else if (isSelected) {
        nodeClass += ` ${styles.selected}`;
    } else if (isHighlighted) {
        nodeClass += ` ${styles.highlighted}`;
    }

    return (
        <div
            // onClick={data.onSelect}
            className={nodeClass}
        >
            <Handle type="target" position={Position.Top} style={{ background: '#555', opacity: 0 }} />

            <div className={styles.mathContainer}>
                <InlineMath math={clauseToLatex(clause)} />
            </div>

            {isInteractive && !isRemoved && onRemove && (
                <button
                    title="Remove Clause"
                    className={styles.removeButton}
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(id);
                    }}
                >
                    &times;
                </button>
            )}

            <Handle type="source" position={Position.Bottom} style={{ background: '#555', opacity: 0 }} />
        </div>
    );
}