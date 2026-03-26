import ProofTimeline from "./components/ProofTimeline.tsx";
import SandboxCanvas from "./components/canvas/SandboxCanvas";
import { useState } from 'react';
import FormulaInput from "./components/FormulaInput";
import { useLocalStorage } from './hook/useLocalStorage';

type AppMode = 'IDLE' | 'SOLVE' | 'PRACTICE';

const clearSessionMemory = () => {
    window.localStorage.removeItem('sandbox_pool_active');
    window.localStorage.removeItem('sandbox_pairs_active');
    window.localStorage.removeItem('sandbox_nodes_active');
    window.localStorage.removeItem('sandbox_edges_active');
    window.localStorage.removeItem('timeline_step_active');
};

function App() {
    const [mode, setMode] = useLocalStorage<AppMode>('prover_app_mode', 'IDLE');
    const [startingClauses, setStartingClauses] = useLocalStorage<Clause[]>('prover_starting_clauses', []);

    const handleSolve = (clauses: Clause[]) => {
        clearSessionMemory();
        setStartingClauses(clauses);
        setMode('SOLVE');
    };

    const handlePractice = (clauses: Clause[]) => {
        clearSessionMemory();
        setStartingClauses(clauses);
        setMode('PRACTICE');
    };

    const handleResetApp = () => {
        clearSessionMemory();
        setMode('IDLE');
        setStartingClauses([]);
    };

    return (
        <div style={{
            backgroundColor: '#f0f2f5',
            minHeight: '100vh',
            padding: '2rem',
        }}>

            <div>

            <FormulaInput
                onSolve={handleSolve}
                onPractice={handlePractice}
                onReset={handleResetApp}
            />
                {/*{mode !== 'IDLE' && (*/}
                {/*    <button*/}
                {/*        onClick={handleResetApp}*/}
                {/*        style={{ padding: '0.5rem 1rem', background: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}*/}
                {/*    >*/}
                {/*        Start Over*/}
                {/*    </button>*/}
                {/*)}*/}
            </div>

            {mode === 'IDLE' && (
                <div style={{
                    textAlign: 'left',
                    color: '#666',
                    padding: '2rem',
                    maxWidth: '1000px',
                    margin: '0px auto'
                }}>
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

            {mode === 'SOLVE' && (
                <ProofTimeline
                    key={`timeline-${JSON.stringify(startingClauses)}`}
                    initialClauses={startingClauses} />
            )}

            {mode === 'PRACTICE' && (
                <SandboxCanvas
                    key={`timeline-${JSON.stringify(startingClauses)}`}
                    initialClauses={startingClauses} />
            )}

        </div>
    );
}
export default App;

