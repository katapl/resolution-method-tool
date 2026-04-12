import { type Node, type Edge } from 'reactflow';
import { type ProofStep } from '../engine/resolver';
import { type Clause } from '../engine/types';

const estimateNodeWidth = (literals: any[]) => {
    if (!literals || literals.length === 0) return 80;
    const textLength = literals.map(l => (l.isNegated ? '~' : '') + l.name).join(' v ').length;
    return 60 + (textLength * 16) + 40;
};

export const generateStepLayout = (step: ProofStep) => {
    const generatedNodes: Node[] = [];
    let generatedEdges: Edge[] = [];
    let absoluteMaxWidth = 0;

    const maxNodeWidth = Math.max(80, ...step.poolBefore.map(c => estimateNodeWidth(c.literals)));

    const COLUMN_GAP = 50;
    const CELL_WIDTH = maxNodeWidth + COLUMN_GAP;
    const ROW_SPACING = 120;
    const NODES_PER_ROW = 5;

    const rows: Clause[][] = [];
    for (let i = 0; i < step.poolBefore.length; i += NODES_PER_ROW) {
        rows.push(step.poolBefore.slice(i, i + NODES_PER_ROW));
    }

    let maxRowIndex = 0;
    let parent1CenterX = 0;
    let parent2CenterX = 0;

    rows.forEach((rowClauses, rowIndex) => {
        maxRowIndex = rowIndex;
        const totalRowWidth = (rowClauses.length * CELL_WIDTH) - COLUMN_GAP;
        absoluteMaxWidth = Math.max(absoluteMaxWidth, totalRowWidth);

        let currentCellStartX = -totalRowWidth / 2;

        rowClauses.forEach((clause, colIndex) => {
            const actualNodeWidth = estimateNodeWidth(clause.literals);
            const cellCenterX = currentCellStartX + (CELL_WIDTH / 2);
            const nodeTopLeftX = cellCenterX - (actualNodeWidth / 2);
            const yPos = rowIndex * ROW_SPACING + 20;

            const isRemoved = (step.type === 'REDUCTION' || step.type === 'INIT') && !!step.removedClauses?.some(r => r.id === clause.id);
            const isParent = step.type === 'RESOLUTION' && (clause.id === step.parent1?.id || clause.id === step.parent2?.id);
            const isHighlighted = (step.type === 'INIT' && clause.isNegatedConclusion) || isParent;

            if (step.type === 'RESOLUTION') {
                if (clause.id === step.parent1?.id) parent1CenterX = cellCenterX;
                if (clause.id === step.parent2?.id) parent2CenterX = cellCenterX;
            }

            generatedNodes.push({
                id: clause.id,
                type: 'clause',
                position: { x: nodeTopLeftX, y: yPos },
                data: {
                    clause: { ...clause, removed: isRemoved },
                    currentPhase: 'DONE',
                    isSelected: false,
                    isHighlighted: isHighlighted
                }
            });

            currentCellStartX += CELL_WIDTH;
        });
    });

    if (step.type === 'RESOLUTION' && step.resolvent) {
        const resolventWidth = estimateNodeWidth(step.resolvent.literals);
        const resolventCenterX = (parent1CenterX + parent2CenterX) / 2;
        const resolventTopLeftX = resolventCenterX - (resolventWidth / 2);
        const resolventY = (maxRowIndex + 1) * ROW_SPACING + 60;

        generatedNodes.push({
            id: step.resolvent.id,
            type: 'clause',
            position: { x: resolventTopLeftX, y: resolventY },
            data: {
                clause: { ...step.resolvent, removed: false },
                currentPhase: 'DONE',
                isSelected: false,
                isHighlighted: true,
            }
        });

        generatedEdges = [
            { id: `e1-${step.stepNumber}`, source: step.parent1!.id, target: step.resolvent.id, animated: false, style: { stroke: '#999', strokeWidth: 2 } },
            { id: `e2-${step.stepNumber}`, source: step.parent2!.id, target: step.resolvent.id, animated: false, style: { stroke: '#999', strokeWidth: 2 } }
        ];
    }

    const paddedGraphWidth = absoluteMaxWidth + 100;
    const dynamicMinZoom = Math.max(0.05, Math.min(0.8, 700 / paddedGraphWidth));

    const totalHeight = (maxRowIndex + 2) * ROW_SPACING + 100;

    const panBuffer = 1000;
    const translateExtent: [[number, number], [number, number]] = [
        [-(absoluteMaxWidth / 2) - panBuffer, -panBuffer],
        [(absoluteMaxWidth / 2) + panBuffer, totalHeight + panBuffer]
    ];

    return { nodes: generatedNodes, edges: generatedEdges, dynamicMinZoom, translateExtent };
};

export const generateSandboxLayout = (
    clauses: Clause[],
    currentPhase: string,
    selectedTarget: string | null,
    selectedParents: Clause[]
) => {
    const generatedNodes: Node[] = [];
    let absoluteMaxWidth = 0;

    const maxNodeWidth = Math.max(80, ...clauses.map(c => estimateNodeWidth(c.literals)));

    const COLUMN_GAP = 50;
    const CELL_WIDTH = maxNodeWidth + COLUMN_GAP;
    const ROW_SPACING = 120;
    const NODES_PER_ROW = 5;

    const rows: Clause[][] = [];
    for (let i = 0; i < clauses.length; i += NODES_PER_ROW) {
        rows.push(clauses.slice(i, i + NODES_PER_ROW));
    }

    rows.forEach((rowClauses, rowIndex) => {
        const totalRowWidth = (rowClauses.length * CELL_WIDTH) - COLUMN_GAP;
        absoluteMaxWidth = Math.max(absoluteMaxWidth, totalRowWidth);

        let currentCellStartX = -totalRowWidth / 2;

        rowClauses.forEach((clause) => {
            const actualNodeWidth = estimateNodeWidth(clause.literals);
            const cellCenterX = currentCellStartX + (CELL_WIDTH / 2);
            const nodeTopLeftX = cellCenterX - (actualNodeWidth / 2);
            const yPos = rowIndex * ROW_SPACING + 20;

            const isSelected = selectedParents.some(p => p.id === clause.id);

            generatedNodes.push({
                id: clause.id,
                type: 'clause',
                position: { x: nodeTopLeftX, y: yPos },
                data: {
                    clause: clause,
                    currentPhase: currentPhase,
                    isSelected: isSelected,
                    targetLiteral: selectedTarget
                }
            });

            currentCellStartX += CELL_WIDTH;
        });
    });

    const paddedGraphWidth = absoluteMaxWidth + 100;
    const dynamicMinZoom = Math.max(0.05, Math.min(0.8, 700 / paddedGraphWidth));

    const totalHeight = rows.length * ROW_SPACING;

    const panBuffer = 1000;
    const translateExtent: [[number, number], [number, number]] = [
        [-(absoluteMaxWidth / 2) - panBuffer, -panBuffer],
        [(absoluteMaxWidth / 2) + panBuffer, totalHeight + panBuffer]
    ];

    return { nodes: generatedNodes, dynamicMinZoom, translateExtent };
};