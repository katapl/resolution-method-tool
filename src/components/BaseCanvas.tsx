import ReactFlow, { Background, type ReactFlowProps } from 'reactflow';
import 'reactflow/dist/style.css';
import ClauseNode from './sandbox_mode/ClauseNode';

const nodeTypes = { clause: ClauseNode };
const proOptions = { hideAttribution: true };

export default function BaseCanvas({children, ...flowProps}: ReactFlowProps &
    { children?: React.ReactNode }) {

    return (
        <ReactFlow
            nodeTypes={nodeTypes}
            nodeOrigin={[0.5, 0]}
            proOptions={proOptions}
            preventScrolling={false}
            panOnDrag={true}
            {...flowProps}
        >
            <Background gap={16} size={1} />
            {children}
        </ReactFlow>
    );
}