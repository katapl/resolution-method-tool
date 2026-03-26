import ProofTimeline from "./components/ProofTimeline.tsx";
import SandboxCanvas from "./components/canvas/SandboxCanvas";
import { useState } from 'react';
import FormulaInput from "./components/FormulaInput";

type AppMode = 'IDLE' | 'SOLVE' | 'PRACTICE';

function App() {
    const [mode, setMode] = useState<AppMode>('IDLE');
    const [startingClauses, setStartingClauses] = useState<Clause[]>([]);

    const handleSolve = (clauses: Clause[]) => {
        setStartingClauses(clauses);
        setMode('SOLVE');
    };

    const handlePractice = (clauses: Clause[]) => {
        setStartingClauses(clauses);
        setMode('PRACTICE');
    };

    return (
        <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', padding: '2rem' }}>

            <FormulaInput
                onSolve={handleSolve}
                onPractice={handlePractice}
            />

            {mode === 'IDLE' && (
                <div style={{ textAlign: 'center', color: '#666', marginTop: '10vh' }}>
                    {/*<p>Explanation of the two modes here.</p>*/}
                    <p>~p v t, a v z, ~z v ~t, p, ~a</p>
                    <p>p v k, ~p v s, ~p v ~r, ~t v r, ~s v t, ~k</p>
                    <p> a, ~a v ~b v c, ~a v ~d v f, ~d v b, ~c v g, ~f v g, ~g</p>
                    <p>A, ~A v B, ~B v C, ~C v D, ~D v E, ~E, F v ~F v G, H v I v ~H, J v K, J v K v L, J v K v ~M, N v O, P v N, Q v R v S, ~Q v T, ~R v U, ~S v V, ~T v ~U v W, X v Y v Z, ~X v W</p>
                    <p>P v Q v R v S, P v Q v R v ~S, P v Q v ~R v S, P v Q v ~R v ~S, P v ~Q v R v S, P v ~Q v R v ~S, P v ~Q v ~R v S, P v ~Q v ~R v ~S, ~P v Q v R v S, ~P v Q v R v ~S, ~P v Q v ~R v S, ~P v Q v ~R v ~S, ~P v ~Q v R v S, ~P v ~Q v R v ~S, ~P v ~Q v ~R v S, ~P v ~Q v ~R v ~S</p>
                </div>
            )}

            {mode === 'SOLVE' && (
                <ProofTimeline key={`auto-${startingClauses.length}`} initialClauses={startingClauses} />
            )}

            {mode === 'PRACTICE' && (
                <SandboxCanvas key={`sandbox-${startingClauses.length}`} initialClauses={startingClauses} />
            )}

        </div>
    );
}
export default App;

