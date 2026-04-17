import type { Clause } from "../engine/types";
import type { Assignment } from "../engine/types";

export type ModelWorkerMessage =
    | { type: 'SUCCESS', payload: Assignment[] }
    | { type: 'ERROR', payload: string };

self.onmessage = (e: MessageEvent<Clause[]>) => {
    const initialClauses = e.data;
    const MAX_TIME_MS = 5000;
    const startTime = Date.now();

    try {
        const vars = new Set<string>();
        initialClauses.forEach(c => c.literals.forEach(l => vars.add(l.name)));
        const variables = Array.from(vars).sort();

        const satisfyingModels: Assignment[] = [];

        function backtrack(index: number, currentAssignment: Assignment) {
            if (Date.now() - startTime > MAX_TIME_MS) {
                throw new Error(`Model generation timed out after ${MAX_TIME_MS / 1000} seconds. Formula is too complex for a full truth table.`);
            }

            if (index === variables.length) {
                const isSatisfied = initialClauses.every(clause => {
                    if (clause.literals.length === 0) return false;
                    return clause.literals.some(literal => {
                        const assignedValue = currentAssignment[literal.name];
                        return literal.polarity ? assignedValue : !assignedValue;
                    });
                });

                if (isSatisfied) {
                    satisfyingModels.push({ ...currentAssignment });
                }
                return;
            }

            const currentVar = variables[index];

            currentAssignment[currentVar] = true;
            backtrack(index + 1, currentAssignment);

            currentAssignment[currentVar] = false;
            backtrack(index + 1, currentAssignment);

            delete currentAssignment[currentVar];
        }

        backtrack(0, {});

        self.postMessage({ type: 'SUCCESS', payload: satisfyingModels });

    } catch (error: any) {
        self.postMessage({ type: 'ERROR', payload: error.message });
    }
};