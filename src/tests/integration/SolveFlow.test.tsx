// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

import FormulaInput from '../../components/FormulaInput';
import ProofTimeline from '../../components/solve_mode/ProofTimeline';
import { useState } from 'react';
import type { Clause } from '../../engine/types';


const mockT = (key: string) => key;
const mockChangeLanguage = vi.fn();

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: { language: 'en', changeLanguage: mockChangeLanguage }
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

function AppMock() {
    const [clauses, setClauses] = useState<Clause[]>([]);
    return (
        <div>
            <FormulaInput
                onSolve={setClauses}
                onPractice={() => {}}
                onReset={() => {}}
            />
    {clauses.length > 0 && <ProofTimeline initialClauses={clauses} onBack={vi.fn()} />}
    </div>
    );
    }

    describe('Solve Mode User Flow', () => {

        it('should allow user to type a formula, click solve, and see the timeline', async () => {
            const user = userEvent.setup();
            render(<AppMock />);

            const input = screen.getByRole('textbox');
            await user.type(input, 'A v B |- A');

            const solveBtn = screen.getByText('input.solve');
            await user.click(solveBtn);

            await waitFor(() => {
                expect(screen.getByText('input.stepResult')).toBeInTheDocument();
            });
            
            expect(screen.getByText('engine.resolvedOn')).toBeInTheDocument();
        });
    });