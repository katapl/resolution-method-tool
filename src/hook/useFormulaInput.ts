import { useState, useRef, useEffect, useCallback } from 'react';
import { parseFormulaToClauses } from '../engine/parser';
import { validateFormula } from "../engine/validator";
import type { Clause } from "../engine/types.ts";
import { useTranslation } from 'react-i18next';
import { useLocalStorage } from './useLocalStorage';

interface UseFormulaInputProps {
    onSolve: (clauses: Clause[]) => void;
    onPractice: (clauses: Clause[]) => void;
    disabled?: boolean;
    injectedFormula?: { text: string, time: number } | null;
}

export function useFormulaInput(
    { onSolve, onPractice, disabled, injectedFormula }: UseFormulaInputProps,
    i18n: any
) {
    const [inputValue, setInputValue] = useLocalStorage<string>('prover_input_text', '');
    const [savedLang, setSavedLang] = useLocalStorage<string>('prover_language', 'en');
    const [errorMsg, setErrorMsg] = useState<{
        key: string;
        params?: Record<string, string | number>;
    } | null>(null);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const hasInteractedRef = useRef(false);

    const handleFocus = () => {
        hasInteractedRef.current = true;
    };

    useEffect(() => {
        if (injectedFormula) {
            setInputValue(injectedFormula.text);
            setErrorMsg(null);
        }
    }, [injectedFormula, setInputValue]);

    useEffect(() => {
        if (i18n.language !== savedLang) {
            i18n.changeLanguage(savedLang);
        }
    }, [savedLang, i18n]);

    const scrollToCanvas = () => {
        setTimeout(() => {
            const canvasArea = document.getElementById('canvas-container');
            if (canvasArea) {
                canvasArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            window.requestAnimationFrame(() => {
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight + 2}px`;
            });
        }
    }, []);

    // // --- 4. Validation Engine ---
    // const validateInput = useCallback((rawValue: string) => {
    //     const value = rawValue.replace(/[()]/g, '');
    //     if (!value.trim()) {
    //         setErrorMsg(null);
    //         return;
    //     }
    //
    //     const invalidCharMatch = value.match(/[^a-zA-Z\s~,|=\!¬∨⊢\-\^∧\+&]/);
    //     if (invalidCharMatch) {
    //         setErrorMsg({ key: 'input.errInvalidChar', params: { char: invalidCharMatch[0] } });
    //         return;
    //     }
    //
    //     const entailmentRegex = /\|=|\|-|⊢/g;
    //     const entailmentMatches = value.match(entailmentRegex);
    //
    //     if (entailmentMatches && entailmentMatches.length > 1) {
    //         setErrorMsg({ key: 'input.errMultipleEntailment' });
    //         return;
    //     }
    //
    //     const stringWithoutEntailments = value.replace(entailmentRegex, '');
    //     if (stringWithoutEntailments.includes('|') || stringWithoutEntailments.includes('=')) {
    //         setErrorMsg({ key: 'input.errInvalidEquals' });
    //         return;
    //     }
    //
    //     if (entailmentMatches && entailmentMatches.length === 1) {
    //         const parts = value.split(entailmentRegex);
    //         const rightSide = parts[1] || '';
    //
    //         const rightClauses = rightSide.split(/\s*,\s*|\s*\^\s*|\s*∧\s*|\s*&\s*/)
    //             .filter(c => c.trim().length > 0);
    //
    //         if (rightClauses.length === 0) {
    //             setErrorMsg({ key: 'input.errMissingConclusion' });
    //             return;
    //         }
    //
    //         if (rightClauses.length > 1) {
    //             setErrorMsg({ key: 'input.errMultipleConclusions' });
    //             return;
    //         }
    //     }
    //
    //     const hasOperatorSymbol = /[~,!¬∨^∧+&,|⊢=\-]/.test(value);
    //     const hasTextOr = /\s+v\s+/i.test(value);
    //
    //     if (!hasOperatorSymbol && !hasTextOr) {
    //         setErrorMsg({ key: 'input.errNotFormula' });
    //         return;
    //     }
    //
    //     const clauses = value.split(/\s*,\s*|\s*\^\s*|\s*∧\s*|\s*&\s*|\|=|⊢|\|-/)
    //         .filter(c => c.trim().length > 0);
    //
    //     if (clauses.length < 2) {
    //         setErrorMsg({ key: 'input.errNeedTwoClauses' });
    //         return;
    //     }
    //
    //     const invalidClause = clauses.find(c => {
    //         const vars = c.match(/[a-zA-Z]+/g)?.filter(v => v.toLowerCase() !== 'v') || [];
    //         return vars.length === 0;
    //     });
    //
    //     if (invalidClause) {
    //         setErrorMsg({ key: 'input.errNotFormula' });
    //         return;
    //     }
    //
    //     if (clauses.length > 30) {
    //         setErrorMsg({ key: 'input.errMaxClauses', params: { current: clauses.length, max: 30 } });
    //         return;
    //     }
    //
    //     const missingOperatorRegex = /[a-uw-zA-UW-Z]\s+[\~!¬]*[a-uw-zA-UW-Z]/;
    //     if (missingOperatorRegex.test(value)) {
    //         setErrorMsg({ key: 'input.errMissingOperator' });
    //         return;
    //     }
    //
    //     const trailingNegationRegex = /[~!¬](?!\s*[~!¬]*\s*[a-uw-zA-UW-Z])/;
    //     if (trailingNegationRegex.test(value)) {
    //         setErrorMsg({ key: 'input.errTrailingNegation' });
    //         return;
    //     }
    //
    //     const allVars = value.match(/[a-zA-Z]+/g)?.filter(v => v.toLowerCase() !== 'v') || [];
    //
    //     const multiCharVar = allVars.find(v => v.length > 1);
    //     if (multiCharVar) {
    //         setErrorMsg({ key: 'input.errMultiChar', params: { literal: multiCharVar } });
    //         return;
    //     }
    //
    //     const uniqueVars = new Set(allVars);
    //     if (uniqueVars.size > 26) {
    //         setErrorMsg({ key: 'input.errMaxVariables', params: { current: uniqueVars.size, max: 26 } });
    //         return;
    //     }
    //
    //     setErrorMsg(null);
    // }, []);

    useEffect(() => {
        const validationResult = validateFormula(inputValue);
        setErrorMsg(validationResult);

        adjustHeight();
    }, [inputValue, adjustHeight]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value);
    };

    const insertSymbol = (symbol: string) => {
        const textarea = textareaRef.current;

        if (textarea) {
            const startPos = hasInteractedRef.current ? textarea.selectionStart : inputValue.length;
            const endPos = hasInteractedRef.current ? textarea.selectionEnd : inputValue.length;

            const newValue =
                inputValue.substring(0, startPos) +
                symbol +
                inputValue.substring(endPos);

            setInputValue(newValue);
            hasInteractedRef.current = true;

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(startPos + symbol.length, startPos + symbol.length);
            }, 0);
        } else {
            setInputValue(prev => prev + symbol);
        }
    };

    const handleSolve = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        localStorage.setItem('prover_timeline_step', '1');
        if (errorMsg) return;

        try {
            const clauses = parseFormulaToClauses(inputValue);
            onSolve(clauses);
            scrollToCanvas();
        } catch (error: any) {
            setErrorMsg({ key: 'input.errParse', params: { msg: error.message } });
        }
    };

    const handlePractice = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        localStorage.setItem('prover_timeline_step', '1');
        if (errorMsg) return;

        try {
            const clauses = parseFormulaToClauses(inputValue);
            onPractice(clauses);
            scrollToCanvas();
        } catch (error: any) {
            setErrorMsg({ key: 'input.errParse', params: { msg: error.message } });
        }
    };

    const handleLanguageSelect = (lang: 'en' | 'cs') => {
        if (i18n.language !== lang) {
            i18n.changeLanguage(lang);
            setSavedLang(lang);
        }
    };

    const isActionDisabled = disabled || !inputValue.trim() || !!errorMsg;

    return {
        inputValue,
        errorMsg,
        textareaRef,
        hasInteractedRef,
        isActionDisabled,
        handleChange,
        handleFocus,
        insertSymbol,
        handleSolve,
        handlePractice,
        handleLanguageSelect
    };
}