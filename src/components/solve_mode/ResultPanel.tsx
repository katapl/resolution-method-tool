import { useTranslation } from 'react-i18next';
import styles from './ResultPanel.module.css';

interface ResultPanelProps {
    hasEmptyClause: boolean;
    isEmptySet: boolean;
    hasConclusion: boolean;
}

export default function ResultPanel({ hasEmptyClause, isEmptySet, hasConclusion }: ResultPanelProps) {
    const {t} = useTranslation();

    let titleKey = "";
    let messageKey = "";
    let resultColor = "";

    if (hasEmptyClause) {
        titleKey = "results.titleContradiction";
        messageKey = hasConclusion ? "results.msgContradictionEntailment" : "results.msgContradictionSatisfiable";
    } else if (isEmptySet) {
        titleKey = "results.titleEmptySet";
        messageKey = hasConclusion ? "results.msgEmptySetEntailment" : "results.msgEmptySetSatisfiable";
    }

    return (
        <div className={styles.panel}>
            <h3 className={styles.title}>
                {t(titleKey)}
            </h3>
            <p className={styles.message}>
                {t(messageKey)}
            </p>
        </div>

    );
}