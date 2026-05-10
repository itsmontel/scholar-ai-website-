import { useState, useMemo } from 'react';
import EmbedFrame from './EmbedFrame';

/**
 * Embeddable GPA Calculator.
 *
 * Lightweight version of /tools/gpa-calculator designed to be dropped into
 * other sites via <iframe>. Standalone — no auth, no history, no plan limits.
 * Uses a US 4.0 grade scale with +/- letter grades.
 */

interface Course {
  id: number;
  name: string;
  credits: string;
  grade: string;
}

const GRADE_TO_POINTS: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
};
const GRADES = Object.keys(GRADE_TO_POINTS);

let nextId = 4;

const EmbedGPACalculator = () => {
  const [courses, setCourses] = useState<Course[]>([
    { id: 1, name: '', credits: '3', grade: 'A' },
    { id: 2, name: '', credits: '3', grade: 'B+' },
    { id: 3, name: '', credits: '4', grade: 'A-' },
  ]);

  const gpa = useMemo(() => {
    let totalPoints = 0;
    let totalCredits = 0;
    for (const c of courses) {
      const credits = parseFloat(c.credits) || 0;
      const points = GRADE_TO_POINTS[c.grade] ?? 0;
      totalPoints += credits * points;
      totalCredits += credits;
    }
    if (totalCredits === 0) return null;
    return totalPoints / totalCredits;
  }, [courses]);

  const updateCourse = (id: number, patch: Partial<Course>) => {
    setCourses((cs) => cs.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const addCourse = () => {
    setCourses((cs) => [...cs, { id: nextId++, name: '', credits: '3', grade: 'A' }]);
  };

  const removeCourse = (id: number) => {
    setCourses((cs) => (cs.length > 1 ? cs.filter((c) => c.id !== id) : cs));
  };

  return (
    <EmbedFrame title="GPA Calculator" toolPath="/tools/gpa-calculator" accent="#58CC02">
      <div className="max-w-2xl mx-auto">
        {/* GPA display */}
        <div className="text-center mb-5 rounded-2xl border-2 border-b-4 border-[#58CC02]/40 bg-[#E5F8D0]/40 dark:bg-[#58CC02]/10 p-5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#58CC02] mb-1">
            Your GPA
          </div>
          <div className="text-4xl sm:text-5xl font-extrabold text-stone-900 dark:text-stone-50 tabular-nums">
            {gpa !== null ? gpa.toFixed(2) : '–'}
          </div>
          <div className="text-[12px] text-stone-600 dark:text-stone-400 mt-1">
            Out of 4.00
          </div>
        </div>

        {/* Courses table */}
        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-[1fr_70px_85px_32px] gap-2 px-2 text-[11px] font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            <span>Course</span>
            <span>Credits</span>
            <span>Grade</span>
            <span></span>
          </div>
          {courses.map((c) => (
            <div key={c.id} className="grid grid-cols-[1fr_70px_85px_32px] gap-2 items-center">
              <input
                type="text"
                placeholder="Course name (optional)"
                value={c.name}
                onChange={(e) => updateCourse(c.id, { name: e.target.value })}
                className="rounded-lg border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-3 py-2 text-sm focus:outline-none focus:border-[#58CC02] text-stone-900 dark:text-stone-50"
              />
              <input
                type="number"
                step="0.5"
                min="0"
                max="20"
                value={c.credits}
                onChange={(e) => updateCourse(c.id, { credits: e.target.value })}
                className="rounded-lg border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-2 text-sm tabular-nums text-center focus:outline-none focus:border-[#58CC02] text-stone-900 dark:text-stone-50"
              />
              <select
                value={c.grade}
                onChange={(e) => updateCourse(c.id, { grade: e.target.value })}
                className="rounded-lg border-2 border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 px-2 py-2 text-sm font-bold focus:outline-none focus:border-[#58CC02] text-stone-900 dark:text-stone-50"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeCourse(c.id)}
                aria-label="Remove course"
                disabled={courses.length === 1}
                className="w-8 h-8 rounded-lg border-2 border-stone-200 dark:border-stone-700 text-stone-500 hover:text-red-500 hover:border-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addCourse}
          className="w-full rounded-xl border-2 border-dashed border-[#58CC02] bg-[#E5F8D0]/30 dark:bg-[#58CC02]/10 text-[#58CC02] font-extrabold py-2.5 text-sm hover:bg-[#E5F8D0]/60 transition-colors"
        >
          + Add another course
        </button>
      </div>
    </EmbedFrame>
  );
};

export default EmbedGPACalculator;
