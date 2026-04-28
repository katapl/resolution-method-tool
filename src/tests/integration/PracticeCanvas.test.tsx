// @vitest-environment jsdom
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import SandboxCanvas from '../../components/sandbox_mode/SandboxCanvas';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, params?: any) => params ? `${key} ${JSON.stringify(params)}` : key,
        i18n: { language: 'en', changeLanguage: vi.fn() }
    })
}));

beforeAll(() => {
    vi.stubGlobal('ResizeObserver', class ResizeObserver {
        observe() {} unobserve() {} disconnect() {}
    });
});

afterAll(() => {
    vi.unstubAllGlobals();
});

describe('SandboxCanvas Integration', () => {
    const mockInitialClauses = [
        { id: 'c1', literals: [{ name: 'A', polarity: true }], removed: false, parents: [], isNegatedConclusion: false },
        { id: 'c2', literals: [{ name: 'A', polarity: false }], removed: false, parents: [], isNegatedConclusion: false }
    ];

    it('should allow literal selection and node resolution', async () => {
        const user = userEvent.setup();
        const { container } = render(<SandboxCanvas initialClauses={mockInitialClauses as any} />);

        expect(screen.getByText('sandbox.phaseSelectLiteral')).toBeInTheDocument();

        const literalBtn = screen.getByRole('button', { name: 'A' });
        await user.click(literalBtn);

        expect(screen.getByText(/sandbox.phaseResolving/)).toBeInTheDocument();

        const node1 = container.querySelector('.react-flow__node[data-id="c1"]');
        const node2 = container.querySelector('.react-flow__node[data-id="c2"]');

        expect(node1).not.toBeNull();
        expect(node2).not.toBeNull();

        fireEvent.click(node1!);
        fireEvent.click(node2!);

        await waitFor(() => {
            expect(screen.getByText('sandbox.proofContradiction')).toBeInTheDocument();
        });
    });
});