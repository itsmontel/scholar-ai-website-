import { useState, useEffect } from 'react';
import Header from '../../common/Header';
import { WriteScholarEditorialBackgroundLayers } from '../../common/WriteScholarEditorialBackground';
import Footer from '../../common/Footer';
import ScholarMascot from '../../common/ScholarMascot';

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
    document.title = 'Free GPA Calculator — College & University Grades | WriteScholar';
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Free GPA calculator for college and high school students. Calculate your semester or cumulative GPA instantly. Add courses, credits, and grades. No signup required.');
    }
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
    if (gpa >= 3.7) return 'text-green-600';
    if (gpa >= 3.0) return 'text-blue-600';
    if (gpa >= 2.0) return 'text-yellow-600';
    return 'text-red-600';
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
    <div className="relative min-h-screen overflow-x-hidden">
      <WriteScholarEditorialBackgroundLayers position="fixed" />
      <Header onNavigate={onNavigate} user={user} onLogout={onLogout} currentPage="gpa-calculator" />

      {/* Hero Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-emerald-50/50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center justify-center mb-6">
              <ScholarMascot size={80} animated={false} pose="default" />
            </div>
            <span className="inline-flex items-center px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-semibold mb-5">
              Free Tool
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-5 leading-tight">
              GPA Calculator
            </h1>
            <p className="text-lg text-gray-500 leading-relaxed max-w-2xl mx-auto">
              Calculate your semester or cumulative GPA instantly. Add your courses, credit hours, and grades to see where you stand.
            </p>
          </div>
        </div>
      </section>

      {/* Main Tool Section */}
      <section className="py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Input Area */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Your Courses</h2>
                  <button
                    onClick={resetCalculator}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all font-medium"
                  >
                    Reset
                  </button>
                </div>

                {/* Header Row */}
                <div className="hidden sm:grid grid-cols-12 gap-3 mb-3 px-2">
                  <div className="col-span-5 text-sm font-medium text-gray-500">Course Name (optional)</div>
                  <div className="col-span-2 text-sm font-medium text-gray-500">Credits</div>
                  <div className="col-span-3 text-sm font-medium text-gray-500">Grade</div>
                  <div className="col-span-2 text-sm font-medium text-gray-500">Points</div>
                </div>

                {/* Course Rows */}
                <div className="space-y-3">
                  {courses.map((course, index) => (
                    <div key={course.id} className="grid grid-cols-12 gap-3 items-center p-3 bg-gray-50 rounded-xl">
                      <div className="col-span-12 sm:col-span-5">
                        <input
                          type="text"
                          value={course.name}
                          onChange={(e) => updateCourse(course.id, 'name', e.target.value)}
                          placeholder={`Course ${index + 1}`}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <select
                          value={course.credits}
                          onChange={(e) => updateCourse(course.id, 'credits', parseInt(e.target.value))}
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
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
                          className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                          {gradeOptions.map(g => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-center">
                        <span className="text-sm font-semibold text-gray-700">
                          {(course.credits * gradePoints[course.grade]).toFixed(1)}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-right">
                        <button
                          onClick={() => removeCourse(course.id)}
                          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
                  className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 text-gray-600 font-medium rounded-xl hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                >
                  + Add Course
                </button>
              </div>
            </div>

            {/* GPA Results Panel */}
            <div className="space-y-6">
              {/* Main GPA Display */}
              <div className="bg-violet-600 rounded-2xl p-6 text-white text-center">
                <h3 className="text-lg font-semibold mb-2 opacity-90">Your GPA</h3>
                <div className={`text-6xl font-bold mb-2`}>
                  {gpa.toFixed(2)}
                </div>
                <div className="text-emerald-100 text-lg font-medium">
                  {getGPALabel(gpa)}
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Credits</span>
                    <span className="font-semibold text-gray-900">{totalCredits}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Total Quality Points</span>
                    <span className="font-semibold text-gray-900">{totalPoints.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">Courses</span>
                    <span className="font-semibold text-gray-900">{courses.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Letter Grade</span>
                    <span className={`font-bold text-lg ${getGPAColor(gpa)}`}>
                      {gpa >= 3.7 ? 'A' : gpa >= 3.0 ? 'B' : gpa >= 2.0 ? 'C' : gpa >= 1.0 ? 'D' : 'F'}
                    </span>
                  </div>
                </div>
              </div>

              {/* GPA Scale Reference */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">GPA Scale</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">A+ / A</span>
                    <span className="font-medium text-gray-900">4.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">A-</span>
                    <span className="font-medium text-gray-900">3.7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">B+</span>
                    <span className="font-medium text-gray-900">3.3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">B</span>
                    <span className="font-medium text-gray-900">3.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">B-</span>
                    <span className="font-medium text-gray-900">2.7</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">C+</span>
                    <span className="font-medium text-gray-900">2.3</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">C</span>
                    <span className="font-medium text-gray-900">2.0</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-12 sm:py-16 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Tips for Improving Your GPA</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Prioritize High-Credit Courses</h3>
              <p className="text-gray-600 text-sm">A good grade in a 4-credit course impacts your GPA more than in a 2-credit course.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Start Strong Each Semester</h3>
              <p className="text-gray-600 text-sm">It&apos;s easier to maintain a high GPA than to raise a low one. Begin each term with focus.</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Use Office Hours</h3>
              <p className="text-gray-600 text-sm">Professors notice students who seek help. It can make the difference between a B+ and an A.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
            Need help with your coursework?
          </h2>
          <p className="text-gray-400 mb-8 max-w-xl mx-auto">
            WriteScholar helps you write better papers, find citations, and study smarter with AI-powered tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {user ? (
              <button 
                onClick={() => onNavigate('dashboard')}
                className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <button 
                  onClick={() => onNavigate('signup')}
                  className="px-6 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Try WriteScholar Free
                </button>
                <button 
                  onClick={() => onNavigate('features')}
                  className="px-6 py-3 border border-gray-600 text-white font-medium rounded-xl hover:border-gray-500 transition-colors"
                >
                  Learn More
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};

export default GPACalculatorPage;
