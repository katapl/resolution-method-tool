// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useProofEngine } from '../../hook/useProofEngine';

class MockWorker {
    postMessage = vi.fn();
    terminate = vi.fn();
    onmessage = null;
    onerror = null;
}

const mockT = (key: string) => key;
const mockChangeLanguage = vi.fn();

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: { language: 'en', changeLanguage: mockChangeLanguage }
    })
}));

vi.stubGlobal('Worker', MockWorker);

describe('useProofEngine State Management', () => {
    const mockSetVisibleStepCount = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should immediately enter the loading state (isSolving) when provided with clauses', () => {
        const mockClauses = [{ id: '1', literals: [{ name: 'A', polarity: true }] }];

        const { result } = renderHook(() =>
            useProofEngine(mockClauses as any, mockSetVisibleStepCount)
        );

        expect(result.current.isSolving).toBe(true);
        expect(result.current.workerError).toBeNull();
    });

    it('should wipe parsed clauses and timeline history when the input is cleared', () => {
        const initialClauses = [{ id: '1', literals: [{ name: 'A', polarity: true }] }];

        const { result, rerender } = renderHook(
            ({ clauses }) => useProofEngine(
                clauses as any, mockSetVisibleStepCount),
            { initialProps: { clauses: initialClauses } }
        );

        rerender({ clauses: [] });

        expect(result.current.fullHistory).toEqual([]);
        expect(result.current.totalSteps).toBe(0);
        expect(result.current.isSolving).toBe(false);
        expect(result.current.models).toBeNull();
    });
});