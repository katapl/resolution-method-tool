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
        <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'left', gap: '1rem'}}>
                <div style={{ fontSize: '1.2rem', whiteSpace: 'nowrap' }}>
                    Enter formula:
                </div>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="~p v t, k v s v r"
                        disabled={disabled}
                        style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem', color: 'black', backgroundColor: '#FFFFFF' }}
                    />
            </div>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', gap: '1rem'}}>
                <button
                    onClick={handleSolve}
                    disabled={disabled || !inputValue.trim()}
                    style={{
                        padding: '0rem 1rem',
                        height: '2rem',
                        background: disabled || !inputValue.trim() ? '#ccc' : '#FFFFFF',
                        color: 'grey', borderRadius: '8px',
                        border: '1px solid grey',
                        fontSize: '1.1rem',
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
                        padding: '0rem 1rem',
                        height: '2rem',
                        background: disabled || !inputValue.trim() ? '#ccc' : '#FFFFFF',
                        color: 'grey', borderRadius: '8px',
                        border: '1px solid grey',
                        fontSize: '1.1rem',
                        cursor: disabled || !inputValue.trim() ? 'not-allowed' : 'pointer'
                    }}
                >
                    Practice
                </button>
            </div>
        </div>
    );
}