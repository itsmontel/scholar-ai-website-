import React, { useState } from 'react';

const AboutPage = ({ onNavigate }) => {
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const teamMembers = [
    {
      name: 'Dr. Elena Rodriguez',
      role: 'CEO & Co-Founder',
      education: 'PhD Computer Science, Stanford University',
      background: 'Former Research Scientist at Google AI, 15+ years in NLP and machine learning',
      image: 'ER',
      expertise: ['Natural Language Processing', 'AI Research', 'Academic Publishing']
    },
    {
      name: 'Prof. Michael Chen',
      role: 'Chief Academic Officer',
      education: 'PhD English Literature, Harvard University',
      background: 'Professor of Academic Writing, 20+ years teaching and research experience',
      image: 'MC',
      expertise: ['Academic Writing', 'Curriculum Development', 'Pedagogy']
    },
    {
      name: 'Dr. Sarah Kim',
      role: 'CTO & Co-Founder',
      education: 'PhD Computer Science, MIT',
      background: 'Former Principal Engineer at Microsoft, expert in distributed systems and AI',
      image: 'SK',
      expertise: ['Software Architecture', 'AI Systems', 'Scalable Computing']
    },
    {
      name: 'Dr. James Wilson',
      role: 'Head of AI Research',
      education: 'PhD Computational Linguistics, UC Berkeley',
      background: 'Former Research Lead at OpenAI, specializing in language models',
      image: 'JW',
      expertise: ['Language Models', 'Deep Learning', 'Academic Text Analysis']
    },
    {
      name: 'Dr. Maria González',
      role: 'Head of Product',
      education: 'PhD Education Technology, Columbia University',
      background: 'Former Product Manager at Coursera, expert in educational software',
      image: 'MG',
      expertise: ['Product Strategy', 'User Experience', 'Educational Technology']
    },
    {
      name: 'Dr. David Park',
      role: 'Head of Partnerships',
      education: 'PhD Information Science, University of Washington',
      background: 'Former Director of Academic Relations at Adobe, 12+ years in EdTech',
      image: 'DP',
      expertise: ['Academic Partnerships', 'Institutional Sales', 'Strategy']
    }
  ];

  const advisors = [
    {
      name: 'Dr. Anne Thompson',
      role: 'Professor Emeritus of English',
      institution: 'Yale University',
      expertise: 'Academic Writing Standards'
    },
    {
      name: 'Dr. Robert Liu',
      role: 'Former VP of Engineering',
      institution: 'Grammarly',
      expertise: 'Language Technology'
    },
    {
      name: 'Dr. Jennifer Adams',
      role: 'Dean of Graduate Studies',
      institution: 'Princeton University',
      expertise: 'Higher Education'
    }
  ];

  const milestones = [
    {
      year: '2022',
      title: 'Company Founded',
      description: 'AcademicAI was founded by a team of AI researchers and academic writing experts'
    },
    {
      year: '2023',
      title: 'First Product Launch',
      description: 'Launched our AI-powered academic writing analysis platform'
    },
    {
      year: '2023',
      title: 'University Partnerships',
      description: 'Established partnerships with 50+ universities worldwide'
    },
    {
      year: '2024',
      title: 'Series A Funding',
      description: 'Raised $15M Series A to expand our AI capabilities and team'
    },
    {
      year: '2024',
      title: 'Global Expansion',
      description: 'Expanded to serve 500,000+ users across 40 countries'
    },
    {
      year: '2025',
      title: 'AI Breakthrough',
      description: 'Achieved 99.7% accuracy in academic writing analysis'
    }
  ];

  const testimonials = [
    {
      quote: "AcademicAI has transformed how our students approach academic writing. The detailed feedback helps them understand not just what to fix, but why.",
      author: "Dr. Patricia Collins",
      role: "Professor of Psychology",
      institution: "University of California, Berkeley",
      avatar: "PC"
    },
    {
      quote: "As a non-native English speaker, AcademicAI has been invaluable in helping me improve my academic writing for international publications.",
      author: "Dr. Hiroshi Tanaka",
      role: "Research Fellow",
      institution: "Tokyo Institute of Technology",
      avatar: "HT"
    },
    {
      quote: "The institutional dashboard gives us insights into our students' writing progress that we never had before. It's revolutionizing our writing support programs.",
      author: "Dr. Amanda Foster",
      role: "Director of Writing Center",
      institution: "Duke University",
      avatar: "AF"
    }
  ];

  const values = [
    {
      title: 'Academic Excellence',
      description: 'We are committed to upholding the highest standards of academic integrity and quality',
      icon: '🎓'
    },
    {
      title: 'Innovation',
      description: 'We push the boundaries of AI technology to solve real problems in academic writing',
      icon: '🚀'
    },
    {
      title: 'Accessibility',
      description: 'We believe quality academic writing support should be available to everyone, everywhere',
      icon: '🌍'
    },
    {
      title: 'Privacy',
      description: 'We protect your academic work with enterprise-grade security and never share your content',
      icon: '🔒'
    },
    {
      title: 'Collaboration',
      description: 'We work closely with educators and institutions to build tools that truly serve academic communities',
      icon: '🤝'
    },
    {
      title: 'Continuous Learning',
      description: 'We constantly improve our AI models based on user feedback and the latest research',
      icon: '📈'
    }
  ];

  const stats = [
    { value: '500K+', label: 'Active Users' },
    { value: '2M+', label: 'Documents Analyzed' },
    { value: '200+', label: 'Partner Universities' },
    { value: '40+', label: 'Countries Served' },
    { value: '99.7%', label: 'Analysis Accuracy' },
    { value: '24/7', label: 'Support Available' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">A</span>
          </div>
          <span className="text-xl font-bold text-gray-900">AcademicAI</span>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <button onClick={() => onNavigate('landing')} className="text-gray-600 hover:text-gray-900 transition-colors">Home</button>
          <button onClick={() => onNavigate('features')} className="text-gray-600 hover:text-gray-900 transition-colors">Features</button>
          <button onClick={() => onNavigate('pricing')} className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</button>
          <button className="text-blue-600 font-medium">About</button>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={() => onNavigate('login')} className="text-gray-600 hover:text-gray-900 transition-colors">
            Login
          </button>
          <button onClick={() => onNavigate('signup')} className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors">
            Sign up
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-20">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Empowering Academic Excellence Through
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> AI Innovation</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Founded by researchers for researchers, AcademicAI combines cutting-edge artificial intelligence 
            with deep academic expertise to help scholars, students, and institutions achieve their writing goals.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-6 gap-6 mb-20">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mission Section */}
        <div className="mb-20">
          <div className="bg-white rounded-2xl shadow-xl p-12">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
              <p className="text-xl text-gray-700 leading-relaxed mb-8">
                To democratize access to high-quality academic writing support by harnessing the power of 
                artificial intelligence, enabling researchers, students, and educators worldwide to communicate 
                their ideas with clarity, precision, and impact.
              </p>
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Precision</h3>
                  <p className="text-gray-600 text-sm">Accurate, detailed feedback that helps improve every aspect of academic writing</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Speed</h3>
                  <p className="text-gray-600 text-sm">Instant analysis and feedback to accelerate the writing and revision process</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🌟</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">Excellence</h3>
                  <p className="text-gray-600 text-sm">Supporting the highest standards of academic communication and scholarship</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                <div className="text-3xl mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">Leadership Team</h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our team combines decades of experience in artificial intelligence, academic research, 
            and educational technology to create the most advanced academic writing platform.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">{member.image}</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                      <p className="text-blue-600 font-medium">{member.role}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Education</h4>
                      <p className="text-gray-600 text-sm">{member.education}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Background</h4>
                      <p className="text-gray-600 text-sm">{member.background}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm">Expertise</h4>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {member.expertise.map((skill, skillIndex) => (
                          <span key={skillIndex} className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Advisors */}
          <div className="mt-16">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Advisory Board</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {advisors.map((advisor, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 text-center">
                  <h4 className="font-semibold text-gray-900">{advisor.name}</h4>
                  <p className="text-blue-600 text-sm">{advisor.role}</p>
                  <p className="text-gray-600 text-sm">{advisor.institution}</p>
                  <p className="text-gray-500 text-xs mt-2">{advisor.expertise}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Journey</h2>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-blue-200"></div>
            <div className="space-y-12">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`w-1/2 ${index % 2 === 0 ? 'pr-8 text-right' : 'pl-8'}`}>
                    <div className="bg-white rounded-xl shadow-lg p-6">
                      <div className="text-2xl font-bold text-blue-600 mb-2">{milestone.year}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                      <p className="text-gray-600">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="relative z-10">
                    <div className="w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>
                  </div>
                  <div className="w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">What Educators Say</h2>
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-12">
              <div className="text-center">
                <div className="text-6xl text-blue-200 mb-4">"</div>
                <blockquote className="text-xl text-gray-900 mb-6 leading-relaxed">
                  {testimonials[activeTestimonial].quote}
                </blockquote>
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{testimonials[activeTestimonial].avatar}</span>
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-gray-900">{testimonials[activeTestimonial].author}</div>
                    <div className="text-blue-600">{testimonials[activeTestimonial].role}</div>
                    <div className="text-gray-500 text-sm">{testimonials[activeTestimonial].institution}</div>
                  </div>
                </div>
              </div>
              
              {/* Testimonial Navigation */}
              <div className="flex justify-center mt-8 space-x-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTestimonial(index)}
                    className={`w-3 h-3 rounded-full transition-colors ${
                      index === activeTestimonial ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Join Our Mission</h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto">
            Whether you're a student, researcher, educator, or institution, we're here to support your academic writing journey.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => onNavigate('signup')}
              className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Get Started Free
            </button>
            <button 
              onClick={() => onNavigate('contact')}
              className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
            >
              Partner With Us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;