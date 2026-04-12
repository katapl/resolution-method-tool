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
    const [errorMsg, setErrorMsg] = useState<{
        key: string;
        params?: Record<string, string | number>;
    } | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [savedLang, setSavedLang] = useLocalStorage<string>('prover_language', 'en');

    const hasInteractedRef = useRef(false);

    const scrollToCanvas = () => {
        setTimeout(() => {
            const canvasArea = document.getElementById('canvas-container');
            if (canvasArea) {
                canvasArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
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
                adjustHeight();
                textarea.focus();
                textarea.setSelectionRange(startPos + symbol.length, startPos + symbol.length);
            }, 0);
        } else {
            setInputValue(prev => prev + symbol);
        }
    };

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

        const invalidCharMatch = value.match(/[^a-zA-Z\s~,|=\!¬∨⊢\-\^∧\+&]/);
        if (invalidCharMatch) {
            setErrorMsg({ key: 'input.errInvalidChar', params: { char: invalidCharMatch[0] } });
            return;
        }

        const entailmentRegex = /\|=|\|-|⊢/g;
        const entailmentMatches = value.match(entailmentRegex);

        if (entailmentMatches && entailmentMatches.length > 1) {
            setErrorMsg({ key: 'input.errMultipleEntailment' });
            return;
        }

        const stringWithoutEntailments = value.replace(entailmentRegex, '');
        if (stringWithoutEntailments.includes('|') || stringWithoutEntailments
            .includes('=')) {
            setErrorMsg({ key: 'input.errInvalidEquals' });
            return;
        }

        if (entailmentMatches && entailmentMatches.length === 1) {
            const parts = value.split(entailmentRegex);
            const rightSide = parts[1] || '';

            const rightClauses = rightSide.split(/\s*,\s*|\s*\^\s*|\s*∧\s*|\s*&\s*/)
                .filter(c => c.trim().length > 0);

            if (rightClauses.length === 0 || rightClauses.length > 1) {
                setErrorMsg({ key: 'input.errMissingConclusion' });
                return;
            }

            // if (rightClauses.length > 1) {
            //     setErrorMsg({ key: 'input.errMultipleConclusions' });
            //     return;
            // }
        }

        const hasOperatorSymbol = /[~,!¬∨^∧+&,|⊢=\-]/.test(value);
        const hasTextOr = /\s+v\s+/i.test(value);

        if (!hasOperatorSymbol && !hasTextOr) {
            setErrorMsg({ key: 'input.errNotFormula' });
            return;
        }

        const clauses = value.split(/\s*,\s*|\s*\^\s*|\s*∧\s*|\s*&\s*|\|=|⊢|\|-/)
            .filter(c => c.trim().length > 0);
        if (clauses.length < 2) {
            setErrorMsg({ key: 'input.errNeedTwoClauses' });
            return;
        }

        const invalidClause = clauses.find(c => {
            const vars = c.match(/[a-zA-Z]+/g)?.filter(v => v.toLowerCase() !== 'v') || [];
            return vars.length === 0;
        });

        if (invalidClause) {
            setErrorMsg({ key: 'input.errNotFormula' });
            return;
        }

        if (clauses.length > 30) {
            setErrorMsg({ key: 'input.errMaxClauses', params: { current: clauses.length, max: 30 } });
            return;
        }

        const uniqueVars = new Set(value.match(/[a-zA-Z0-9]+/g)?.filter(v => v.toLowerCase() !== 'v') || []);
        if (uniqueVars.size > 26) {
            setErrorMsg({ key: 'input.errMaxVariables', params: { current: uniqueVars.size, max: 26 } });
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
        // validateInput(val);
        adjustHeight();
    };

    const handleSolve = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        localStorage.setItem('prover_timeline_step', '1');
        const parsedClauses = parseFormulaToClauses(inputValue);
        onSolve(parsedClauses);
        scrollToCanvas();
    };

    const handlePractice = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        localStorage.setItem('prover_timeline_step', '1');
        const parsedClauses = parseFormulaToClauses(inputValue);
        onPractice(parsedClauses);
        scrollToCanvas();
    };

    useEffect(() => {
        validateInput(inputValue);
    }, [inputValue, validateInput]);

    const handleLanguageSelect = (lang: 'en' | 'cs') => {
        if (i18n.language !== lang) {
            i18n.changeLanguage(lang);
            setSavedLang(lang);
        }
    };

    const isActionDisabled = disabled || !inputValue.trim() || !!errorMsg;

    return (
        <div style={{ paddingTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'left', gap: '0.5rem'}}>

                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <Button
                        onClick={onReset}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            padding: ' 0.4rem 0 0 0',
                            color: '#4da392'
                    }}>
                        {t('input.title')}
                    </Button>

                    <div style={{
                        alignSelf: 'flex-end',
                        display: 'flex',
                        background: '#e0e0e0',
                        borderRadius: '12px',
                        cursor: 'pointer',
                    }}>
                        <div
                            onClick={() => handleLanguageSelect('en')}
                            style={{
                                padding: '0.2rem 0.8rem',
                                borderRadius: '12px',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease',
                                background: i18n.language === 'en' ? '#fff' : 'transparent',
                                color: i18n.language === 'en' ? '#333' : '#888',
                            }}
                        >
                            EN
                        </div>
                        <div
                            onClick={() => handleLanguageSelect('cs')}
                            style={{
                                padding: '0.2rem 0.8rem',
                                borderRadius: '12px',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease',
                                background: i18n.language === 'cs' ? '#fff' : 'transparent',
                                color: i18n.language === 'cs' ? '#333' : '#888',
                            }}
                        >
                            CZ
                        </div>
                    </div>
                </div>
                <div style={{ fontSize: '1rem', whiteSpace: 'nowrap', color: '#000000', padding: '0.5rem 0rem 0rem 0' }}>
                    {t('input.enterFormula')}
                </div>
                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onFocus={() => { hasInteractedRef.current = true; }}
                    // placeholder="~p v t, k v s v r"
                    onChange={handleChange}
                    disabled={disabled}
                    rows={1}
                    style={{
                        width: '100%',
                        padding: '0.5rem 1rem',
                        lineHeight: '1.5',
                        fontSize: '1rem',
                        fontFamily: 'monospace',
                        borderRadius: '12px',
                        border: errorMsg ? '1px solid #f44336' : '1px solid #ccc',
                        outline: 'none',
                        resize: 'none',
                        resize: 'none',
                        overflowY: 'auto',
                        maxHeight: '35vh',
                        transition: 'border-color 0.2s',
                        background: disabled ? '#f5f5f5' : '#fff',
                        color:'black',
                        backgroundColor: '#FFFFFF',
                        ...({ fieldSizing: 'content' } as any)

                    }}
                />
            </div>

            <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '1rem',
                minHeight: '2.5rem'
            }}>
                    <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        flexWrap: 'wrap'
                    }}>
                        {[
                            { symbol: '∧', label: 'AND' },
                            { symbol: '∨', label: 'OR' },
                            { symbol: '¬', label: 'NOT' },
                            { symbol: '⊢', label: 'ENTAILS' }
                        ].map((item) => (
                            <Button
                                key={item.symbol}
                                type="button"
                                onClick={() => insertSymbol(item.symbol)}
                                onMouseDown={(e) => e.preventDefault()}
                                title={item.label}
                                style={{
                                    padding: ' 0 0.5rem 0 0.5rem'
                                }}
                            >
                                {item.symbol}
                            </Button>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>
                        <Button onClick={handleSolve} disabled={isActionDisabled}>
                            {t('buttons.solve')}
                        </Button>
                        <Button onClick={handlePractice} disabled={isActionDisabled}>
                            {t('buttons.practice')}
                        </Button>
                    </div>
            </div>
            <div style={{ padding: '0 0.5rem', height: '3rem' }}>
                    <span style={{
                        color: '#f44336',
                        fontSize: '0.95rem',
                        fontWeight: 'medium',
                        fontStyle: 'italic',
                    }}>
                        {errorMsg ? t(errorMsg.key, errorMsg.params) : '\u00A0'}
                    </span>
            </div>
        </div>
    );
}