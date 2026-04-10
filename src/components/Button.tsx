import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export default function Button({ children, disabled, style, ...props }: ButtonProps) {
    return (
        <button
            disabled={disabled}
            style={{
                padding: '0rem 1rem',
                height: '2rem',
                background: disabled ? '#ccc' : '#FFFFFF',
                color: disabled ? '#888' : 'grey',
                borderRadius: '8px',
                border: '1px solid grey',
                fontSize: '1.1rem',
                cursor: disabled ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
                ...style
            }}
            {...props}
        >
            {children}
        </button>
    );
}