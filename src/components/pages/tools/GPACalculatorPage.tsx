import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';
import { applyPageSeoTags, injectToolProductSchema, removeJsonLd } from '../../../utils/seo';
import ToolPageSeoContent from '../../common/ToolPageSeoContent';
import { gpaSeo } from '../../../data/toolSeoContent';

interface GPACalculatorPageProps {
  onNavigate: (page: string) => void;
  user?: any;
  onLogout: () => void;
}

interface Course {
  id: string;
  name: string;
  credits: number;
  grade: string;
}

const gradePoints: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0
};

const gradeOptions = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

const GPACalculatorPage = ({ onNavigate, user, onLogout }: GPACalculatorPageProps) => {
  const [courses, setCourses] = useState<Course[]>([
    { id: '1', name: '', credits: 3, grade: 'A' },
    { id: '2', name: '', credits: 3, grade: 'A' },
    { id: '3', name: '', credits: 3, grade: 'A' },
  ]);
  const [gpa, setGpa] = useState<number>(0);
  const [totalCredits, setTotalCredits] = useState<number>(0);
  const [totalPoints, setTotalPoints] = useState<number>(0);

  useEffect(() => {
    applyPageSeoTags({
      title: 'Free GPA Calculator — College & University Grades | WriteScholar',
      description: 'Free GPA calculator for college and high school students. Calculate your semester or cumulative GPA instantly. Add courses, credits, and grades. No signup required.',
    });
    injectToolProductSchema({
      name: 'GPA Calculator',
      description: 'Free GPA calculator for college and high school students — add courses, credits, and grades to instantly compute semester or cumulative GPA.',
    });
    return () => removeJsonLd('tool-product');
  }, []);

  useEffect(() => {
    let credits = 0;
    let points = 0;

    courses.forEach(course => {
      if (course.credits > 0 && course.grade) {
        credits += course.credits;
        points += course.credits * gradePoints[course.grade];
      }
    });

    setTotalCredits(credits);
    setTotalPoints(points);
    setGpa(credits > 0 ? points / credits : 0);
  }, [courses]);

  const addCourse = () => {
    setCourses([...courses, {
      id: Date.now().toString(),
      name: '',
      credits: 3,
      grade: 'A'
    }]);
  };

  const removeCourse = (id: string) => {
    if (courses.length > 1) {
      setCourses(courses.filter(c => c.id !== id));
    }
  };

  const updateCourse = (id: string, field: keyof Course, value: string | number) => {
    setCourses(courses.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const resetCalculator = () => {
    setCourses([
      { id: '1', name: '', credits: 3, grade: 'A' },
      { id: '2', name: '', credits: 3, grade: 'A' },
      { id: '3', name: '', credits: 3, grade: 'A' },
    ]);
  };

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.7) return 'text-[#58CC02]';
    if (gpa >= 3.0) return 'text-[#1CB0F6]';
    if (gpa >= 2.0) return 'text-[#FF9600]';
    return 'text-[#FF4B4B]';
  };

  const getGPALabel = (gpa: number) => {
    if (gpa >= 3.9) return "Dean's List";
    if (gpa >= 3.7) return 'Excellent';
    if (gpa >= 3.3) return 'Very Good';
    if (gpa >= 3.0) return 'Good';
    if (gpa >= 2.5) return 'Above Average';
    if (gpa >= 2.0) return 'Average';
    if (gpa >= 1.0) return 'Below Average';
    return 'Failing';
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-stone-50 dark:bg-stone-950" style={{ fontFamily: '"Nunito", system-ui, sans-serif' }}>
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="gpa-calculator" />

      {/* Hero Section */}
      <section className="pt-16 pb-10 sm:pt-20 sm:pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center mb-5">
              <ScholarMascot size={80} animated={false} pose="default" />
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-[#EAFFD6] text-[#58CC02] rounded-xl border-2 border-b-4 border-[#58CC02]/30 text-sm font-extrabold mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-stone-800 dark:text-stone-100 mb-4 leading-tight tracking-tight">
              GPA Calculator
            </h1>
            <p className="text-base text-stone-500 dark:text-stone-400 leading-relaxed max-w-2xl mx-auto font-bold">
              Calculate your semester or cumulative GPA instantly. Add your courses, credit hours, and grades to see where you stand.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="pb-12 sm:pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Course Input Area */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-extrabold text-stone-800 dark:text-stone-100">Your Courses</h2>
                  <button
                    onClick={resetCalculator}
                    className="px-4 py-2 text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all font-bold border-2 border-stone-200 dark:border-stone-700"
                  >
                    Reset
                  </button>
                </div>

                {/* Header Row */}
                <div className="hidden sm:grid grid-cols-12 gap-3 mb-3 px-2">
                  <div className="col-span-5 text-xs font-extrabold text-stone-400 uppercase tracking-wide">Course Name (optional)</div>
                  <div className="col-span-2 text-xs font-extrabold text-stone-400 uppercase tracking-wide">Credits</div>
                  <div className="col-span-3 text-xs font-extrabold text-stone-400 uppercase tracking-wide">Grade</div>
                  <div className="col-span-2 text-xs font-extrabold text-stone-400 uppercase tracking-wide">Points</div>
                </div>

                {/* Course Rows */}
                <div className="space-y-3">
                  {courses.map((course, index) => (
                    <div key={course.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-stone-50 dark:bg-stone-800 rounded-xl border-2 border-stone-200 dark:border-stone-700">
                      <div className="col-span-12 sm:col-span-5">
                        <input
                          type="text"
                          value={course.name}
                          onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                          placeholder={`Course ${index + 1}`}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-600 rounded-lg focus:outline-none focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 text-stone-800 dark:text-stone-100"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <select
                          value={course.credits}
                          onChange={(e) => updateCourse(course.id, 'credits', parseInt(e.target.value))}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-600 rounded-lg focus:outline-none focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 text-stone-800 dark:text-stone-100"
                        >
                          {[1, 2, 3, 4, 5, 6].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-4 sm:col-span-3">
                        <select
                          value={course.grade}
                          onChange={(e) => updateCourse(course.id, 'grade', e.target.value)}
                          className="w-full px-3 py-2 text-sm bg-white dark:bg-stone-900 border-2 border-stone-200 dark:border-stone-600 rounded-lg focus:outline-none focus:border-[#1CB0F6] focus:ring-2 focus:ring-[#1CB0F6]/20 text-stone-800 dark:text-stone-100"
                        >
                          {gradeOptions.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-center">
                        <span className="text-sm font-extrabold text-stone-700 dark:text-stone-300">
                          {(course.credits * gradePoints[course.grade]).toFixed(1)}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-right">
                        <button
                          onClick={() => removeCourse(course.id)}
                          className="p-2 text-stone-400 hover:text-[#FF4B4B] hover:bg-[#FFE8E8] dark:hover:bg-[#FF4B4B]/10 rounded-lg transition-colors"
                          disabled={courses.length <= 1}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={addCourse}
                  className="mt-4 w-full py-3 border-2 border-dashed border-stone-300 dark:border-stone-600 text-stone-500 dark:text-stone-400 font-extrabold rounded-xl hover:border-[#58CC02] hover:text-[#58CC02] hover:bg-[#EAFFD6] dark:hover:bg-[#58CC02]/10 transition-all"
                >
                  + Add Course
                </button>
              </div>
            </div>

            {/* GPA Results Panel */}
            <div className="space-y-5">
              {/* Main GPA Display */}
              <div className="bg-[#58CC02] border-2 border-b-4 border-[#46A302] rounded-2xl p-6 text-center">
                <h3 className="text-sm font-extrabold uppercase tracking-wide mb-2 text-white/80">Your GPA</h3>
                <div className="text-6xl font-extrabold text-white mb-2">
                  {gpa.toFixed(2)}
                </div>
                <div className="text-white/90 text-lg font-extrabold">
                  {getGPALabel(gpa)}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white dark:bg-stone-900 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl p-5">
                <h3 className="text-sm font-extrabold text-stone-800 dark:text-stone-100 mb-4 uppercase tracking-wide">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b-2 border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500 dark:text-stone-400 font-bold text-sm">Total Credits</span>
                    <span className="font-extrabold text-stone-800 dark:text-stone-100">{totalCredits}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b-2 border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500 dark:text-stone-400 font-bold text-sm">Quality Points</span>
                    <span className="font-extrabold text-stone-800 dark:text-stone-100">{totalPoints.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b-2 border-stone-100 dark:border-stone-800">
                    <span className="text-stone-500 dark:text-stone-400 font-bold text-sm">Courses</span>
                    <span className="font-extrabold text-stone-800 dark:text-stone-100">{courses.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-stone-500 dark:text-stone-400 font-bold text-sm">Letter Grade</span>
                    <span className={`font-extrabold text-lg ${getGPAColor(gpa)}`}>
                      {gpa >= 3.7 ? 'A' : gpa >= 3.0 ? 'B' : gpa >= 2.0 ? 'C' : gpa >= 1.0 ? 'D' : 'F'}
                    </span>
                  </div>
                </div>
              </div>

              {/* GPA Scale Reference */}
              <div className="bg-stone-100 dark:bg-stone-800 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl p-5">
                <h3 className="text-sm font-extrabold text-stone-800 dark:text-stone-100 mb-4 uppercase tracking-wide">GPA Scale</h3>
                <div className="space-y-2 text-sm">
                  {[
                    { grade: 'A+ / A', points: '4.0' },
                    { grade: 'A-', points: '3.7' },
                    { grade: 'B+', points: '3.3' },
                    { grade: 'B', points: '3.0' },
                    { grade: 'B-', points: '2.7' },
                    { grade: 'C+', points: '2.3' },
                    { grade: 'C', points: '2.0' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-stone-500 dark:text-stone-400 font-bold">{row.grade}</span>
                      <span className="font-extrabold text-stone-800 dark:text-stone-100">{row.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 sm:py-16 bg-stone-100 dark:bg-stone-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-extrabold text-stone-800 dark:text-stone-100 mb-8 text-center tracking-tight">Tips for Improving Your GPA</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: '📊', title: 'Prioritize High-Credit Courses', desc: 'A good grade in a 4-credit course impacts your GPA more than in a 2-credit course.', color: '#58CC02', tint: '#EAFFD6' },
              { icon: '🚀', title: 'Start Strong Each Semester', desc: "It's easier to maintain a high GPA than to raise a low one. Begin each term with focus.", color: '#A560E8', tint: '#F3EAFF' },
              { icon: '⚡', title: 'Use Office Hours', desc: 'Professors notice students who seek help. It can make the difference between a B+ and an A.', color: '#FF4B4B', tint: '#FFE8E8' },
            ].map((tip, i) => (
              <div key={i} className="bg-white dark:bg-stone-800 border-2 border-b-4 border-stone-200 dark:border-stone-700 rounded-2xl p-5">
                <div
                  className="w-12 h-12 rounded-xl border-2 border-b-[3px] flex items-center justify-center mb-4 text-xl"
                  style={{ backgroundColor: `${tip.color}20`, borderColor: `${tip.color}50` }}
                >
                  {tip.icon}
                </div>
                <h3 className="font-extrabold text-stone-800 dark:text-stone-100 mb-2">{tip.title}</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm font-bold">{tip.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-[#58CC02]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4 tracking-tight">
            Need help with your coursework?
          </h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto font-bold">
            WriteScholar helps you write better papers, find citations, and study smarter with AI-powered tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3.5 bg-white text-[#58CC02] font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] hover:bg-stone-50 active:border-b-2 active:translate-y-0.5 transition-all"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3.5 bg-white text-[#58CC02] font-extrabold uppercase tracking-wide rounded-xl border-2 border-b-4 border-[#46A302] hover:bg-stone-50 active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Try WriteScholar Free
                </button>
                <button
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3.5 border-2 border-b-4 border-white/40 text-white font-extrabold uppercase tracking-wide rounded-xl hover:bg-white/10 active:border-b-2 active:translate-y-0.5 transition-all"
                >
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <ToolPageSeoContent {...gpaSeo} onNavigate={onNavigate} />

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default GPACalculatorPage;
