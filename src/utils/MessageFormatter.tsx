import React from 'react';

interface MessageFormatterProps {
    text: string;
    highlightClass?: string;
}

export default function MessageFormatter({ text, highlightClass = "literalHighlight" }: MessageFormatterProps) {
    if (!text) return null;

    const parts = text.split(/`([^`]+)`/g);

    return (
        <>
            {parts.map((part, index) => {
                    if (index % 2 === 1) {
                        return (
                            <span key={index} className={highlightClass}>
                            {part}
                            </span>
                    );
                    }
                    return <React.Fragment key={index}>{part}</React.Fragment>;
                })}
        </>
    );
}