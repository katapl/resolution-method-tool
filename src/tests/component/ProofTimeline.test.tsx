// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { it, expect, vi, beforeAll, afterAll } from 'vitest';
import userEvent from '@testing-library/user-event';
import ProofTimeline from '../../components/solve_mode/ProofTimeline';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key
    })
}));

vi.mock('../../hook/useProofEngine', () => ({
    useProofEngine: () => ({
        isSolving: false,
        workerError: null,
        fullHistory: [
            { stepNumber: 1, type: 'REDUCTION', message: 'Step 1', poolBefore: [], removedClauses: [] },
            { stepNumber: 2, type: 'REDUCTION', message: 'Step 2', poolBefore: [], removedClauses: [] },
            { stepNumber: 3, type: 'REDUCTION', message: 'Step 3', poolBefore: [], removedClauses: [] }
        ],
        totalSteps: 3,
        hasEmptyClause: false,
        hasConclusion: true,
        isEmptySet: false,
        models: null,
        modelError: null
    })
}));

beforeAll(() => {
    // mock resizeobserver for react flow, needed for each canvas test
    vi.stubGlobal('ResizeObserver', class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
    });

    vi.stubGlobal('Worker', class MockWorker {
        onmessage: any;
        onerror: any;
        url: string;

        constructor(stringUrl: string | URL) {
            this.url = stringUrl.toString();
        }

        postMessage(_data: any) {
            Promise.resolve().then(() => {
                if (!this.onmessage) return;

                if (this.url.includes('worker.ts')) {
                    this.onmessage({
                        data: {
                            type: 'SUCCESS',
                            payload: {
                                history: [
                                    {
                                        stepNumber: 1,
                                        type: 'RESOLUTION',
                                        message: {
                                            key: 'engine.resolvedOn',
                                            params: { literal: 'A' }
                                        },
                                        poolBefore: [],
                                        removedClauses: [],
                                        parent1: {
                                            id: 'c1',
                                            literals: [{ name: 'A', polarity: true }],
                                            removed: false,
                                            isNegatedConclusion: false
                                        },
                                        parent2: {
                                            id: 'c2',
                                            literals: [{ name: 'A', polarity: false }],
                                            removed: false,
                                            isNegatedConclusion: false
                                        },
                                        resolvent: {
                                            id: 'res1',
                                            literals: [],
                                            removed: false,
                                            isNegatedConclusion: false
                                        }
                                    }
                                ],
                                finalPool: [{ id: 'empty', literals: [], removed: false, isNegatedConclusion: false }]
                            }
                        }
                    });
                }
                else if (this.url.includes('modelWorker.ts')) {
                    this.onmessage({
                        data: {
                            type: 'SUCCESS',
                            payload: [{ 'A': 1, 'B': 0 }]
                        }
                    });
                }
            });
        }
        terminate() {}
    });
});

afterAll(() => {
    vi.unstubAllGlobals();
});

it('should navigate between steps when clicking Next and Prev', async () => {
    const user = userEvent.setup();

    render(<ProofTimeline initialClauses={[]} onBack={vi.fn()} />);

    expect(screen.getByText('Step 1')).toBeInTheDocument();

    const nextBtn = screen.getByTestId('next-step-btn');
    await user.click(nextBtn);

    expect(screen.getByText('Step 2')).toBeInTheDocument();
});