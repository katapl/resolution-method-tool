// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ResultPanel from '../../components/solve_mode/ResultPanel';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}));

describe('ResultPanel Component', () => {

    it('should show contradiction message and hide table when hasEmptyClause is true', () => {
        render(
            <ResultPanel
                hasEmptyClause={true}
                hasConclusion={true}
                models={null}
            />
        );

        expect(screen.getByText('results.titleContradiction')).toBeInTheDocument();
        expect(screen.getByText('results.msgContradictionEntailment')).toBeInTheDocument();

        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should show the loading spinner when models are null', () => {
        render(
            <ResultPanel
                hasEmptyClause={false}
                hasConclusion={false}
                models={null}
            />
        );

        expect(screen.getByText('results.calculating')).toBeInTheDocument();
    });

    it('should render an empty state if models array is empty', () => {
        render(
            <ResultPanel
                hasEmptyClause={false}
                hasConclusion={false}
                models={[]}
            />
        );

        expect(screen.getByText('No assignments found.')).toBeInTheDocument();
        expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('should correctly render a truth table with models', () => {
        const mockModels = [
            { A: true, B: false },
            { A: false, B: true }
        ];

        render(
            <ResultPanel
                hasEmptyClause={false}
                hasConclusion={true}
                models={mockModels}
            />
        );

        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();

        expect(screen.getByText('A')).toBeInTheDocument();
        expect(screen.getByText('B')).toBeInTheDocument();

        const trueValues = screen.getAllByText('1');
        const falseValues = screen.getAllByText('0');

        expect(trueValues.length).toBeGreaterThan(0);
        expect(falseValues.length).toBeGreaterThan(0);
    });

    it('should display an error box if modelError is provided', () => {
        render(
            <ResultPanel
                hasEmptyClause={false}
                hasConclusion={false}
                models={[]}
                modelError="Engine timeout: Formula too large."
            />
        );

        expect(screen.getByText('Engine timeout: Formula too large.')).toBeInTheDocument();
    });
});