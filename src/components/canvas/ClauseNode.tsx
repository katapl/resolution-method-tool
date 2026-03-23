import { Handle, Position, type NodeProps } from 'reactflow';

export type ClauseNodeData = {
    label: string;
    isHighlighted: boolean;
};

export default function ClauseNode({ id, data }: NodeProps<ClauseNodeData>) {

    return (
        <div style={{
            border: data.isHighlighted ? '3px solid #2196f3' : '2px solid #333',
            background: '#FFFFFF',
            borderRadius: '8px',
            padding: '12px',
            minWidth: '120px',
            textAlign: 'center',
        }}>
            {/* opacity 0 when canvas static */}
            <Handle type="target" position={Position.Top} style={{ background: '#555', opacity: 0 }} />

            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>
                {data.label}
            </div>

            <Handle type="source" position={Position.Bottom} style={{ background: '#555', opacity: 0 }} />
        </div>
    );
}