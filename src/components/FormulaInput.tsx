import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { parseFormulaToClauses } from '../engine/parser';
import type {Clause} from "../engine/types.ts";
import { useLocalStorage } from '../hook/useLocalStorage';
import Button from './Button';

interface FormulaInputProps {
    onSolve: (clauses: Clause[]) => void;
    onPractice: (clauses: Clause[]) => void;
    onReset: () => void;
    disabled?: boolean;
}

export default function FormulaInput({ onSolve, onPractice, onReset, disabled }: FormulaInputProps) {
    const { t, i18n } = useTranslation();
    const [inputValue, setInputValue] = useLocalStorage<string>('prover_input_text', '');
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [savedLang, setSavedLang] = useLocalStorage<string>('prover_language', 'en');

    const adjustHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            window.requestAnimationFrame(() => {
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            });
        }
    }, []);

    const validateInput = useCallback((value: string) => {
        if (!value.trim()) {
            setErrorMsg(null);
            return;
        }

        const invalidCharMatch = value.match(/[^a-zA-Z0-9\s~,|=]/);
        if (invalidCharMatch) {
            setErrorMsg(`Invalid character: "${invalidCharMatch[0]}". Allowed: letters, numbers, ~, v, ,, |, =`);
            return;
        }

        if (value.includes('=') && !value.includes('|=')) {
            setErrorMsg("The '=' character can only be used as part of the entailment operator '|='.");
            return;
        }

        const hasLogicalOperator = /[~,|]/.test(value) || /\s+v\s+/i.test(value);
        if (!hasLogicalOperator) {
            setErrorMsg("Input must be a formula.");
            return;
        }

        const clauseCount = value.split(/,|\|=/).filter(c => c.trim().length > 0).length;
        if (clauseCount < 2) {
            setErrorMsg("Please enter at least two clauses to perform resolution");
            return;
        }

        setErrorMsg(null);
    }, []);

    useEffect(() => {
        if (i18n.language !== savedLang) {
            i18n.changeLanguage(savedLang);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [savedLang]);

    useEffect(() => {
        validateInput(inputValue);
        adjustHeight();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setInputValue(val);
        validateInput(val);
        adjustHeight();
    };

    const handleSolve = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const parsedClauses = parseFormulaToClauses(inputValue);
        onSolve(parsedClauses);
    };

    const handlePractice = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const parsedClauses = parseFormulaToClauses(inputValue);
        onPractice(parsedClauses);
    };

    const handleReset = (e: React.FormEvent) => {
        onReset();
    }

    const toggleLanguage = () => {
        const newLang = i18n.language === 'en' ? 'cs' : 'en';
        i18n.changeLanguage(newLang);
        setSavedLang(newLang);
    };

    const isActionDisabled = disabled || !inputValue.trim() || !!errorMsg;
    const isResetDisabled = disabled || (!inputValue.trim() && !errorMsg);

    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', maxWidth: '1000px', margin: '0 auto' }}>

            {/*MOVE*/}
            <Button onClick={toggleLanguage} style={{ alignSelf: 'flex-end', border: 'none' }}>
                {i18n.language === 'en' ? 'CS' : 'EN'}
            </Button>

            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'left', gap: '1rem'}}>
                <div style={{ fontSize: '1.2rem', whiteSpace: 'nowrap' }}>
                    {t('input.enterFormula')}
                </div>
                    <textarea
                        ref={textareaRef}
                        value={inputValue}
                        // placeholder="~p v t, k v s v r"
                        onChange={handleChange}
                        disabled={disabled}
                        rows={1}
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            lineHeight: '1.5',
                            fontSize: '1rem',
                            fontFamily: 'monospace',
                            borderRadius: '8px',
                            border: errorMsg ? '2px solid #f44336' : '2px solid #ccc',
                            outline: 'none',
                            resize: 'none',
                            overflow: 'hidden',
                            transition: 'border-color 0.2s',
                            boxShadow: errorMsg ? '0 0 0 3px rgba(244, 67, 54, 0.1)' : 'none',
                            background: disabled ? '#f5f5f5' : '#fff',
                            color:'black',
                            backgroundColor: '#FFFFFF',
                            ...({ fieldSizing: 'content' } as any)

                        }}
                    />
            </div>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', minHeight: '2.5rem'}}>
                <div style={{ padding: '0 0.5rem', minHeight: '2rem' }}>
                    <span style={{
                        color: errorMsg ? '#f44336' : '#666',
                        fontSize: '0.95rem',
                        fontWeight: errorMsg ? 'bold' : 'normal'
                    }}>
                        {/*{errorMsg || "Use '~' for NOT, 'v' for OR, and ',' to separate clauses."}*/}
                        {errorMsg}
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>

                    <Button onClick={handleSolve} disabled={isActionDisabled}>
                        {t('buttons.solve')}
                    </Button>

                    <Button onClick={handlePractice} disabled={isActionDisabled}>
                        {t('buttons.practice')}
                    </Button>

                    <Button onClick={handleReset} disabled={isResetDisabled}>
                        {t('buttons.reset')}
                    </Button>
            </div>
            </div>
        </div>
    );
}