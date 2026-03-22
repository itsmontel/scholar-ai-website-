import { useState, useEffect, useCallback } from 'react';
import Header from '../../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../../common/WriteScholarEditorialBackground';
import Footer from '../../common/Footer';

interface CalculatorPageProps {
  onNavigate: (page: string) => void;
  user?: unknown;
  onLogout?: () => void;
}

// Safe expression evaluator - only allows numbers, operators, and Math functions
function safeEval(expr: string, useDegrees: boolean): number | null {
  try {
    const sanitized = expr.replace(/\s/g, '');
    if (!sanitized.length) return null;

    let processed = sanitized
      .replace(/π/g, 'Math.PI')
      .replace(/\^/g, '**');

    // Replace standalone 'e' (Euler's number) - avoid matching 1e10 or 2.5e-3
    processed = processed.replace(/(^|[^0-9.])e($|[^0-9])/g, '$1Math.E$2');

    // sqrt - replace √( with Math.sqrt(
    processed = processed.replace(/√\(/g, 'Math.sqrt(').replace(/sqrt\(/g, 'Math.sqrt(');

    // Trig functions - use Math.PI/180 for degrees
    const degMult = useDegrees ? '(Math.PI/180)*' : '';
    processed = processed.replace(/sin\(/g, `Math.sin(${degMult}`);
    processed = processed.replace(/cos\(/g, `Math.cos(${degMult}`);
    processed = processed.replace(/tan\(/g, `Math.tan(${degMult}`);
    processed = processed.replace(/asin\(/g, useDegrees ? '(180/Math.PI)*Math.asin(' : 'Math.asin(');
    processed = processed.replace(/acos\(/g, useDegrees ? '(180/Math.PI)*Math.acos(' : 'Math.acos(');
    processed = processed.replace(/atan\(/g, useDegrees ? '(180/Math.PI)*Math.atan(' : 'Math.atan(');
    processed = processed.replace(/ln\(/g, 'Math.log(');
    processed = processed.replace(/log\(/g, 'Math.log10(');

    // Final validation - only allow safe chars
    if (!/^[0-9+\-*/().%\sMath.PI.Ea-z]+$/.test(processed)) {
      return null;
    }

    const result = new Function(`"use strict"; return (${processed})`)();
    return typeof result === 'number' && isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

// Simple factorial for non-negative integers
function factorial(n: number): number {
  if (n < 0 || n !== Math.floor(n)) return NaN;
  if (n <= 1) return 1;
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

const CalculatorPage = ({ onNavigate, user, onLogout }: CalculatorPageProps) => {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [useDegrees, setUseDegrees] = useState(true);
  const [showScientific, setShowScientific] = useState(true);
  const [lastResult, setLastResult] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Free Scientific Calculator – Trig, Log, Powers | WriteScholar';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Free online scientific calculator for students. Trigonometry (sin, cos, tan), logarithms, square root, powers, and more. Works in degrees or radians. No signup required.');
    }
  }, []);

  const handleInput = useCallback((char: string) => {
    setDisplay((prev) => {
      if (prev === '0' && char !== '.' && !'+-*/'.includes(char)) {
        return char === 'π' || char === 'e' ? char : char;
      }
      if (prev === '0' && char === '.') return '0.';
      return prev + char;
    });
    setExpression((prev) => prev + char);
  }, []);

  const handleClear = useCallback(() => {
    setDisplay('0');
    setExpression('');
    setLastResult(null);
  }, []);

  const handleBackspace = useCallback(() => {
    setDisplay((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
    setExpression((prev) => prev.slice(0, -1));
  }, []);

  const handleEquals = useCallback(() => {
    if (!expression.trim()) return;
    const result = safeEval(expression, useDegrees);
    if (result !== null) {
      const formatted = Number.isInteger(result) ? result.toString() : result.toFixed(10).replace(/\.?0+$/, '');
      setDisplay(formatted);
      setExpression(formatted);
      setLastResult(result);
    } else {
      setDisplay('Error');
      setTimeout(() => {
        setDisplay('0');
        setExpression('');
      }, 1000);
    }
  }, [expression, useDegrees]);

  const handleFunction = useCallback((func: string, displayChar?: string) => {
    const toShow = displayChar ?? func;
    setDisplay((prev) => (prev === '0' ? `${func}(` : prev + `${func}(`));
    setExpression((prev) => prev + `${func}(`);
  }, []);

  const handleConstant = useCallback((val: string, displayVal: string) => {
    setDisplay((prev) => (prev === '0' ? displayVal : prev + displayVal));
    setExpression((prev) => prev + val);
  }, []);

  const handleFactorial = useCallback(() => {
    const num = parseFloat(display);
    if (Number.isInteger(num) && num >= 0 && num <= 170) {
      const result = factorial(num);
      setDisplay(result.toString());
      setExpression(result.toString());
      setLastResult(result);
    } else {
      setDisplay('Error');
      setTimeout(() => { setDisplay('0'); setExpression(''); }, 1000);
    }
  }, [display]);

  const basicButtons = [
    { label: 'C', onClick: handleClear, className: 'bg-red-500 hover:bg-red-600 text-white' },
    { label: '⌫', onClick: handleBackspace, className: 'bg-stone-400 hover:bg-stone-500 text-white' },
    { label: '%', onClick: () => handleInput('%'), className: 'bg-stone-300 hover:bg-stone-400 dark:bg-stone-600 dark:hover:bg-stone-500' },
    { label: '÷', onClick: () => handleInput('/'), className: 'bg-violet-500 hover:bg-violet-600 text-white' },
    { label: '7', onClick: () => handleInput('7'), className: 'bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600' },
    { label: '8', onClick: () => handleInput('8'), className: 'bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600' },
    { label: '9', onClick: () => handleInput('9'), className: 'bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600' },
    { label: '×', onClick: () => handleInput('*'), className: 'bg-violet-500 hover:bg-violet-600 text-white' },
    { label: '4', onClick: () => handleInput('4'), className: 'bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600' },
    { label: '5', onClick: () => handleInput('5'), className: 'bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600' },
    { label: '6', onClick: () => handleInput('6'), className: 'bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600' },
    { label: '−', onClick: () => handleInput('-'), className: 'bg-violet-500 hover:bg-violet-600 text-white' },
    { label: '1', onClick: () => handleInput('1'), className: 'bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600' },
    { label: '2', onClick: () => handleInput('2'), className: 'bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600' },
    { label: '3', onClick: () => handleInput('3'), className: 'bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600' },
    { label: '+', onClick: () => handleInput('+'), className: 'bg-violet-500 hover:bg-violet-600 text-white' },
    { label: '0', onClick: () => handleInput('0'), className: 'bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600 col-span-2' },
    { label: '.', onClick: () => handleInput('.'), className: 'bg-white dark:bg-stone-700 hover:bg-stone-100 dark:hover:bg-stone-600 border border-stone-200 dark:border-stone-600' },
    { label: '=', onClick: handleEquals, className: 'bg-emerald-500 hover:bg-emerald-600 text-white' },
  ];

  const scientificButtons = [
    { label: 'sin', onClick: () => handleFunction('sin'), className: 'bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800 text-violet-800 dark:text-violet-200 text-sm' },
    { label: 'cos', onClick: () => handleFunction('cos'), className: 'bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800 text-violet-800 dark:text-violet-200 text-sm' },
    { label: 'tan', onClick: () => handleFunction('tan'), className: 'bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800 text-violet-800 dark:text-violet-200 text-sm' },
    { label: '(', onClick: () => handleInput('('), className: 'bg-stone-200 dark:bg-stone-600 hover:bg-stone-300 dark:hover:bg-stone-500' },
    { label: ')', onClick: () => handleInput(')'), className: 'bg-stone-200 dark:bg-stone-600 hover:bg-stone-300 dark:hover:bg-stone-500' },
    { label: 'asin', onClick: () => handleFunction('asin'), className: 'bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800 text-violet-800 dark:text-violet-200 text-xs' },
    { label: 'acos', onClick: () => handleFunction('acos'), className: 'bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800 text-violet-800 dark:text-violet-200 text-xs' },
    { label: 'atan', onClick: () => handleFunction('atan'), className: 'bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800 text-violet-800 dark:text-violet-200 text-xs' },
    { label: 'x²', onClick: () => handleInput('^2'), className: 'bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-800 dark:text-amber-200' },
    { label: 'xʸ', onClick: () => handleInput('^'), className: 'bg-amber-100 dark:bg-amber-900/50 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-800 dark:text-amber-200' },
    { label: 'ln', onClick: () => handleFunction('ln'), className: 'bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800 text-red-800 dark:text-red-200' },
    { label: 'log', onClick: () => handleFunction('log'), className: 'bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800 text-red-800 dark:text-red-200' },
    { label: '√', onClick: () => handleFunction('sqrt', '√('), className: 'bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-800 text-red-800 dark:text-red-200' },
    { label: 'n!', onClick: handleFactorial, className: 'bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800 text-violet-800 dark:text-violet-200' },
    { label: 'π', onClick: () => handleConstant('π', 'π'), className: 'bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800 text-violet-800 dark:text-violet-200' },
    { label: 'e', onClick: () => handleConstant('e', 'e'), className: 'bg-violet-100 dark:bg-violet-900/50 hover:bg-violet-200 dark:hover:bg-violet-800 text-violet-800 dark:text-violet-200' },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="calculator" />

      <section className="py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="inline-flex items-center px-4 py-1.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded-full text-sm font-semibold mb-4">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 dark:text-stone-100 mb-2">
              Scientific Calculator
            </h1>
            <p className="text-stone-500 dark:text-stone-400">
              Trigonometry, logarithms, powers & more. Perfect for math, physics & chemistry.
            </p>
          </div>

          <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            {/* Display */}
            <div className="p-4 sm:p-6 bg-gradient-to-b from-stone-100 to-stone-50 dark:from-stone-800 dark:to-stone-900 border-b border-stone-200 dark:border-stone-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400">
                  {useDegrees ? 'DEG' : 'RAD'}
                </span>
                <button
                  onClick={() => setUseDegrees(!useDegrees)}
                  className="text-xs font-medium px-2 py-1 rounded-lg bg-stone-200 dark:bg-stone-600 hover:bg-stone-300 dark:hover:bg-stone-500 text-stone-700 dark:text-stone-300 transition-colors"
                >
                  {useDegrees ? 'Degrees' : 'Radians'}
                </button>
              </div>
              <div className="text-right font-mono text-2xl sm:text-3xl min-h-[2.5rem] break-all text-stone-800 dark:text-stone-100">
                {display}
              </div>
              {expression && expression !== display && (
                <div className="text-right text-sm text-stone-500 dark:text-stone-400 font-mono truncate mt-1">
                  {expression}
                </div>
              )}
            </div>

            {/* Scientific toggle - mobile */}
            <div className="sm:hidden px-4 py-2 border-b border-stone-200 dark:border-stone-700">
              <button
                onClick={() => setShowScientific(!showScientific)}
                className="w-full py-2 text-sm font-medium text-violet-600 dark:text-violet-400"
              >
                {showScientific ? 'Hide scientific' : 'Show scientific'} ⌄
              </button>
            </div>

            {/* Buttons */}
            <div className="p-4 sm:p-6">
              {showScientific && (
                <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mb-4">
                  {scientificButtons.map((btn) => (
                    <button
                      key={btn.label}
                      onClick={btn.onClick}
                      className={`py-3 sm:py-2.5 rounded-xl font-semibold transition-all active:scale-95 ${btn.className}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              )}
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {basicButtons.map((btn) => (
                  <button
                    key={btn.label}
                    onClick={btn.onClick}
                    className={`py-4 sm:py-5 rounded-xl font-semibold text-lg transition-all active:scale-95 ${btn.className}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-6">
            No signup required. Use for homework, exams & study sessions.
          </p>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default CalculatorPage;
