import ProofTimeline from "./components/ProofTimeline.tsx";
import SandboxCanvas from "./components/SandboxCanvas"
import { useState } from 'react';
import FormulaInput from "./components/FormulaInput"

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
                    <h2 style={{ color: 'black'}}>Welcome to the Resolution Prover</h2>
                    <p>Enter a formula above and choose a mode to begin.</p>
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

