import type { Clause } from "./types";
import type { Assignment } from "./types";

export function findAllModels(clauses: Clause[]): Assignment[] {
    const vars = new Set<string>();
    clauses.forEach(c => c.literals.forEach(l => vars.add(l.name)));
    const variables = Array.from(vars).sort();

    const satisfyingModels: Assignment[] = [];

    // 2. Recursive backtracking to evaluate all true/false combinations
    // function backtrack(index: number, currentAssignment: Assignment) {
    //     // Base Case: All variables have been assigned a boolean
    //     if (index === variables.length) {
    //
    //         // Check if this specific assignment satisfies ALL clauses
    //         const isSatisfied = clauses.every(clause => {
    //             // An empty clause is unconditionally false
    //             if (clause.literals.length === 0) return false;
    //
    //             // A clause is true if AT LEAST ONE of its literals is true
    //             return clause.literals.some(literal => {
    //                 const assignedValue = currentAssignment[literal.name];
    //                 return literal.polarity ? assignedValue : !assignedValue;
    //             });
    //         });
    //
    //         // If valid, save a copy of this assignment to our results
    //         if (isSatisfied) {
    //             satisfyingModels.push({ ...currentAssignment });
    //         }
    //         return;
    //     }
    //
    //     const currentVar = variables[index];
    //
    //     // Branch A: Try setting the variable to TRUE
    //     currentAssignment[currentVar] = true;
    //     backtrack(index + 1, currentAssignment);
    //
    //     // Branch B: Try setting the variable to FALSE
    //     currentAssignment[currentVar] = false;
    //     backtrack(index + 1, currentAssignment);
    //
    //     // Cleanup before moving back up the recursion tree
    //     delete currentAssignment[currentVar];
    // }

    // backtrack(0, {});
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