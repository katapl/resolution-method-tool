
export type ValidationError = {
    key: string;
    params?: Record<string, string | number>;
};

export function validateFormula(rawValue: string): ValidationError | null {
    const value = rawValue.replace(/[()]/g, '');
    if (!value.trim()) return null;

    const invalidCharMatch = value.match(/[^a-zA-Z\s~,|=\!¬∨⊢\-\^∧\+&]/);
    if (invalidCharMatch) {
        return { key: 'input.errInvalidChar', params: { char: invalidCharMatch[0] } };
    }

    const trailingNegationRegex = /[~!¬](?!\s*[~!¬]*\s*[a-uw-zA-UW-Z])/;
    if (trailingNegationRegex.test(value)) return { key: 'input.errTrailingNegation' };

    const missingOperatorRegex = /[a-uw-zA-UW-Z]\s+[\~!¬]*[a-uw-zA-UW-Z]/;
    if (missingOperatorRegex.test(value)) return { key: 'input.errMissingOperator' };

    const allVars = value.match(/[a-zA-Z]+/g)?.filter(v => v.toLowerCase() !== 'v') || [];
    const multiCharVar = allVars.find(v => v.length > 1);
    if (multiCharVar) {
        return { key: 'input.errMultiChar', params: { literal: multiCharVar } };
    }

    const uniqueVars = new Set(allVars);
    if (uniqueVars.size > 26) {
        return { key: 'input.errMaxVariables', params: { current: uniqueVars.size, max: 26 } };
    }

    const entailmentRegex = /\|=|\|-|⊢/g;
    const entailmentMatches = value.match(entailmentRegex);

    if (entailmentMatches && entailmentMatches.length > 1) {
        return { key: 'input.errMultipleEntailment' };
    }

    const stringWithoutEntailments = value.replace(entailmentRegex, '');
    if (stringWithoutEntailments.includes('|') || stringWithoutEntailments.includes('=')) {
        return { key: 'input.errInvalidEquals' };
    }

    if (entailmentMatches && entailmentMatches.length === 1) {
        const parts = value.split(entailmentRegex);
        const rightSide = parts[1] || '';

        const rightClauses = rightSide.split(/\s*,\s*|\s*\^\s*|\s*∧\s*|\s*&\s*/)
            .filter(c => c.trim().length > 0);

        if (rightClauses.length === 0) return { key: 'input.errMissingConclusion' };
        if (rightClauses.length > 1) return { key: 'input.errMultipleConclusions' };
    }

    const hasOperatorSymbol = /[~,!¬∨^∧+&,|⊢=\-]/.test(value);
    const hasTextOr = /\s+v\s+/i.test(value);

    if (!hasOperatorSymbol && !hasTextOr) return { key: 'input.errNotFormula' };

    const clauses = value.split(/\s*,\s*|\s*\^\s*|\s*∧\s*|\s*&\s*|\|=|⊢|\|-/)
        .filter(c => c.trim().length > 0);

    if (clauses.length < 2) return { key: 'input.errNeedTwoClauses' };

    const invalidClause = clauses.find(c => {
        const vars = c.match(/[a-zA-Z]+/g)?.filter(v => v.toLowerCase() !== 'v') || [];
        return vars.length === 0;
    });

    if (invalidClause) return { key: 'input.errNotFormula' };

    if (clauses.length > 30) {
        return { key: 'input.errMaxClauses', params: { current: clauses.length, max: 30 } };
    }

    return null;
}