import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Clause, ProofStep, Assignment } from "../engine/types.ts";
import type { WorkerMessage } from "../workers/worker";
import type { ModelWorkerMessage } from "../workers/modelWorker";

export function useProofEngine(
    initialClauses: Clause[],
    setVisibleStepCount: React.Dispatch<React.SetStateAction<number>>
) {
    const { t } = useTranslation();

    const [fullHistory, setFullHistory] = useState<ProofStep[]>([]);
    const [finalPool, setFinalPool] = useState<Clause[]>([]);
    const [isSolving, setIsSolving] = useState<boolean>(true);
    const [workerError, setWorkerError] = useState<string | null>(null);

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

        const engineWorker = new Worker(new URL('../workers/worker.ts', import.meta.url), {
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
            const fallbackMessage = t('error.unknownError');
            console.error('Fatal Worker Crash:', errorEvent);
            setWorkerError(t('error.fatalWorkerCrash', {
                message: errorEvent.message || fallbackMessage
            }));
            setIsSolving(false);
        };

        console.log("Worker called")
        engineWorker.postMessage(initialClauses);

        const modelWorker = new Worker(new URL('../workers/modelWorker.ts', import.meta.url), { type: 'module' });

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
        console.log("Worker called")
        modelWorker.postMessage(initialClauses);

        return () => {
            engineWorker.terminate();
            modelWorker.terminate();
        };
    }, [initialClauses, setVisibleStepCount, t]);

    const hasEmptyClause = finalPool?.some(c => c.literals.length === 0) ?? false;
    const hasConclusion = initialClauses?.some(c => c.isNegatedConclusion) ?? false;
    const isEmptySet = (finalPool || []).length === 0;
    const totalSteps = fullHistory.length;

    return {
        isSolving,
        workerError,
        fullHistory,
        totalSteps,
        hasEmptyClause,
        hasConclusion,
        isEmptySet,
        models,
        modelError
    };
}