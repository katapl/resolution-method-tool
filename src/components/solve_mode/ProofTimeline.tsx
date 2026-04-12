import { useMemo, useEffect, useRef, useState } from 'react';
import { autoSolve } from '../../engine/resolver';
import StepCanvas from './StepCanvas';
import type { Clause } from "../../engine/types.ts";
import type { WorkerMessage } from "../engine/worker.ts"
import { useLocalStorage } from '../../hook/useLocalStorage';
import { useTranslation } from 'react-i18next';
import ResultPanel from './ResultPanel';
import Button from "../Button";
import { getPaginationRange } from "../../utils/pagination"

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

    // delete?
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
        if (!showLoadingUi) return null;
        return (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#333' }}>
                <h2 style={{ animation: 'pulse 1.5s infinite' }}>
                    Engine is crunching the logic...
                </h2>
                <p>This may take a few seconds for complex formulas.</p>
            </div>
        );
    }
// test?
    if (workerError) {
        return (
            <div style={{ textAlign: 'center', padding: '4rem', maxWidth: '600px', margin: '0 auto' }}>
                <div style={{ background: '#ffebee', border: '2px solid #f44336', borderRadius: '12px', padding: '2rem' }}>
                    <h2 style={{ color: '#d32f2f', margin: '0 0 1rem 0' }}>Formula Too Complex</h2>
                    <p style={{ color: '#333', fontSize: '1.1rem', margin: 0 }}>{workerError}</p>
                    <p style={{ color: '#666', marginTop: '1rem' }}>
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
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem'
        }}>

            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #ccc' }}>
                <div style={{ display: 'flex', flexDirection:'column', justifyContent: 'space-between', alignItems: 'start', gap: '0.5rem', padding: '1rem 1rem 0 1rem', borderBottom: '1px solid #ddd', }}>
                    <h3 style={{ margin: 0, color: 'black' }}>
                        {t('solve.step', { count: currentStep.stepNumber })}
                    </h3>

                <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#333' }}>
                    {typeof currentStep.message === 'string' ? currentStep.message : t(currentStep.message.key, currentStep.message.params)}
                </p>
                </div>
                <StepCanvas
                    step={currentStep}
                    key={currentStep.stepNumber}
                />
            </div>

            {isLastStep && (
                <div style={{ marginTop: '1.5rem' }}>
                    <ResultPanel
                        hasEmptyClause={hasEmptyClause}
                        isEmptySet={isEmptySet}
                        hasConclusion={hasConclusion}
                    />
                </div>
            )}

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                marginTop: '1.5rem',
                flexWrap: 'wrap'
            }}>
                <Button
                    onClick={handlePrev}
                    disabled={visibleStepCount === 1}
                >
                    &lsaquo;
                </Button>

                {paginationRange.map((item, index) => {
                    if (item === '...') {
                        return (
                            <span key={`dots-${index}`} style={{ padding: '0 0.5rem', color: '#666' }}>
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
                        style={{
                            background: isActive? '#4da392' : '#FFFFFF', //5a5bb0 or 4da392
                            color: isActive ? '#FFFFFF' : 'grey',
                        }}
                    >
                        {pageNumber}
                    </Button>
                    );
                })}
                <Button
                    onClick={handleNext}
                    disabled={isLastStep}
                >
                    &rsaquo;
                </Button>
            </div>
        </div>
    );
}