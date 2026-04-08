import { Handle, Position, type NodeProps } from 'reactflow';
import type { Clause } from '../../engine/types';
import type { SandboxPhase } from '../../hook/useSandboxEngine';
import { clauseToString } from '../../engine/types';

export type ClauseNodeData = {
    clause: Clause;
    currentPhase?: SandboxPhase;
    targetLiteral?: string | null;
    isSelected?: boolean;
    isHighlighted?: boolean;
    onRemove?: (id: string) => void;
};

export default function ClauseNode({ id, data }: NodeProps<ClauseNodeData>) {
    if (!data || !data.clause) {
        return null;
    }

    const { clause, currentPhase, targetLiteral, isSelected, isHighlighted, onRemove } = data;

    const isRemoved = clause.removed === true;

    let isInteractive = false;
    if (!isRemoved && onRemove && currentPhase) {
        if (currentPhase === 'MANUAL_SWEEP' && targetLiteral) {
            isInteractive = clause.literals.some(l => l.name === targetLiteral);
        } else if (currentPhase === 'REDUCTION') {
            isInteractive = true;
        }
    }

    const isDisabled = isRemoved;

    let borderStyle = '2px solid #333';
    if (isRemoved) borderStyle = '2px solid #f44336';
    else if (isSelected) borderStyle = '2px solid #333';
    else if (isHighlighted) borderStyle = '2px solid #4CAF50';

    let nodeOpacity = 0.9;
    if (isRemoved) nodeOpacity = 0.3;
    else if (isDisabled) nodeOpacity = 0.4;
    else if (isSelected || isHighlighted) nodeOpacity = 1;

    return (
        <div style={{
            position: 'relative',
            background: isSelected || isHighlighted ? '#f0f8ff' : (isRemoved ? '#ffebee' : '#ffffff'),
            border: borderStyle,
            opacity: nodeOpacity,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            borderRadius: '8px',
            padding: '12px',
            transition: 'all 0.2s ease',
            minWidth: '120px',
            textAlign: 'center',
        }}>
            {/* opacity 0 when canvas static */}
            <Handle type="target" position={Position.Top} style={{ background: '#555', opacity: 0 }} />

            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'black' }}>
                {clauseToString(clause)}
            </div>

            {isInteractive && !isDisabled && onRemove && (
                <button
                    title="Remove Clause"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove(id);
                    }}
                    style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        width: '24px',
                        height: '24px',
                        background: 'white',
                        color: 'grey',
                        border: 'none',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        padding: 0,
                        zIndex: 10
                    }}
                >
                    &times;
                </button>
            )}

            <Handle type="source" position={Position.Bottom} style={{ background: '#555', opacity: 0 }} />
        </div>
    );
}