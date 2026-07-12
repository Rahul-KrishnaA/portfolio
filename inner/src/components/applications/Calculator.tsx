// Arithmetic logic adapted from risterz/windows98-emulator
// (https://github.com/risterz/windows98-emulator), MIT licensed:
// https://github.com/risterz/windows98-emulator/blob/master/LICENSE
// Window chrome, styling, and app wiring are original to this repo.
import React, { useCallback, useEffect, useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';

export interface CalculatorProps extends WindowAppProps {}

type Operator = '+' | '-' | '*' | '/';

const applyOperator = (a: number, b: number, op: Operator): number => {
    switch (op) {
        case '+':
            return a + b;
        case '-':
            return a - b;
        case '*':
            return a * b;
        case '/':
            return b === 0 ? NaN : a / b;
    }
};

const Calculator: React.FC<CalculatorProps> = (props) => {
    const [display, setDisplay] = useState('0');
    const [operand, setOperand] = useState<number | null>(null);
    const [operator, setOperator] = useState<Operator | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const inputDigit = useCallback(
        (digit: string) => {
            if (waitingForOperand) {
                setDisplay(digit);
                setWaitingForOperand(false);
            } else {
                setDisplay(display === '0' ? digit : display + digit);
            }
        },
        [display, waitingForOperand]
    );

    const inputDecimal = useCallback(() => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
            return;
        }
        if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    }, [display, waitingForOperand]);

    const clear = useCallback(() => {
        setDisplay('0');
        setOperand(null);
        setOperator(null);
        setWaitingForOperand(false);
    }, []);

    const toggleSign = useCallback(() => {
        setDisplay((d) => (d.startsWith('-') ? d.slice(1) : d === '0' ? d : '-' + d));
    }, []);

    const inputPercent = useCallback(() => {
        setDisplay((d) => String(parseFloat(d) / 100));
    }, []);

    const backspace = useCallback(() => {
        setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : '0'));
    }, []);

    const performOperator = useCallback(
        (nextOperator: Operator | '=') => {
            // If already waiting for an operand and not pressing '=', just swap the operator
            if (waitingForOperand && nextOperator !== '=' && operator) {
                setOperator(nextOperator);
                return;
            }

            const inputValue = parseFloat(display);

            if (operand === null) {
                setOperand(inputValue);
            } else if (operator) {
                const result = applyOperator(operand, inputValue, operator);
                setDisplay(String(result));
                setOperand(nextOperator === '=' ? null : result);
            }

            setWaitingForOperand(true);
            setOperator(nextOperator === '=' ? null : nextOperator);
        },
        [display, operand, operator, waitingForOperand]
    );

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') {
                inputDigit(e.key);
            } else if (e.key === '.') {
                inputDecimal();
            } else if (['+', '-', '*', '/'].includes(e.key)) {
                performOperator(e.key as Operator);
            } else if (e.key === 'Enter' || e.key === '=') {
                e.preventDefault();
                performOperator('=');
            } else if (e.key === 'Escape') {
                clear();
            } else if (e.key === 'Backspace') {
                backspace();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [inputDigit, inputDecimal, performOperator, clear, backspace]);

    const buttons: { label: string; onClick: () => void; wide?: boolean }[] = [
        { label: 'C', onClick: clear },
        { label: '+/-', onClick: toggleSign },
        { label: '%', onClick: inputPercent },
        { label: '/', onClick: () => performOperator('/') },
        { label: '7', onClick: () => inputDigit('7') },
        { label: '8', onClick: () => inputDigit('8') },
        { label: '9', onClick: () => inputDigit('9') },
        { label: '*', onClick: () => performOperator('*') },
        { label: '4', onClick: () => inputDigit('4') },
        { label: '5', onClick: () => inputDigit('5') },
        { label: '6', onClick: () => inputDigit('6') },
        { label: '-', onClick: () => performOperator('-') },
        { label: '1', onClick: () => inputDigit('1') },
        { label: '2', onClick: () => inputDigit('2') },
        { label: '3', onClick: () => inputDigit('3') },
        { label: '+', onClick: () => performOperator('+') },
        { label: '0', onClick: () => inputDigit('0'), wide: true },
        { label: '.', onClick: inputDecimal },
        { label: '=', onClick: () => performOperator('=') },
    ];

    return (
        <Window
            top={140}
            left={220}
            width={220}
            height={300}
            windowTitle="Calculator"
            windowBarIcon="calculatorIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
        >
            <div style={styles.container}>
                <div style={styles.display}>
                    <p style={styles.displayText}>{display}</p>
                </div>
                <div style={styles.grid}>
                    {buttons.map((b, i) => (
                        <button
                            key={i}
                            className="site-button"
                            style={Object.assign(
                                {},
                                styles.button,
                                b.wide && styles.buttonWide
                            )}
                            onClick={b.onClick}
                        >
                            {b.label}
                        </button>
                    ))}
                </div>
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flex: 1,
        width: '100%',
        flexDirection: 'column',
        padding: 8,
        boxSizing: 'border-box',
        backgroundColor: 'var(--os-chrome-bg)',
    },
    display: {
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
        backgroundColor: 'var(--os-bg)',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '6px 8px',
        marginBottom: 8,
        overflow: 'hidden',
    },
    displayText: {
        color: 'var(--os-text)',
        fontFamily: 'Consolas, monospace',
        fontSize: 20,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    grid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
    },
    button: {
        width: '23%',
        height: 36,
        margin: '1%',
        fontSize: 14,
    },
    buttonWide: {
        width: '48%',
    },
};

export default Calculator;
