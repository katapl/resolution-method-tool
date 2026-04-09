import { useTranslation } from 'react-i18next';

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
        <div style={{
            background: '#fff',
            padding: '2rem',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
        }}>
            <h2 style={{margin: 0, color: '#333'}}>
                {t(titleKey)}
            </h2>
            <p style={{margin: 0, fontSize: '1.1rem', color: '#333'}}>
                {t(messageKey)}
            </p>
        </div>

    );
}