import React, { useState } from 'react';
import { parseFormulaToClauses } from '../engine/parser';
import type {Clause} from "../engine/types.ts";

interface FormulaInputProps {
    onSolve: (clauses: Clause[]) => void;
    onPractice: (clauses: Clause[]) => void;
    disabled?: boolean;
}

export default function FormulaInput({ onSolve, onPractice, disabled }: FormulaInputProps) {
    const [inputValue, setInputValue] = useState("");

    const handleSolve = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const parsedClauses = parseFormulaToClauses(inputValue);
        onSolve(parsedClauses);
    };

    const handlePractice = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const parsedClauses = parseFormulaToClauses(inputValue);
        onPractice(parsedClauses);
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', maxWidth: '1000px', margin: '0 auto' }}>

            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#1976d2', whiteSpace: 'nowrap' }}>
                Formula:
            </div>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="e.g. ~p v t, k v s v r"
                    disabled={disabled}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', color: 'black', backgroundColor: '#FFFFFF' }}
                />
                <button
                    onClick={handleSolve}
                    disabled={disabled || !inputValue.trim()}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: disabled || !inputValue.trim() ? '#ccc' : '#2196f3',
                        color: 'white', border: 'none', borderRadius: '8px',
                        fontSize: '1.1rem', fontWeight: 'bold',
                        cursor: disabled || !inputValue.trim() ? 'not-allowed' : 'pointer'
                    }}
                >
                    Solve
                </button>
                <button
                    type="submit" //?
                    onClick={handlePractice}
                    disabled={disabled || !inputValue.trim()}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: disabled || !inputValue.trim() ? '#ccc' : '#2196f3',
                        color: 'white', border: 'none', borderRadius: '8px',
                        fontSize: '1.1rem', fontWeight: 'bold',
                        cursor: disabled || !inputValue.trim() ? 'not-allowed' : 'pointer'
                    }}
                >
                    Practice
                </button>
        </div>
    );
}