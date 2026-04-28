// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFormulaInput } from '../../hook/useFormulaInput';

const mockI18n = { language: 'en' } as any;

const mockT = (key: string) => key;
const mockChangeLanguage = vi.fn();

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: mockT,
        i18n: { language: 'en', changeLanguage: mockChangeLanguage }
    })
}));

describe('useFormulaInput State Management', () => {
    const mockProps = {
        onSolve: vi.fn(),
        onPractice: vi.fn(),
        onReset: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should trigger errorMsg and prevent solving when given an invalid formula', () => {
        const { result } = renderHook(() => useFormulaInput(mockProps, mockI18n));

        act(() => {
            result.current.handleChange({ target: { value: 'A ∧ B $' } } as any);
        });

        act(() => {
            result.current.handleSolve();
        });

        expect(result.current.errorMsg).not.toBeNull();
        expect(result.current.isActionDisabled).toBe(true);
        expect(mockProps.onSolve).not.toHaveBeenCalled();
    });

    it('should wipe state and clear errors when the input is reset', () => {
        const { result } = renderHook(() => useFormulaInput(mockProps, mockI18n));

        act(() => {
            result.current.handleChange({ target: { value: 'A ∧ B' } } as any);
        });
        expect(result.current.inputValue).toBe('A ∧ B');

        act(() => {
            result.current.handleChange({ target: { value: '' } } as any);
        });

        expect(result.current.inputValue).toBe('');
        expect(result.current.errorMsg).toBeNull();
    });
});