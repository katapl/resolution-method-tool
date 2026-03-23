import React, { useState } from 'react';
import { parseFormulaToClauses } from '../engine/parser';
import type {Clause} from "../engine/types.ts";

interface FormulaInputProps {
    onSolve: (clauses: Clause[]) => void;
    disabled?: boolean;
}

export default function FormulaInput({ onSolve, disabled }: FormulaInputProps) {
    const [inputValue, setInputValue] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) return;

        const parsedClauses = parseFormulaToClauses(inputValue);
        onSolve(parsedClauses);
    };

    return (
        <form
            onSubmit={handleSubmit}
            style={{ background: '#fff', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
        >
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 'bold', color: '#333' }}>
                Enter Clauses (comma-separated):
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="e.g. ~p v t, k v s v r"
                    disabled={disabled}
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '1rem' }}
                />
                <button
                    type="submit"
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
            </div>
        </form>
    );
}