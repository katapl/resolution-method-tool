
export interface Literal {
    polarity: boolean;
    name: string;
}

export interface Clause {
    id: string;
    literals: Literal[];
    removed?: boolean;
    isNegatedConclusion?: boolean;
}

export type ProofStepType = 'RESOLUTION' | 'REDUCTION' | 'INIT';

export interface ProofMessage {
    key: string;
    params?: Record<string, string | number>;
}

export interface ProofStep {
    stepNumber: number;
    type: ProofStepType;
    message: ProofMessage;
    poolBefore: Clause[];
    parent1?: Clause;
    parent2?: Clause;
    resolvent?: Clause;
    removedClauses?: Clause[];
}

export function literalToString(literal: Literal): string {
    return literal.polarity ? literal.name : `¬${literal.name}`;
}

export function clauseToString(clause: Clause): string {
    if (clause.literals.length === 0) return "□";
    return clause.literals
        .map(l => l.polarity ? l.name : `¬ ${l.name}`)
        .join(' ∨ ');
}

// export function clauseToLatex(clause: Clause): string {
//     if (clause.literals.length === 0) return "\\square";
//
//     return clause.literals
//         .map(l => l.polarity ? l.name : `\\neg ${l.name}`)
//         .join(' \\lor ');
// }