import { useTranslation } from 'react-i18next';
import styles from './ResultPanel.module.css';
import { AlertCircle, Loader2 } from 'lucide-react';
import type { Assignment } from "../../engine/types"

interface ResultPanelProps {
    hasEmptyClause: boolean;
    // isEmptySet: boolean;
    hasConclusion: boolean;
    models?: Assignment[] | null;
    modelError?: string | null;
}

export default function ResultPanel({
        hasEmptyClause,
        // isEmptySet,
        hasConclusion,
        models = null,
        modelError
    }: ResultPanelProps) {
    const {t} = useTranslation();

    let titleKey = "";
    let messageKey = "";

    if (hasConclusion) {
        if (hasEmptyClause) {
            titleKey = "results.titleContradiction";
            messageKey = "results.msgContradictionEntailment"
        } else {
            titleKey = "results.titleEmptySet";
            messageKey = "results.msgEmptySetEntailment";
        }
    } else {
        if (hasEmptyClause) {
            titleKey = "results.titleContradiction";
            messageKey = "results.msgContradictionSatisfiable";
        } else {
            titleKey = "results.titleEmptySet";
            messageKey = "results.msgEmptySetSatisfiable";
        }
    }

    const variables = models && models.length > 0
        ? Object.keys(models[0]).sort()
        : [];

    return (
        <div>
        <div className={styles.panel}>
            <h3 className={styles.title}>
                {t(titleKey)}
            </h3>
            <p className={styles.message}>
                {t(messageKey)}
            </p>
        </div>

    {modelError && (
        <div className={styles.errorBox}>
            <AlertCircle size={20} />
            <p>{modelError}</p>
        </div>
    )}

    {!modelError && (!hasEmptyClause) && (
        <div className={styles.tableSection}>
            <h4 className={styles.tableTitle}>
                {hasConclusion
                    ? t('results.counterExamples')
                    : t('results.satisfyingAssignments')}
            </h4>

            {models === null ? (
                <div className={styles.loadingState}>
                    <Loader2 className={styles.spinner} size={20} />
                    <span>Calculating combinations...</span>
                </div>
            ) : models.length === 0 ? (
                <p className={styles.noModelsText}>No assignments found.</p>
            ) : (
                <div className={styles.tableWrapper}>
                    <table className={`${styles.truthTable} 
                                ${variables.length > 10 && variables.length <= 20 ? styles.dense : ''} 
                                ${variables.length > 20 ? styles.ultraDense : ''}
                            `}>
                        <thead>
                        <tr>
                            {variables.map(v => (
                                <th key={v}>{v}</th>
                            ))}
                            <th className={styles.resultColHeader}>
                                {hasConclusion ? "Conclusion" : "Formula"}
                            </th>
                        </tr>
                        </thead>
                        <tbody>
                        {models.map((model, idx) => (
                            <tr key={idx}>
                                {variables.map(v => {
                                    const val = model[v];
                                    return (
                                        <td key={v}>
                                            <div className={styles.cellContent}>
                                                {val ? "1" : "0"}
                                                {/*<span>{val ? 'T' : 'F'}</span>*/}
                                            </div>
                                        </td>
                                    );
                                })}
                                <td className={`${styles.resultCell}`}>
                                    <div className={styles.cellContent}>
                                        {hasConclusion ? "0" : "1"}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )}
</div>
    );
}