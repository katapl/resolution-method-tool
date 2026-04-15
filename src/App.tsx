import ProofTimeline from "./components/solve_mode/ProofTimeline.tsx";
import SandboxCanvas from "./components/sandbox_mode/SandboxCanvas";
import FormulaInput from "./components/FormulaInput";
import { useLocalStorage } from './hook/useLocalStorage';
import type { Clause } from './engine/types';
import Button from "./components/button/Button";
import { useTranslation } from 'react-i18next';
import styles from './App.module.css';

type AppMode = 'IDLE' | 'SOLVE' | 'PRACTICE';

function App() {
    const [mode, setMode] = useLocalStorage<AppMode>('prover_app_mode', 'IDLE');
    const [startingClauses, setStartingClauses] = useLocalStorage<Clause[]>('prover_starting_clauses', []);
    const { t, i18n } = useTranslation();

    const handleSolve = (clauses: Clause[]) => {
        setStartingClauses(clauses);
        setMode('SOLVE');
    };

    const handlePractice = (clauses: Clause[]) => {
        setStartingClauses(clauses);
        setMode('PRACTICE');
    };

    const handleResetApp = () => {
        setMode('IDLE');
        setStartingClauses([]);
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
        <div className={containerClass}>
            <div>
                <FormulaInput
                    onSolve={handleSolve}
                    onPractice={handlePractice}
                    onReset={handleResetApp}
                />

                {mode === 'IDLE' && (
                    <div className={styles.idleExamples}>
                        {/*<p>Explanation of the two modes here.</p>*/}
                        <ul>
                            <li>~p v t, a v z, ~z v ~t, p, ~a</li>
                            <li>p v k, ~p v s, ~p v ~r, ~t v r, ~s v t, ~k</li>
                            <li> a, ~a v ~b v c, ~a v ~d v f, ~d v b, ~c v g, ~f v g, ~g</li>
                            <li>p v q v r, ~p v s v t, ~s v y, ~t, ~p v ~x, ~q v w, ~q v w (empty set)</li>
                            <li>x v y, ~z v t, ~x v t, ~y v z, ~t (empty clause)</li>
                            <li> ~p v r v s, p v q, ~r v t, ~r v e, ~e v ~t v s (empty set)</li>
                            <li> ~a v b, ~a v f, ~a v ~b v c, ~c v f, ~c v ~d v f, a(empty set)</li>
                            <li> ~x v y, ~y v z v ~x, t v x, t v ~z, ~t v x, ~z (empty clause)</li>
                            <li>A, ~A v B, ~B v C, ~C v D, ~D v E, ~E, F v ~F v G, H v I v ~H, J v K, J v K v L, J v K v ~M, N v O, P v N, Q v R v S, ~Q v T, ~R v U, ~S v V, ~T v ~U v W, X v Y v Z, ~X v W</li>
                            <li>P v Q v R v S, P v Q v R v ~S, P v Q v ~R v S, P v Q v ~R v ~S, P v ~Q v R v S, P v ~Q v R v ~S, P v ~Q v ~R v S, P v ~Q v ~R v ~S, ~P v Q v R v S, ~P v Q v R v ~S, ~P v Q v ~R v S, ~P v Q v ~R v ~S, ~P v ~Q v R v S, ~P v ~Q v R v ~S, ~P v ~Q v ~R v S, ~P v ~Q v ~R v ~S</li>
                        </ul>
                    </div>
                )}

                <div id="canvas-container" className={styles.canvasContainer}>
                    {mode === 'SOLVE' && (
                        <ProofTimeline
                            onReset={handleResetApp}
                            key={`timeline-${startingClauses.length > 0 ? startingClauses[0].id : 'empty'}`}
                            initialClauses={startingClauses} />
                    )}

                    {mode === 'PRACTICE' && (
                        <SandboxCanvas
                            key={`sandbox-${startingClauses.length > 0 ? startingClauses[0].id : 'empty'}`}
                            initialClauses={startingClauses} />
                    )}
                </div>
            </div>

            {mode !== 'IDLE' && (
                <div className={styles.resetWrapper}>
                    <Button onClick={handleResetApp} className={styles.resetBtn}>
                        {t('buttons.reset')}
                    </Button>
                </div>
            )}
        </div>
    );
}

export default App;