import ProofTimeline from "./components/solve_mode/ProofTimeline.tsx";
import SandboxCanvas from "./components/sandbox_mode/SandboxCanvas";
import FormulaInput from "./components/FormulaInput";
import { useState } from 'react';
import { useLocalStorage } from './hook/useLocalStorage';
import type { Clause } from './engine/types';
import Button from "./components/button/Button";
import { useTranslation } from 'react-i18next';
import styles from './App.module.css';
import Guide from "./components/guide/Guide"
import { ErrorBoundary } from 'react-error-boundary';
import { ChevronLeft } from 'lucide-react';

type AppMode = 'IDLE' | 'SOLVE' | 'PRACTICE';

function ErrorFallback({ error, resetErrorBoundary }: any) {
    return (
        <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
            <h2 style={{ color: '#d32f2f' }}>Something went wrong.</h2>
            <p style={{ color: '#555' }}>The application encountered an unexpected UI error.</p>
            <div style={{ background: '#ffebee', padding: '16px', borderRadius: '8px', display: 'inline-block', margin: '16px 0' }}>
                <code>{error.message}</code>
            </div>
            <br />
            <button onClick={resetErrorBoundary} style={{ padding: '8px 16px', cursor: 'pointer' }}>
                Go back to Home
            </button>
        </div>
    );
}

function App() {
    const [mode, setMode] = useLocalStorage<AppMode>('prover_app_mode', 'IDLE');
    const [startingClauses, setStartingClauses] = useLocalStorage<Clause[]>('prover_starting_clauses', []);
    const { t } = useTranslation();
    const [injectedFormula, setInjectedFormula] = useState<{ text: string, time: number } | null>(null);

    const handleSolve = (clauses: Clause[]) => {
        setStartingClauses(clauses);
        setMode('SOLVE');
        setInjectedFormula(null);
    };

    const handlePractice = (clauses: Clause[]) => {
        setStartingClauses(clauses);
        setMode('PRACTICE');
        setInjectedFormula(null);
    };

    const handleResetApp = () => {
        setMode('IDLE');
        setStartingClauses([]);
        setInjectedFormula(null);
        const keysToDelete: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.startsWith('prover_engine_') ||
                key.startsWith('prover_nodes_') ||
                key.startsWith('prover_edges_') ||
                key.startsWith('prover_selected_') ||
                key === 'prover_timeline_step'
            )) {
                keysToDelete.push(key);
            }
        }

        keysToDelete.forEach(key => localStorage.removeItem(key));
    };

    const containerClass = `${styles.appContainer} ${mode !== 'IDLE' ? styles.appContainerActive : ''}`;

    return (
        <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onReset={() => {
                setMode('IDLE');
                setStartingClauses([]);
            }}
        >
            {mode === 'IDLE' ? (
                <div className={styles.containerClass}>
                    <FormulaInput
                        onSolve={handleSolve}
                        onPractice={handlePractice}
                        onReset={handleResetApp}
                        injectedFormula={injectedFormula}
                    />
                    <div className={styles.canvasContainer}>
                        <Guide onSelectExample={(text) => setInjectedFormula({ text, time: Date.now() })} />
                    </div>
                </div>
            ) : (
                <div className={styles.fullscreenLayout}>
                    <div className={styles.canvasWrapper}>
                        {mode === 'SOLVE' && (
                            <ProofTimeline
                                key={`timeline-${startingClauses.length > 0 ? startingClauses[0].id : 'empty'}`}
                                initialClauses={startingClauses}
                                onBack={handleResetApp}
                            />
                        )}

                        {mode === 'PRACTICE' && (
                            <SandboxCanvas
                                key={`sandbox-${startingClauses.length > 0 ? startingClauses[0].id : 'empty'}`}
                                initialClauses={startingClauses}
                                onBack={handleResetApp}
                            />
                        )}
                    </div>
                </div>
            )}
        </ErrorBoundary>
    );
}

export default App;