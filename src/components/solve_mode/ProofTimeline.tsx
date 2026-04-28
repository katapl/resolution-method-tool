import { useMemo, useEffect, useState } from 'react';
import StepCanvas from './StepCanvas';
import type { Clause } from "../../engine/types.ts";
import { useTranslation } from 'react-i18next';
import ResultPanel from './ResultPanel';
import Button from "../button/Button";
import { getPaginationRange } from "../../utils/pagination"
import styles from './ProofTimeline.module.css';
import { useLocalStorage } from '../../hook/useLocalStorage';
import { useProofEngine } from '../../hook/useProofEngine';
import { MoreHorizontal, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface ProofTimelineProps {
    initialClauses: Clause[];
}

export default function ProofTimeline({ initialClauses }: ProofTimelineProps) {
    const { t } = useTranslation();

    const [visibleStepCount, setVisibleStepCount] = useLocalStorage<number>('prover_timeline_step', 1);
    const [isResultExpanded, setIsResultExpanded] = useState<boolean>(false);
    const [showLoadingUi, setShowLoadingUi] = useState(false);

    const {
        isSolving,
        workerError,
        fullHistory,
        totalSteps,
        hasEmptyClause,
        hasConclusion,
        isEmptySet,
        models,
        modelError
    } = useProofEngine(initialClauses, setVisibleStepCount);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isSolving) {
            timer = setTimeout(() => setShowLoadingUi(true), 250);
        } else {
            setShowLoadingUi(false);
        }
        return () => clearTimeout(timer);
    }, [isSolving]);

    const handleNext = () => setVisibleStepCount(prev => Math.min(prev + 1, totalSteps));
    const handlePrev = () => setVisibleStepCount(prev => Math.max(prev - 1, 1));
    const handleJumpTo = (step: number) => setVisibleStepCount(step);

    const paginationRange = useMemo(() => {
        return getPaginationRange(visibleStepCount, totalSteps);
    }, [visibleStepCount, totalSteps]);

    if (isSolving) {
        if (!showLoadingUi) {
            return <div className={styles.placeholder} />;
        }
        return (
            <div className={styles.loadingContainer}>
                <h2 className={styles.pulseText}>
                    Engine is crunching the logic...
                </h2>
                <p>This may take a few seconds for complex formulas.</p>
            </div>
        );
    }

    if (workerError) {
        return (
            <div className={styles.errorContainer}>
                <div className={styles.errorBox}>
                    <h2 className={styles.errorTitle}>Formula Too Complex</h2>
                    <p className={styles.errorMessage}>{workerError}</p>
                    <p className={styles.errorHint}>
                        Try simplifying your input or using fewer variables.
                    </p>
                </div>
            </div>
        );
    }

    if (!fullHistory || fullHistory.length === 0) return null;

    const currentStep = fullHistory[visibleStepCount - 1];
    const isLastStep = visibleStepCount === totalSteps;

    const baseMessage = typeof currentStep.message === 'string'
        ? currentStep.message
        // @ts-ignore - dynamic translation params
        : t(currentStep.message.key, currentStep.message.params);

    return (
        <div className={styles.mainContainer}>
            <div className={styles.canvasWrapper}>
                <div className={styles.canvasHeader}>
                    <div className={styles.resultDropdown}>
                        <h3 className={styles.stepTitle}>
                            {/*{t('input.step', { count: currentStep.stepNumber })}*/}
                            {isLastStep
                                ? t('input.stepResult', { count: currentStep.stepNumber })
                                : t('input.step', { count: currentStep.stepNumber })
                            }
                        </h3>
                        {isLastStep && (
                        <p><i>{t('results.moreAboutResult')}</i></p>
                            )}
                    </div>
                    <div className={styles.resultRow}>
                    <p className={styles.stepMessage}>
                        {baseMessage}
                    </p>
                    {isLastStep && (
                            <Button
                                data-cy="result-expand-btn"
                                className={styles.resultToggleBtn}
                                onClick={() => setIsResultExpanded(!isResultExpanded)}
                            >
                                {isResultExpanded ? (
                                    <ChevronUp size={28} />
                                ) : (
                                    <ChevronDown size={28} />
                                )}
                            </Button>
                    )}
                    </div>
                </div>

                <div className={styles.canvasBody}>
                    <StepCanvas
                        step={currentStep}
                        key={currentStep.stepNumber}
                    />

                    {isLastStep && (
                        <div className={`${styles.resultOverlay} ${isResultExpanded ? styles.expanded : ''}`}>
                            <ResultPanel
                                hasEmptyClause={hasEmptyClause}
                                isEmptySet={isEmptySet}
                                hasConclusion={hasConclusion}
                                models={models}
                                modelError={modelError}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className={styles.pagination}>
                <Button onClick={handlePrev} disabled={visibleStepCount === 1} className={styles.icon}>
                    <ChevronLeft size={28} />
                </Button>

                {paginationRange.map((item, index) => {
                    if (item === '...') {
                        return (
                            <span key={`dots-${index}`} className={styles.dots}>
                                {/*fix styling*/}
                                <MoreHorizontal size={18} strokeWidth={2.5} color="#999" />
                            </span>
                        );
                    }

                    const pageNumber = item as number;
                    const isActive = pageNumber === visibleStepCount;

                    return (
                        <Button
                            key={pageNumber}
                            onClick={() => handleJumpTo(pageNumber)}
                            className={isActive ? styles.pageBtnActive : styles.pageBtnInactive}
                        >
                            {pageNumber}
                        </Button>
                    );
                })}

                <Button
                    onClick={handleNext}
                    disabled={isLastStep}
                    className={styles.icon}
                    data-cy="next-step-btn"
                    data-testid="next-step-btn"
                >
                    <ChevronRight size={28} />
                </Button>
            </div>
        </div>
    );
}