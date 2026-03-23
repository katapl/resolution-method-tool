import {useMemo, useState} from 'react';
import { autoSolve, type ProofStep } from '../engine/resolver';
import StepCanvas from './canvas/StepCanvas';
import FormulaInput from './FormulaInput';
import type {Clause} from "../engine/types.ts";

export default function ProofTimeline() {
    const [fullHistory, setFullHistory] = useState<ProofStep[]>([]);
    const [visibleStepCount, setVisibleStepCount] = useState<number>(0);
    const [isCalculated, setIsCalculated] = useState(false);

    const visibleHistory = useMemo(() => {
        return fullHistory.slice(0, visibleStepCount);
    }, [fullHistory, visibleStepCount]);

    const handleSolveSubmit = (clauses: Clause[]) => {
        const result = autoSolve(clauses);
        setFullHistory(result.history);
        setIsCalculated(true);
        setVisibleStepCount(0);
    };

    const handleNextStep = () => {
        if (visibleStepCount < fullHistory.length) {
            setVisibleStepCount(prev => prev + 1);
        }
    };

    const handleRevealAll = () => {
        setVisibleStepCount(fullHistory.length);
    };

    const handleReset = () => {
        setFullHistory([]);
        setVisibleStepCount(0);
        setIsCalculated(false);
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            <FormulaInput
                onSolve={handleSolveSubmit}
                disabled={isCalculated}
            />

            {visibleHistory.map((step) => (
                <div key={step.stepNumber} style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1976d2' }}>Step {step.stepNumber}</h3>
                        <p style={{ margin: 0, fontSize: '1.1rem', color: '#333' }}>{step.message}</p>
                    </div>
                    <StepCanvas step={step} />
                </div>
            ))}

            {isCalculated && (
                <div style={{ textAlign: 'center', padding: '2rem', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                        <button
                            onClick={handleNextStep}
                            disabled={visibleStepCount === fullHistory.length}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: visibleStepCount === fullHistory.length ? '#ccc' : '#4CAF50',
                                color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem',
                                cursor: visibleStepCount === fullHistory.length ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold'
                            }}
                        >
                            {visibleStepCount === fullHistory.length ? "Proof Complete ✓" : "Reveal Next Step ⬇️"}
                        </button>

                        <button
                            onClick={handleRevealAll}
                            style={{ padding: '0.75rem 1.5rem', background: '#ff9800', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: 'pointer' }}
                        >
                            Reveal All
                        </button>

                        <button
                            onClick={handleReset}
                            style={{ padding: '0.75rem 1.5rem', background: '#f44336', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', cursor: 'pointer' }}
                        >
                            Reset
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}