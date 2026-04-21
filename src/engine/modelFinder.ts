import type { Clause } from "./types";
import type { Assignment } from "./types";

export function findAllModels(clauses: Clause[]): Assignment[] {
    const vars = new Set<string>();
    clauses.forEach(c => c.literals.forEach(l => vars.add(l.name)));
    const variables = Array.from(vars).sort();

    const satisfyingModels: Assignment[] = [];

    backtrack(0, {}, variables, clauses, satisfyingModels);

    return satisfyingModels;
}


function backtrack(
    index: number,
    currentAssignment: Assignment,
    variables: string[],
    clauses: Clause[],
    satisfyingModels: Assignment[]
) {
    if (index === variables.length) {
        const isSatisfied = clauses.every(clause => {
            if (clause.literals.length === 0) return false;

            return clause.literals.some(literal => {
                const assignedValue = currentAssignment[literal.name];
                return literal.polarity ? assignedValue : !assignedValue;
            });
        });
        if (isSatisfied) satisfyingModels.push({ ...currentAssignment });
        return;
    }

    const currentVar = variables[index];

    currentAssignment[currentVar] = true;
    backtrack(index + 1, currentAssignment, variables, clauses, satisfyingModels);

    currentAssignment[currentVar] = false;
    backtrack(index + 1, currentAssignment, variables, clauses, satisfyingModels);

    delete currentAssignment[currentVar];
}