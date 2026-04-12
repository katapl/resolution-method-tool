import React from 'react';
import './button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export default function Button({ children, disabled, style, className = '', ...props }: ButtonProps) {
    return (
        <button
            disabled={disabled}
            className={`custom-button ${className}`}
            style={style}
            {...props}
        >
            {children}
        </button>
    );
}