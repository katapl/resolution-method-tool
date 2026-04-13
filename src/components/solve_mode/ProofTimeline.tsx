import { useMemo, useEffect, useState } from 'react';
import { autoSolve } from '../../engine/resolver';
import StepCanvas from './StepCanvas';
import type { Clause, ProofStep } from "../../engine/types.ts";
import type { WorkerMessage } from "../engine/worker.ts"
import { useTranslation } from 'react-i18next';
import ResultPanel from './ResultPanel';
import Button from "../button/Button";
import { getPaginationRange } from "../../utils/pagination"
import styles from './ProofTimeline.module.css';

interface ProofTimelineProps {
    initialClauses: Clause[];
    onReset: () => void;
}

export default function ProofTimeline({ initialClauses, onReset }: ProofTimelineProps) {

    const { t, i18n } = useTranslation();

    const [fullHistory, setFullHistory] = useState<ProofStep[]>([]);
    const [finalPool, setFinalPool] = useState<Clause[]>([]);
    const [isSolving, setIsSolving] = useState<boolean>(true);
    const [workerError, setWorkerError] = useState<string | null>(null);

    const [visibleStepCount, setVisibleStepCount] = useState<number>(1);
    const totalSteps = fullHistory.length;

    useEffect(() => {
        if (!initialClauses || initialClauses.length === 0) {
            setIsSolving(false);
            return;
        }

        setIsSolving(true);
        setFullHistory([]);

        const worker = new Worker(new URL('../../engine/worker.ts', import.meta.url), {
            type: 'module'
        });

        worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
            if (e.data.type === 'SUCCESS') {
                const newHistory = e.data.payload.history;

                setFullHistory(newHistory);
                setFinalPool(e.data.payload.finalPool);
                setIsSolving(false);

                setVisibleStepCount(prev => Math.max(1, Math.min(prev, newHistory.length)));
            } else {
                setWorkerError(e.data.payload);
                setIsSolving(false);
            }
        };

        worker.postMessage(initialClauses);

        return () => {
            worker.terminate();
        };
    }, [initialClauses]);

    const hasEmptyClause = finalPool?.some(c => c.literals.length === 0) ?? false;
    const hasConclusion = initialClauses?.some(c => c.isNegatedConclusion) ?? false;
    const isEmptySet = (finalPool || []).length === 0;

    const visibleHistory = fullHistory.slice(0, visibleStepCount);

    const handleNext = () => setVisibleStepCount(prev => Math.min(prev + 1, totalSteps));
    const handlePrev = () => setVisibleStepCount(prev => Math.max(prev - 1, 1));
    const handleLast = () => setVisibleStepCount(totalSteps);
    const handleJumpTo = (step: number) => setVisibleStepCount(step);

    const paginationRange = useMemo(() => {
        return getPaginationRange(visibleStepCount, totalSteps);
    }, [visibleStepCount, totalSteps]);

    const [showLoadingUi, setShowLoadingUi] = useState(false);

    useEffect(() => {
        let timer: ReturnType<typeof setTimeout>;
        if (isSolving) {
            timer = setTimeout(() => setShowLoadingUi(true), 250);
        } else {
            setShowLoadingUi(false);
        }
        return () => clearTimeout(timer);
    }, [isSolving]);

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

    const handleReset = (e: React.FormEvent) => {
        onReset();
    }

    return (
        <div className={styles.mainContainer}>

            <div className={styles.canvasWrapper}>
                <div className={styles.canvasHeader}>
                    <h3 className={styles.stepTitle}>
                        {t('solve.step', { count: currentStep.stepNumber })}
                    </h3>
                    <p className={styles.stepMessage}>
                        {baseMessage}
                    </p>
                </div>

                <StepCanvas
                    step={currentStep}
                    key={currentStep.stepNumber}
                />
            </div>

            {isLastStep && (
                <div className={styles.resultWrapper}>
                    <ResultPanel
                        hasEmptyClause={hasEmptyClause}
                        isEmptySet={isEmptySet}
                        hasConclusion={hasConclusion}
                    />
                </div>
            )}

            <div className={styles.pagination}>
                <Button onClick={handlePrev} disabled={visibleStepCount === 1}>
                    &lsaquo;
                </Button>

                {paginationRange.map((item, index) => {
                    if (item === '...') {
                        return (
                            <span key={`dots-${index}`} className={styles.dots}>
                                &#8230;
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

                <Button onClick={handleNext} disabled={isLastStep}>
                    &rsaquo;
                </Button>
            </div>
        </div>
    );
}