import { useState, useEffect, useCallback } from 'react';
import LoggedInPageShell from '../../workspace/LoggedInPageShell';
import Footer from '../../common/Footer';
import { applyPageSeoTags, injectToolProductSchema, removeJsonLd } from '../../../utils/seo';
import ToolPageSeoContent from '../../common/ToolPageSeoContent';
import { calcSeo } from '../../../data/toolSeoContent';

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
    applyPageSeoTags({
      title: 'Free Scientific Calculator – Trig, Log, Powers | WriteScholar',
      description: 'Free online scientific calculator for students. Trigonometry (sin, cos, tan), logarithms, square root, powers, and more. Works in degrees or radians. No signup required.',
    });
    injectToolProductSchema({
      name: 'Scientific Calculator',
      description: 'Free online scientific calculator — trigonometry (sin, cos, tan), logarithms, exponents, square root, factorial, π/e, and degree/radian modes.',
    });
    return () => removeJsonLd('tool-product');
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

  /* ── Duolingo-style button classes ── */
  const numBtn = 'bg-white dark:bg-stone-800 border-2 border-b-4 border-stone-200 dark:border-stone-700 active:border-b-2 active:translate-y-0.5 transition-all text-stone-800 dark:text-stone-100 font-extrabold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-750';
  const opBtn = 'bg-[#DDF4FF] dark:bg-[#1CB0F6]/20 border-2 border-b-4 border-[#1899D6] active:border-b-2 active:translate-y-0.5 transition-all text-[#1CB0F6] font-extrabold rounded-xl hover:bg-[#1CB0F6]/20';
  const clearBtn = 'bg-[#FFE8E8] dark:bg-[#FF4B4B]/20 border-2 border-b-4 border-[#E04343] active:border-b-2 active:translate-y-0.5 transition-all text-[#FF4B4B] font-extrabold rounded-xl hover:bg-[#FF4B4B]/20';
  const backBtn = 'bg-stone-100 dark:bg-stone-800 border-2 border-b-4 border-stone-300 dark:border-stone-600 active:border-b-2 active:translate-y-0.5 transition-all text-stone-600 dark:text-stone-300 font-extrabold rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700';
  const equalsBtn = 'bg-[#58CC02] border-2 border-b-4 border-[#46A302] active:border-b-2 active:translate-y-0.5 transition-all text-white font-extrabold rounded-xl hover:bg-[#46A302]';
  const trigBtn = 'bg-[#F3EAFF] dark:bg-[#A560E8]/20 border-2 border-b-4 border-[#8A48C7] active:border-b-2 active:translate-y-0.5 transition-all text-[#A560E8] font-extrabold rounded-xl text-sm hover:bg-[#A560E8]/20';
  const powerBtn = 'bg-[#FFF4E0] dark:bg-[#FF9600]/20 border-2 border-b-4 border-[#D97F00] active:border-b-2 active:translate-y-0.5 transition-all text-[#FF9600] font-extrabold rounded-xl hover:bg-[#FF9600]/20';
  const logBtn = 'bg-[#FFE8E8] dark:bg-[#FF4B4B]/20 border-2 border-b-4 border-[#E04343] active:border-b-2 active:translate-y-0.5 transition-all text-[#FF4B4B] font-extrabold rounded-xl hover:bg-[#FF4B4B]/20';
  const parenBtn = 'bg-stone-100 dark:bg-stone-800 border-2 border-b-4 border-stone-300 dark:border-stone-600 active:border-b-2 active:translate-y-0.5 transition-all text-stone-600 dark:text-stone-300 font-extrabold rounded-xl hover:bg-stone-200 dark:hover:bg-stone-700';

  const basicButtons = [
    { label: 'C', onClick: handleClear, className: clearBtn },
    { label: '⌫', onClick: handleBackspace, className: backBtn },
    { label: '%', onClick: () => handleInput('%'), className: backBtn },
    { label: '÷', onClick: () => handleInput('/'), className: opBtn },
    { label: '7', onClick: () => handleInput('7'), className: numBtn },
    { label: '8', onClick: () => handleInput('8'), className: numBtn },
    { label: '9', onClick: () => handleInput('9'), className: numBtn },
    { label: '×', onClick: () => handleInput('*'), className: opBtn },
    { label: '4', onClick: () => handleInput('4'), className: numBtn },
    { label: '5', onClick: () => handleInput('5'), className: numBtn },
    { label: '6', onClick: () => handleInput('6'), className: numBtn },
    { label: '−', onClick: () => handleInput('-'), className: opBtn },
    { label: '1', onClick: () => handleInput('1'), className: numBtn },
    { label: '2', onClick: () => handleInput('2'), className: numBtn },
    { label: '3', onClick: () => handleInput('3'), className: numBtn },
    { label: '+', onClick: () => handleInput('+'), className: opBtn },
    { label: '0', onClick: () => handleInput('0'), className: `${numBtn} col-span-2` },
    { label: '.', onClick: () => handleInput('.'), className: numBtn },
    { label: '=', onClick: handleEquals, className: equalsBtn },
  ];

  const scientificButtons = [
    { label: 'sin', onClick: () => handleFunction('sin'), className: trigBtn },
    { label: 'cos', onClick: () => handleFunction('cos'), className: trigBtn },
    { label: 'tan', onClick: () => handleFunction('tan'), className: trigBtn },
    { label: '(', onClick: () => handleInput('('), className: parenBtn },
    { label: ')', onClick: () => handleInput(')'), className: parenBtn },
    { label: 'asin', onClick: () => handleFunction('asin'), className: `${trigBtn} text-xs` },
    { label: 'acos', onClick: () => handleFunction('acos'), className: `${trigBtn} text-xs` },
    { label: 'atan', onClick: () => handleFunction('atan'), className: `${trigBtn} text-xs` },
    { label: 'x²', onClick: () => handleInput('^2'), className: powerBtn },
    { label: 'xʸ', onClick: () => handleInput('^'), className: powerBtn },
    { label: 'ln', onClick: () => handleFunction('ln'), className: logBtn },
    { label: 'log', onClick: () => handleFunction('log'), className: logBtn },
    { label: '√', onClick: () => handleFunction('sqrt', '√('), className: logBtn },
    { label: 'n!', onClick: handleFactorial, className: trigBtn },
    { label: 'π', onClick: () => handleConstant('π', 'π'), className: trigBtn },
    { label: 'e', onClick: () => handleConstant('e', 'e'), className: trigBtn },
  ];

  return (
    <LoggedInPageShell className="min-h-screen bg-stone-50 dark:bg-stone-950" user={user} onNavigate={onNavigate} onLogout={onLogout} currentPage="calculator">
      <section className="py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Page heading */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center px-4 py-1.5 bg-[#EAFFD6] dark:bg-[#58CC02]/20 text-[#58CC02] border-2 border-[#46A302] rounded-full text-sm font-extrabold uppercase tracking-wide mb-4">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-800 dark:text-stone-100 mb-2 tracking-tight">
              Scientific Calculator
            </h1>
            <p className="text-stone-500 dark:text-stone-400 font-semibold">
              Trigonometry, logarithms, powers & more. Perfect for math, physics & chemistry.
            </p>
          </div>

          {/* Calculator card */}
          <div className="border-2 border-b-4 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-2xl overflow-hidden">
            {/* Display */}
            <div className="p-4 sm:p-6 border-b-2 border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-extrabold uppercase tracking-wide text-stone-400 dark:text-stone-500">
                  {useDegrees ? 'DEG' : 'RAD'}
                </span>
                <button
                  onClick={() => setUseDegrees(!useDegrees)}
                  className="text-xs font-extrabold uppercase tracking-wide px-3 py-1.5 rounded-xl border-2 border-b-4 border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  {useDegrees ? 'Degrees' : 'Radians'}
                </button>
              </div>
              <div className="text-right font-mono text-2xl sm:text-3xl min-h-[2.5rem] break-all text-stone-800 dark:text-stone-100 font-extrabold">
                {display}
              </div>
              {expression && expression !== display && (
                <div className="text-right text-sm text-stone-400 dark:text-stone-500 font-mono truncate mt-1 font-semibold">
                  {expression}
                </div>
              )}
            </div>

            {/* Scientific toggle - mobile */}
            <div className="sm:hidden px-4 py-2 border-b-2 border-stone-200 dark:border-stone-700">
              <button
                onClick={() => setShowScientific(!showScientific)}
                className="w-full py-2 text-sm font-extrabold uppercase tracking-wide text-[#A560E8]"
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
                      className={`py-3 sm:py-2.5 ${btn.className}`}
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
                    className={`py-4 sm:py-5 text-lg ${btn.className}`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-stone-400 dark:text-stone-500 mt-6 font-semibold">
            No signup required. Use for homework, exams & study sessions.
          </p>
        </div>
      </section>

      <ToolPageSeoContent {...calcSeo} onNavigate={onNavigate} />

      <Footer onNavigate={onNavigate} />
    </LoggedInPageShell>
  );
};

export default CalculatorPage;
