// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import FormulaInput from '../../components/FormulaInput';
import ProofTimeline from '../../components/solve_mode/ProofTimeline';
import SandboxCanvas from '../../components/sandbox_mode/SandboxCanvas';
import type { Clause } from '../../engine/types';

function AppMock() {
    const [clauses, setClauses] = useState<Clause[]>([]);
    const [mode, setMode] = useState<'IDLE' | 'SOLVE' | 'PRACTICE'>('IDLE');

    return (
        <div>
            <FormulaInput
                onSolve={(parsedClauses) => {
        setClauses(parsedClauses);
        setMode('SOLVE');
    }}
    onPractice={(parsedClauses) => {
        setClauses(parsedClauses);
        setMode('PRACTICE');
    }}
    onReset={() => {
        setClauses([]);
        setMode('IDLE');
    }}
    />

    {mode === 'SOLVE' && clauses.length > 0 && (
        <ProofTimeline initialClauses={clauses} />
    )}

    {mode === 'PRACTICE' && clauses.length > 0 && (
        <SandboxCanvas initialClauses={clauses} onBack={vi.fn()} />
    )}
    </div>
);
}

beforeAll(() => {
    // mock resizeobserver for react flow, needed for each canvas test
    vi.stubGlobal('ResizeObserver', class ResizeObserver {
        observe() {
        }

        unobserve() {
        }

        disconnect() {
        }
    });
});

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'en', changeLanguage: vi.fn() }
    })
}));

afterAll(() => {
    vi.unstubAllGlobals();
});

describe('App Routing Integration', () => {
    it('should transition to practice mode when a formula is entered and Practice is clicked', async () => {
        const user = userEvent.setup();
        render(<AppMock />);

        const input = screen.getByRole('textbox');
        await user.type(input, 'A v B, ~A v ~B');

        const practiceBtn = screen.getByText('input.practice');
        await user.click(practiceBtn);

        await waitFor(() => {
            expect(screen.getByText('sandbox.phaseSelectLiteral')).toBeInTheDocument();
        });
    });
});