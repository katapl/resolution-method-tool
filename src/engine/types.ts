
export interface Literal {
    polarity: boolean;
    name: string;
}

export interface Clause {
    id: string;
    literals: Literal[];
    parents?: [string, string];
}

export function literalToString(literal: Literal): string {
    return literal.polarity ? literal.name : `~${literal.name}`;
}

export function clauseToString(clause: Clause): string {
    if (clause.literals.length === 0) return "□ (Empty)";
    return `{ ${clause.literals.map(l => l.polarity ? l.name : `~${l.name}`).join(', ')} }`;
}