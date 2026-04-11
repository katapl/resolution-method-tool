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

        const invalidCharMatch = value.match(/[^a-zA-Z0-9\s~,|=\!¬∨⊢\-\^∧\+&]/);
        if (invalidCharMatch) {
            setErrorMsg({ key: 'input.errInvalidChar', params: { char: invalidCharMatch[0] } });
            return;
        }

        const entailmentMatches = value.match(/\|=|⊢|\|-/g);
        if (entailmentMatches && entailmentMatches.length > 1) {
            setErrorMsg({ key: 'input.errMultipleEntailment' });
            return;
        }

        if (value.includes('=') && (!entailmentMatches || !entailmentMatches.includes('|='))) {
            setErrorMsg({ key: 'input.errInvalidEquals' });
            return;
        }

        const hasOperatorSymbol = /[~,!¬∨^∧+&,|⊢=\-]/.test(value);
        const hasTextOr = /\s+v\s+/i.test(value);

        if (!hasOperatorSymbol && !hasTextOr) {
            setErrorMsg({ key: 'input.errNotFormula' });
            return;
        }

        const clauses = value.split(/\s*,\s*|\s*\^\s*|\s*∧\s*|\s*&\s*|\|=|⊢|\|-/).filter(c => c.trim().length > 0);
        if (clauses.length < 2) {
            setErrorMsg({ key: 'input.errNeedTwoClauses' });
            return;
        }

        if (clauses.length > 30) {
            setErrorMsg({ key: 'input.errMaxClauses', params: { current: clauses.length, max: 30 } });
            return;
        }

        const uniqueVars = new Set(value.match(/[a-zA-Z0-9]+/g)?.filter(v => v.toLowerCase() !== 'v') || []);
        if (uniqueVars.size > 15) {
            setErrorMsg({ key: 'input.errMaxVariables', params: { current: uniqueVars.size, max: 15 } });
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

    const handleLanguageSelect = (lang: 'en' | 'cs') => {
        if (i18n.language !== lang) {
            i18n.changeLanguage(lang);
            setSavedLang(lang);
        }
    };

    const isActionDisabled = disabled || !inputValue.trim() || !!errorMsg;
    // const isResetDisabled = disabled || (!inputValue.trim() && !errorMsg);

    return (
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'left', gap: '0.5rem'}}>

                <div style={{display: 'flex', justifyContent: 'space-between'}}>
                    <h3>Learn Resolution</h3>
                    {/*<Button onClick={toggleLanguage} style={{ alignSelf: 'flex-end', border: 'none', height: '1.5rem', }}>*/}
                    {/*    {i18n.language === 'en' ? 'CS' : 'EN'}*/}
                    {/*</Button>*/}

                    {/*<div style={{display: 'flex'}}>*/}
                    {/*<Button onClick={handleReset} style={{ background: 'none', border: 'none', fontSize: '1rem', textDecoration: 'underline'}}>*/}
                    {/*    {t('buttons.reset')}*/}
                    {/*</Button>*/}

                    <div style={{
                        alignSelf: 'flex-end',
                        display: 'flex',
                        background: '#e0e0e0',
                        borderRadius: '20px',
                        // gap: '2px',
                        cursor: 'pointer',
                    }}>
                        <div
                            onClick={() => handleLanguageSelect('en')}
                            style={{
                                padding: '0.2rem 0.8rem',
                                borderRadius: '16px',
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
                                borderRadius: '16px',
                                fontSize: '0.9rem',
                                transition: 'all 0.2s ease',
                                background: i18n.language === 'cs' ? '#fff' : 'transparent',
                                color: i18n.language === 'cs' ? '#333' : '#888',
                            }}
                        >
                            CZ
                        </div>
                    </div>
                    {/*</div>*/}
                </div>
                <div style={{ fontSize: '1rem', whiteSpace: 'nowrap', color: '#000000', padding: '0.5rem 0rem 0rem 0' }}>
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
                        // boxShadow: errorMsg ? '0 0 0 3px rgba(244, 67, 54, 0.1)' : 'none',
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
                        color: '#f44336',
                        fontSize: '0.95rem',
                        fontWeight: 'medium'
                    }}>
                        {/*{errorMsg || "Use '~' for NOT, 'v' for OR, and ',' to separate clauses."}*/}
                        {errorMsg ? t(errorMsg.key, errorMsg.params) : ''}
                        {/*{t(errorMsg.key, errorMsg.params)}*/}
                    </span>
                </div>
                {/*<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end'}}>*/}
                    <div style={{ display: 'flex', gap: '1rem', flexShrink: 0 }}>

                        <Button onClick={handleSolve} disabled={isActionDisabled}>
                            {t('buttons.solve')}
                        </Button>

                        <Button onClick={handlePractice} disabled={isActionDisabled}>
                            {t('buttons.practice')}
                        </Button>
                    <Button onClick={handleReset} style={{ background: 'none', border: 'none', fontSize: '0.9rem', textDecoration: 'underline', padding: ' 0.4rem 0 0 0'}}>
                        {t('buttons.reset')}
                    </Button>
                    </div>
                {/*</div>*/}
            </div>
        </div>
    );
}