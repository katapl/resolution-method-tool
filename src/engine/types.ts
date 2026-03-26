
export interface Literal {
    polarity: boolean;
    name: string;
}

export interface Clause {
    id: string;
    literals: Literal[];
    parents?: [string, string];
}

// two different steps? resolution and reduction step? Step parent and reductionStep/resolutionStep children?
// enum for type resolution/reduction/result
export interface ProofStep {
    stepNumber: number;
    type: 'RESOLUTION' | 'REDUCTION';
    message: string;
    poolBefore: Clause[];

    parent1?: Clause;
    parent2?: Clause;
    resolvent?: Clause;

    removedClauses?: Clause[];
}

export function literalToString(literal: Literal): string {
    return literal.polarity ? literal.name : `~${literal.name}`;
}

export function clauseToString(clause: Clause): string {
    if (clause.literals.length === 0) return "□ (Empty)";
    return `{ ${clause.literals.map(l => l.polarity ? l.name : `~${l.name}`).join(', ')} }`;
}