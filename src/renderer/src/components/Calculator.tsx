import React, { useState } from 'react';

export const Calculator = () => {
    const [display, setDisplay] = useState('0');
    const [equation, setEquation] = useState('');
    const [lastOp, setLastOp] = useState('');
    const [prevValue, setPrevValue] = useState(0);

    const handleNumber = (num: string) => {
        if (display === '0') {
            setDisplay(num);
        } else {
            setDisplay(display + num);
        }
    };

    const handleOperator = (op: string) => {
        setPrevValue(parseFloat(display));
        setLastOp(op);
        setEquation(display + ' ' + op + ' ');
        setDisplay('0');
    };

    const calculate = () => {
        const current = parseFloat(display);
        let result = 0;

        switch (lastOp) {
            case '+': result = prevValue + current; break;
            case '-': result = prevValue - current; break;
            case '*': result = prevValue * current; break;
            case '/': result = prevValue / current; break;
            default: return;
        }

        setDisplay(String(result));
        setEquation('');
        setLastOp('');
    };

    const clear = () => {
        setDisplay('0');
        setEquation('');
        setPrevValue(0);
        setLastOp('');
    };

    const btnStyle: React.CSSProperties = {
        width: '100%',
        height: '60px',
        border: 'none',
        borderRadius: '12px',
        background: 'rgba(255, 255, 255, 0.5)',
        fontSize: '18px',
        fontWeight: 600,
        color: '#333',
        cursor: 'pointer',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    const opStyle: React.CSSProperties = {
        ...btnStyle,
        background: 'var(--accent-color)',
        color: 'white'
    };

    return (
        <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column', gap: '15px', background: 'rgba(255,255,255,0.1)' }}>
            <div style={{
                background: 'rgba(0,0,0,0.05)',
                padding: '20px',
                borderRadius: '16px',
                textAlign: 'right',
                minHeight: '100px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <div style={{ fontSize: '14px', opacity: 0.5, marginBottom: '5px', color: '#666' }}>{equation}</div>
                <div style={{ fontSize: '36px', fontWeight: 700, color: '#000' }}>{display}</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                <button style={{ ...btnStyle, gridColumn: 'span 3' }} onClick={clear}>AC</button>
                <button style={opStyle} onClick={() => handleOperator('/')}>÷</button>

                {[7, 8, 9].map(n => <button key={n} style={btnStyle} onClick={() => handleNumber(String(n))}>{n}</button>)}
                <button style={opStyle} onClick={() => handleOperator('*')}>×</button>

                {[4, 5, 6].map(n => <button key={n} style={btnStyle} onClick={() => handleNumber(String(n))}>{n}</button>)}
                <button style={opStyle} onClick={() => handleOperator('-')}>−</button>

                {[1, 2, 3].map(n => <button key={n} style={btnStyle} onClick={() => handleNumber(String(n))}>{n}</button>)}
                <button style={opStyle} onClick={() => handleOperator('+')}>+</button>

                <button style={{ ...btnStyle, gridColumn: 'span 2' }} onClick={() => handleNumber('0')}>0</button>
                <button style={btnStyle} onClick={() => handleNumber('.')}>.</button>
                <button style={opStyle} onClick={calculate}>=</button>
            </div>
        </div>
    );
};
