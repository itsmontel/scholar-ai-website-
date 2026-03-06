import { useState, useEffect, useCallback } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';

interface ConverterPageProps {
  onNavigate: (page: string) => void;
  user?: unknown;
  onLogout?: () => void;
}

type CategoryId = 'length' | 'weight' | 'temperature' | 'volume' | 'area' | 'time';

interface Unit {
  id: string;
  label: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

// Conversion factors to/from base unit
const categories: Record<CategoryId, { label: string; icon: string; units: Unit[] }> = {
  length: {
    label: 'Length',
    icon: '📏',
    units: [
      { id: 'm', label: 'Meters (m)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ft', label: 'Feet (ft)', toBase: (v) => v / 3.28084, fromBase: (v) => v * 3.28084 },
      { id: 'yd', label: 'Yards (yd)', toBase: (v) => v / 1.09361, fromBase: (v) => v * 1.09361 },
      { id: 'in', label: 'Inches (in)', toBase: (v) => v / 39.3701, fromBase: (v) => v * 39.3701 },
      { id: 'cm', label: 'Centimeters (cm)', toBase: (v) => v / 100, fromBase: (v) => v * 100 },
      { id: 'km', label: 'Kilometers (km)', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
      { id: 'mi', label: 'Miles (mi)', toBase: (v) => v * 1609.34, fromBase: (v) => v / 1609.34 },
      { id: 'mm', label: 'Millimeters (mm)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
    ],
  },
  weight: {
    label: 'Weight',
    icon: '⚖️',
    units: [
      { id: 'kg', label: 'Kilograms (kg)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'g', label: 'Grams (g)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'lb', label: 'Pounds (lb)', toBase: (v) => v / 2.20462, fromBase: (v) => v * 2.20462 },
      { id: 'oz', label: 'Ounces (oz)', toBase: (v) => v / 35.274, fromBase: (v) => v * 35.274 },
      { id: 'mg', label: 'Milligrams (mg)', toBase: (v) => v / 1e6, fromBase: (v) => v * 1e6 },
      { id: 'st', label: 'Stone (st)', toBase: (v) => v * 6.35029, fromBase: (v) => v / 6.35029 },
    ],
  },
  temperature: {
    label: 'Temperature',
    icon: '🌡️',
    units: [
      { id: 'c', label: 'Celsius (°C)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'f', label: 'Fahrenheit (°F)', toBase: (v) => (v - 32) * (5 / 9), fromBase: (v) => v * (9 / 5) + 32 },
      { id: 'k', label: 'Kelvin (K)', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
    ],
  },
  volume: {
    label: 'Volume',
    icon: '🧪',
    units: [
      { id: 'l', label: 'Liters (L)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ml', label: 'Milliliters (mL)', toBase: (v) => v / 1000, fromBase: (v) => v * 1000 },
      { id: 'gal', label: 'US Gallons (gal)', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
      { id: 'floz', label: 'Fluid Ounces (fl oz)', toBase: (v) => v * 0.0295735, fromBase: (v) => v / 0.0295735 },
      { id: 'cup', label: 'Cups (cup)', toBase: (v) => v * 0.236588, fromBase: (v) => v / 0.236588 },
      { id: 'tbsp', label: 'Tablespoons (tbsp)', toBase: (v) => v * 0.0147868, fromBase: (v) => v / 0.0147868 },
    ],
  },
  area: {
    label: 'Area',
    icon: '⬜',
    units: [
      { id: 'm2', label: 'Square Meters (m²)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'ft2', label: 'Square Feet (ft²)', toBase: (v) => v / 10.7639, fromBase: (v) => v * 10.7639 },
      { id: 'yd2', label: 'Square Yards (yd²)', toBase: (v) => v / 1.19599, fromBase: (v) => v * 1.19599 },
      { id: 'ac', label: 'Acres (ac)', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
      { id: 'ha', label: 'Hectares (ha)', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
      { id: 'in2', label: 'Square Inches (in²)', toBase: (v) => v / 1550, fromBase: (v) => v * 1550 },
    ],
  },
  time: {
    label: 'Time',
    icon: '⏱️',
    units: [
      { id: 's', label: 'Seconds (s)', toBase: (v) => v, fromBase: (v) => v },
      { id: 'min', label: 'Minutes (min)', toBase: (v) => v * 60, fromBase: (v) => v / 60 },
      { id: 'hr', label: 'Hours (hr)', toBase: (v) => v * 3600, fromBase: (v) => v / 3600 },
      { id: 'day', label: 'Days (day)', toBase: (v) => v * 86400, fromBase: (v) => v / 86400 },
      { id: 'wk', label: 'Weeks (wk)', toBase: (v) => v * 604800, fromBase: (v) => v / 604800 },
    ],
  },
};

const categoryIds: CategoryId[] = ['length', 'weight', 'temperature', 'volume', 'area', 'time'];

function formatResult(val: number): string {
  if (val === 0) return '0';
  if (Math.abs(val) >= 1e9 || (Math.abs(val) < 1e-6 && val !== 0)) {
    return val.toExponential(4);
  }
  if (Math.abs(val) >= 1000 || (Math.abs(val) < 0.01 && val !== 0)) {
    return val.toLocaleString('en-US', { maximumFractionDigits: 6, minimumFractionDigits: 0 });
  }
  return val.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

const ConverterPage = ({ onNavigate, user, onLogout }: ConverterPageProps) => {
  const [category, setCategory] = useState<CategoryId>('length');
  const [fromUnit, setFromUnit] = useState('m');
  const [toUnit, setToUnit] = useState('ft');
  const [fromValue, setFromValue] = useState('');
  const [toValue, setToValue] = useState('');

  useEffect(() => {
    document.title = 'Free Unit Converter – Length, Weight, Temperature & More | WriteScholar';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', 'Free online unit converter for students. Convert meters to feet, inches to cm, kg to lbs, Celsius to Fahrenheit, and more. Length, weight, temperature, volume, area, time. No signup required.');
    }
  }, []);

  const convert = useCallback(() => {
    const num = parseFloat(fromValue.replace(/,/g, ''));
    if (isNaN(num) || fromValue.trim() === '') {
      setToValue('');
      return;
    }
    const cat = categories[category];
    const from = cat.units.find((u) => u.id === fromUnit);
    const to = cat.units.find((u) => u.id === toUnit);
    if (!from || !to) return;
    const base = from.toBase(num);
    const result = to.fromBase(base);
    setToValue(formatResult(result));
  }, [category, fromUnit, toUnit, fromValue]);

  useEffect(() => {
    convert();
  }, [convert]);

  const handleCategoryChange = (id: CategoryId) => {
    setCategory(id);
    const cat = categories[id];
    setFromUnit(cat.units[0].id);
    setToUnit(cat.units[1]?.id ?? cat.units[0].id);
  };

  const swapUnits = () => {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
    setFromValue(toValue);
    setToValue(fromValue);
  };

  const cat = categories[category];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white dark:from-stone-900 dark:to-stone-800">
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="converter" />

      <section className="py-12 sm:py-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <span className="inline-flex items-center px-4 py-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full text-sm font-semibold mb-4">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl font-bold text-stone-800 dark:text-stone-100 mb-2">
              Unit Converter
            </h1>
            <p className="text-stone-500 dark:text-stone-400">
              Convert length, weight, temperature, volume, area & time. Meters to feet, inches to cm, kg to lbs & more.
            </p>
          </div>

          <div className="bg-white dark:bg-stone-800 rounded-3xl shadow-xl border border-stone-200 dark:border-stone-700 overflow-hidden">
            {/* Category tabs */}
            <div className="flex flex-wrap gap-2 p-4 border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900/50">
              {categoryIds.map((id) => (
                <button
                  key={id}
                  onClick={() => handleCategoryChange(id)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    category === id
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-600'
                  }`}
                >
                  <span className="mr-1.5">{categories[id].icon}</span>
                  {categories[id].label}
                </button>
              ))}
            </div>

            {/* Converter inputs */}
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">From</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fromValue}
                    onChange={(e) => setFromValue(e.target.value)}
                    placeholder="0"
                    className="flex-1 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 text-lg font-mono focus:ring-2 focus:ring-amber-400 focus:border-transparent"
                  />
                  <select
                    value={fromUnit}
                    onChange={(e) => setFromUnit(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 min-w-[140px]"
                  >
                    {cat.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={swapUnits}
                  className="p-2 rounded-full bg-stone-200 dark:bg-stone-600 hover:bg-stone-300 dark:hover:bg-stone-500 text-stone-600 dark:text-stone-300 transition-colors"
                  title="Swap units"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-stone-500 dark:text-stone-400 mb-2">To</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    readOnly
                    value={toValue}
                    className="flex-1 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-900/50 text-stone-800 dark:text-stone-100 text-lg font-mono"
                  />
                  <select
                    value={toUnit}
                    onChange={(e) => setToUnit(e.target.value)}
                    className="px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-800 dark:text-stone-100 min-w-[140px]"
                  >
                    {cat.units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-stone-500 dark:text-stone-400 mt-6">
            No signup required. Perfect for homework, labs & everyday conversions.
          </p>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default ConverterPage;
