import { Handle, Position, type NodeProps } from 'reactflow';

export type ClauseNodeData = {
    label: string;
    isHighlighted: boolean;
    isSelected: boolean;
    isRemoved?: boolean;
    isDisabled?: boolean;
    isInteractive?: boolean;
    onRemove: (id: string) => void;
};

export default function ClauseNode({ id, data }: NodeProps<ClauseNodeData>) {

    let borderStyle = '2px solid #333';
    if (data.isRemoved) borderStyle = '2px solid #f44336';
    else if (data.isSelected) borderStyle = '2px solid #333';
    else if (data.isHighlighted) borderStyle = '2px solid black';

    let nodeOpacity = 0.9;
    if (data.isRemoved) nodeOpacity = 0.3;
    else if (data.isDisabled) nodeOpacity = 0.4;
    else if (data.isSelected || data.isHighlighted) nodeOpacity = 1;

    return (
        <div style={{
            position: 'relative',
            background: data.isSelected ? '#d1d1d1' : (data.isRemoved ? '#ffebee' : '#ffffff'),
            border: borderStyle,
            opacity: nodeOpacity,
            cursor: data.isDisabled || data.isRemoved ? 'not-allowed' : 'pointer',
            borderRadius: '8px',
            padding: '12px',
            transition: 'all 0.2s ease',
            minWidth: '120px',
            textAlign: 'center',
        }}>
            {/* opacity 0 when canvas static */}
            <Handle type="target" position={Position.Top} style={{ background: '#555', opacity: 0 }} />

            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'black' }}>
                {data.label}
            </div>

            {data.isInteractive && !data.isRemoved && !data.isDisabled && (
                <button
                    title="Remove Clause"
                    onClick={(e) => {
                        e.stopPropagation();
                        data.onRemove(id);
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