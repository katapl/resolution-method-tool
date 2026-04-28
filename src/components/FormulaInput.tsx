import { useTranslation } from 'react-i18next';
import type { Clause } from "../engine/types.ts";
import Button from './button/Button';
import styles from './FormulaInput.module.css';
import { useFormulaInput } from '../hook/useFormulaInput';
import MessageFormatter from '../utils/MessageFormatter';

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
                    <MessageFormatter
                        // @ts-ignore - ignorování TypeScriptu pro dynamické parametry i18n
                        text={errorMsg ? t(errorMsg.key, errorMsg.params) : '\u00A0'}
                        highlightClass={styles.errorHighlight}
                    />
                    {/*{errorMsg ? t(errorMsg.key, errorMsg.params) : '\u00A0'}*/}
                </span>
            </div>
        </div>
    );
}