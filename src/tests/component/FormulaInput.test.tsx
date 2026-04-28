// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import FormulaInput from '../../components/FormulaInput';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: {
            language: 'en',
            changeLanguage: vi.fn()
        }
    })
}));

it('should call onSolve when the user submits', async () => {
    const mockOnSolve = vi.fn();
    const user = userEvent.setup();

    render(<FormulaInput onSolve={mockOnSolve} onPractice={() => {}} onReset={() => {}} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'A v B, ~A');

    const solveBtn = screen.getByRole('button', { name: /solve/i });
    await user.click(solveBtn);

    expect(mockOnSolve).toHaveBeenCalled();
});