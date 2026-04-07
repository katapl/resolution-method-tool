import { useMemo, useEffect, useRef } from 'react';
import { autoSolve } from '../engine/resolver';
import StepCanvas from './canvas/StepCanvas';
import type { Clause } from "../engine/types.ts";
import { useLocalStorage } from '../hook/useLocalStorage';

interface ProofTimelineProps {
    initialClauses: Clause[];
}

export default function ProofTimeline({ initialClauses }: ProofTimelineProps) {

    const stepEndRef = useRef<HTMLDivElement>(null);

    const fullHistory = useMemo(() => {
        if (initialClauses.length === 0) return [];
        return autoSolve(initialClauses).history;
    }, [initialClauses]);

    const [visibleStepCount, setVisibleStepCount] = useLocalStorage<number>(
        'timeline_step_active',
        1
    );

    useEffect(() => {
        if (fullHistory.length > 0) {
            setVisibleStepCount((prev) => (prev > fullHistory.length ? 1 : prev));
        }
    }, [fullHistory.length, setVisibleStepCount]);

    useEffect(() => {
        stepEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [visibleStepCount]);

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

    if (fullHistory.length === 0) return null;

    return (
        <div style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '2rem' }}>

            {visibleHistory.map((step) => (
                <div key={step.stepNumber} style={{
                    background: '#fff',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)'
                }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: 'black' }}>Step {step.stepNumber}</h3>
                        <p style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>{step.message}</p>
                    </div>
                    <StepCanvas step={step} />
                </div>
            ))}

            <div style={{
                textAlign: 'center',
                padding: '2rem',
                background: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    <button
                        onClick={handleNextStep}
                        disabled={visibleStepCount === fullHistory.length}
                        style={{
                            padding: '0rem 1rem',
                            height: '2rem',
                            background: '#FFFFFF',
                            color: visibleStepCount === fullHistory.length ? '#ccc' : 'grey',
                            borderRadius: '8px',
                            border: '1px solid grey',
                            fontSize: '1.1rem',
                            cursor: visibleStepCount === fullHistory.length ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {visibleStepCount === fullHistory.length ? "Proof Complete" : "Next Step"}
                    </button>

                    <button
                        onClick={handleRevealAll}
                        disabled={visibleStepCount === fullHistory.length}
                        style={{
                            padding: '0rem 1rem',
                            height: '2rem',
                            background:'#FFFFFF',
                            color: visibleStepCount === fullHistory.length ? '#ccc' : 'grey',
                            borderRadius: '8px',
                            border: '1px solid grey',
                            fontSize: '1.1rem',
                            cursor: visibleStepCount === fullHistory.length ? 'not-allowed' : 'pointer'
                        }}>
                        Full solution
                    </button>

                    <button
                        onClick={handleRestartSteps}
                        style={{
                            padding: '0rem 1rem',
                            height: '2rem',
                            background: '#FFFFFF',
                            color: 'grey', borderRadius: '8px',
                            border: '1px solid grey',
                            fontSize: '1.1rem',
                            cursor: 'pointer'
                        }}>
                        Reset steps
                    </button>
                    <div ref={stepEndRef} />
                </div>
            </div>
        </div>
    );
}