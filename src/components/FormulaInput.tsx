import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { parseFormulaToClauses } from '../engine/parser';
import type { Clause } from "../engine/types.ts";
import { useLocalStorage } from '../hook/useLocalStorage';
import Button from './button/Button';
import styles from './FormulaInput.module.css';
import { useFormulaInput } from '../hook/useFormulaInput';

interface FormulaInputProps {
    onSolve: (clauses: Clause[]) => void;
    onPractice: (clauses: Clause[]) => void;
    onReset: () => void;
    disabled?: boolean;
    injectedFormula?: { text: string, time: number } | null;
}

export default function FormulaInput(props: FormulaInputProps) {
    const { t, i18n } = useTranslation();

    const {
        inputValue,
        errorMsg,
        textareaRef,
        isActionDisabled,
        handleChange,
        insertSymbol,
        handleSolve,
        handleFocus,
        handlePractice,
        handleLanguageSelect
    } = useFormulaInput(props, i18n);

    let textAreaClass = styles.textarea;
    if (errorMsg) textAreaClass += ` ${styles.textareaError}`;
    if (props.disabled) textAreaClass += ` ${styles.textareaDisabled}`;

    // const [inputValue, setInputValue] = useLocalStorage<string>('prover_input_text', '');
    // const [errorMsg, setErrorMsg] = useState<{
    //     key: string;
    //     params?: Record<string, string | number>;
    // } | null>(null);
    // const textareaRef = useRef<HTMLTextAreaElement>(null);
    // const [savedLang, setSavedLang] = useLocalStorage<string>('prover_language', 'en');
    //
    // const hasInteractedRef = useRef(false);

    // useEffect(() => {
    //     if (injectedFormula) {
    //         setInputValue(injectedFormula.text);
    //         setErrorMsg(null);
    //     }
    // }, [injectedFormula]);
    //
    // const scrollToCanvas = () => {
    //     setTimeout(() => {
    //         const canvasArea = document.getElementById('canvas-container');
    //         if (canvasArea) {
    //             canvasArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    //         }
    //     }, 100);
    // };
    //
    // const insertSymbol = (symbol: string) => {
    //     const textarea = textareaRef.current;
    //
    //     if (textarea) {
    //         const startPos = hasInteractedRef.current ? textarea.selectionStart : inputValue.length;
    //         const endPos = hasInteractedRef.current ? textarea.selectionEnd : inputValue.length;
    //
    //         const newValue =
    //             inputValue.substring(0, startPos) +
    //             symbol +
    //             inputValue.substring(endPos);
    //
    //         setInputValue(newValue);
    //         hasInteractedRef.current = true;
    //
    //         setTimeout(() => {
    //             // adjustHeight();
    //             textarea.focus();
    //             textarea.setSelectionRange(startPos + symbol.length, startPos + symbol.length);
    //         }, 0);
    //     } else {
    //         setInputValue(prev => prev + symbol);
    //     }
    // };
    //
    // const adjustHeight = useCallback(() => {
    //     const textarea = textareaRef.current;
    //     if (textarea) {
    //         window.requestAnimationFrame(() => {
    //             textarea.style.height = 'auto';
    //             textarea.style.height = `${textarea.scrollHeight + 2}px`;
    //         });
    //     }
    // }, []);
    //
    // useEffect(() => {
    //     adjustHeight();
    // }, [inputValue, adjustHeight]);
    //
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
    //
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
    //
    // useEffect(() => {
    //     if (i18n.language !== savedLang) {
    //         i18n.changeLanguage(savedLang);
    //     }
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, [savedLang]);
    //
    // useEffect(() => {
    //     validateInput(inputValue);
    //     adjustHeight();
    //     // eslint-disable-next-line react-hooks/exhaustive-deps
    // }, []);
    //
    // const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    //     const val = e.target.value;
    //     setInputValue(val);
    //     // adjustHeight();
    // };
    //
    // const handleSolve = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     if (!inputValue.trim()) return;
    //
    //     localStorage.setItem('prover_timeline_step', '1');
    //     if (errorMsg) return;
    //
    //     try {
    //         const clauses = parseFormulaToClauses(inputValue);
    //         onSolve(clauses);
    //     } catch (error: any) {
    //         setErrorMsg({ key: 'input.errParse', params: { msg: error.message } });
    //     }
    //     scrollToCanvas();
    // };
    //
    // const handlePractice = (e: React.FormEvent) => {
    //     e.preventDefault();
    //     if (!inputValue.trim()) return;
    //
    //     localStorage.setItem('prover_timeline_step', '1');
    //     if (errorMsg) return;
    //
    //     try {
    //         const clauses = parseFormulaToClauses(inputValue);
    //         onPractice(clauses);
    //     } catch (error: any) {
    //         setErrorMsg({ key: 'input.errParse', params: { msg: error.message } });
    //     }
    //     scrollToCanvas();
    // };
    //
    // useEffect(() => {
    //     validateInput(inputValue);
    // }, [inputValue, validateInput]);
    //
    // const handleLanguageSelect = (lang: 'en' | 'cs') => {
    //     if (i18n.language !== lang) {
    //         i18n.changeLanguage(lang);
    //         setSavedLang(lang);
    //     }
    // };
    //
    // const isActionDisabled = disabled || !inputValue.trim() || !!errorMsg;
    //
    // let textAreaClass = styles.textarea;
    // if (errorMsg) textAreaClass += ` ${styles.textareaError}`;
    // if (disabled) textAreaClass += ` ${styles.textareaDisabled}`;

    return (
        <div className={styles.container}>
            <div className={styles.inputGroup}>

                <div className={styles.header}>
                    <Button onClick={props.onReset} className={styles.titleBtn}>
                        {t('input.title')}
                    </Button>

                    <div className={styles.langSwitch}>
                        <div
                            onClick={() => handleLanguageSelect('en')}
                            className={`${styles.langOption} ${i18n.language === 'en' ? styles.langActive : styles.langInactive}`}
                        >
                            EN
                        </div>
                        <div
                            onClick={() => handleLanguageSelect('cs')}
                            className={`${styles.langOption} ${i18n.language === 'cs' ? styles.langActive : styles.langInactive}`}
                        >
                            CZ
                        </div>
                    </div>
                </div>

                <div className={styles.label}>
                    {t('input.enterFormula')}
                </div>

                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onFocus={handleFocus}
                    onChange={handleChange}
                    disabled={props.disabled}
                    rows={1}
                    className={textAreaClass}
                />
            </div>

            <div className={styles.toolbar}>
                <div className={styles.symbolGroup}>
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
                            className={styles.symbolBtn}
                        >
                            {item.symbol}
                        </Button>
                    ))}
                </div>

                <div className={styles.actionGroup}>
                    <Button onClick={handleSolve} disabled={isActionDisabled}>
                        {t('input.solve')}
                    </Button>
                    <Button onClick={handlePractice} disabled={isActionDisabled}>
                        {t('input.practice')}
                    </Button>
                </div>
            </div>

            <div className={styles.errorContainer}>
                <span className={styles.errorText}>
                    {errorMsg ? t(errorMsg.key, errorMsg.params) : '\u00A0'}
                </span>
            </div>
        </div>
    );
}