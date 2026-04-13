import React from 'react';
import styles from './Button.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export default function Button({ children, disabled, style, className = '', ...props }: ButtonProps) {
    return (
        <button
            disabled={disabled}
            className={`${styles.button} ${className}`}
            style={style}
            {...props}
        >
            {children}
        </button>
    );
}