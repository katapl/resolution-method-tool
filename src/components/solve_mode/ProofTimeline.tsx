import { useMemo, useEffect, useRef, useState } from 'react';
import { autoSolve } from '../../engine/resolver';
import StepCanvas from './StepCanvas';
import type { Clause } from "../../engine/types.ts";
import type { WorkerMessage } from "../engine/worker.ts"
import { useLocalStorage } from '../../hook/useLocalStorage';
import { useTranslation } from 'react-i18next';
import ResultPanel from './ResultPanel';
import Button from "../Button";

interface ProofTimelineProps {
    initialClauses: Clause[];
}

export default function ProofTimeline({ initialClauses }: ProofTimelineProps) {
    const { t, i18n } = useTranslation();

    const [fullHistory, setFullHistory] = useState<ProofStep[]>([]);
    const [finalPool, setFinalPool] = useState<Clause[]>([]);
    const [isSolving, setIsSolving] = useState<boolean>(true);
    const [workerError, setWorkerError] = useState<string | null>(null); // NEW

    const [currentIndex, setCurrentIndex] = useState<number>(0);

    const [visibleStepCount, setVisibleStepCount] = useState<number>(1);

    useEffect(() => {
        if (!initialClauses || initialClauses.length === 0) {
            setIsSolving(false);
            return;
        }

        setIsSolving(true);
        setFullHistory([]);
        setCurrentIndex(0);

        const worker = new Worker(new URL('../../engine/worker.ts', import.meta.url), {
            type: 'module'
        });

        worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
            if (e.data.type === 'SUCCESS') {
                setFullHistory(e.data.payload.history);
                setFinalPool(e.data.payload.finalPool);
                setIsSolving(false);
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

    useEffect(() => {
        if (fullHistory.length > 0) {
            setVisibleStepCount((prev) => (prev > fullHistory.length ? 1 : prev));
        }
    }, [fullHistory.length, setVisibleStepCount]);

    const hasEmptyClause = finalPool?.some(c => c.literals.length === 0) ?? false;

    const hasConclusion = initialClauses?.some(c => c.isNegatedConclusion) ?? false;

    const isEmptySet = (finalPool || []).length === 0;

    const visibleHistory = fullHistory.slice(0, visibleStepCount);

    const handleNextStep = () => {
        if (visibleStepCount < fullHistory.length) {
            setVisibleStepCount(prev => prev + 1);
        }
    };

    const handleRevealAll = () => {
        setVisibleStepCount(fullHistory.length);
    };

    const handleRestartSteps = () => {
        setVisibleStepCount(1);
    };

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

    const currentStep = fullHistory[currentIndex];
    const isLastStep = currentIndex === fullHistory.length - 1;

    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem' }}>

            <div style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'black' }}>
                        {t('solve.step', { count: currentStep.stepNumber })} of {fullHistory.length}
                    </h3>
                </div>

                <p style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#333' }}>
                    {typeof currentStep.message === 'string' ? currentStep.message : t(currentStep.message.key, currentStep.message.params)}
                </p>

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

            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>

                    <Button
                        onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentIndex === 0}
                    >
                        {t('buttons.previousStep')}
                    </Button>

                    <Button
                        onClick={() => setCurrentIndex(prev => Math.min(fullHistory.length - 1, prev + 1))}
                        disabled={isLastStep}
                    >
                        {t('buttons.nextStep')}
                    </Button>

                    <Button
                        onClick={() => setCurrentIndex(fullHistory.length - 1)}
                        disabled={isLastStep}
                    >
                        {t('buttons.fullSolution')}
                    </Button>

                </div>
            </div>
        </div>
    );
}