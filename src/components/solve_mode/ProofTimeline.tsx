import { useMemo, useEffect, useState } from 'react';
import StepCanvas from './StepCanvas';
import type { Clause, ProofStep, Assignment } from "../../engine/types.ts";
import type { WorkerMessage } from "../../workers/worker"
import type { ModelWorkerMessage } from "../../workers/modelWorker"
import { useTranslation } from 'react-i18next';
import ResultPanel from './ResultPanel';
import Button from "../button/Button";
import { getPaginationRange } from "../../utils/pagination"
import styles from './ProofTimeline.module.css';
import { useLocalStorage } from '../../hook/useLocalStorage';
import { MoreHorizontal, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';
import BaseCanvas from "../BaseCanvas";

interface ProofTimelineProps {
    initialClauses: Clause[];
}

export default function ProofTimeline({ initialClauses }: ProofTimelineProps) {

    const { t } = useTranslation();

    const [fullHistory, setFullHistory] = useState<ProofStep[]>([]);
    const [finalPool, setFinalPool] = useState<Clause[]>([]);
    const [isSolving, setIsSolving] = useState<boolean>(true);
    const [workerError, setWorkerError] = useState<string | null>(null);

    const [visibleStepCount, setVisibleStepCount] = useLocalStorage<number>('prover_timeline_step', 1);
    const totalSteps = fullHistory.length;

    const [isResultExpanded, setIsResultExpanded] = useState<boolean>(false);

    const [models, setModels] = useState<Assignment[] | null>(null);
    const [modelError, setModelError] = useState<string | null>(null);

    useEffect(() => {
        if (!initialClauses || initialClauses.length === 0) {
            setIsSolving(false);
            return;
        }

        setIsSolving(true);
        setFullHistory([]);
        setModels(null);
        setModelError(null);

        const engineWorker = new Worker(new URL('../../workers/worker.ts', import.meta.url), {
            type: 'module'
        });

        engineWorker.onmessage = (e: MessageEvent<WorkerMessage>) => {
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

        engineWorker.onerror = (errorEvent: ErrorEvent) => {
            // This catches syntax errors, 404s, and infinite loops that crash the thread
            // locale tokens???
            const fallbackMessage = t('error.unknownError');
            console.error('Fatal Worker Crash:', errorEvent);
            setWorkerError(t('error.fatalWorkerCrash', {
                message: errorEvent.message || fallbackMessage
            }));
            setIsSolving(false);
        };

        engineWorker.postMessage(initialClauses);

        const modelWorker = new Worker(new URL('../../workers/modelWorker.ts', import.meta.url), { type: 'module' });

        modelWorker.onmessage = (e: MessageEvent<ModelWorkerMessage>) => {
            if (e.data.type === 'SUCCESS') {
                setModels(e.data.payload);
            } else {
                setModelError(e.data.payload);
            }
        };

        modelWorker.onerror = () => {
            setModelError("Model thread crashed unexpectedly.");
        };

        modelWorker.postMessage(initialClauses);

        return () => {
            engineWorker.terminate();
            modelWorker.terminate();
        };
    }, [initialClauses, setVisibleStepCount]);

    const hasEmptyClause = finalPool?.some(c => c.literals.length === 0) ?? false;
    const hasConclusion = initialClauses?.some(c => c.isNegatedConclusion) ?? false;
    const isEmptySet = (finalPool || []).length === 0;

    const handleNext = () => setVisibleStepCount(prev => Math.min(prev + 1, totalSteps));
    const handlePrev = () => setVisibleStepCount(prev => Math.max(prev - 1, 1));
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

    return (
        <div className={styles.mainContainer}>

            <div className={styles.canvasWrapper}>
                <div className={styles.canvasHeader}>
                    <h3 className={styles.stepTitle}>
                        {/*{t('input.step', { count: currentStep.stepNumber })}*/}
                        {isLastStep
                            ? t('input.result')
                            : t('input.step', { count: currentStep.stepNumber })
                        }
                    </h3>
                    <div className={styles.resultRow}>
                    <p className={styles.stepMessage}>
                        {baseMessage}
                    </p>
                    {isLastStep && (
                        <Button
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

                <Button onClick={handleNext} disabled={isLastStep} className={styles.icon}>
                    <ChevronRight size={28} />
                </Button>
            </div>
        </div>
    );
}