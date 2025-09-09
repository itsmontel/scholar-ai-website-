import React, { useState } from 'react';

const ContactPage = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState('support');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    priority: 'medium',
    category: 'general'
  });

  const contactOptions = [
    {
      id: 'support',
      title: 'Get Support',
      description: 'Technical help and account assistance',
      icon: '🛟',
      responseTime: 'Within 2 hours',
      color: 'blue'
    },
    {
      id: 'sales',
      title: 'Sales Inquiry',
      description: 'Pricing, plans, and institutional partnerships',
      icon: '💼',
      responseTime: 'Within 1 hour',
      color: 'green'
    },
    {
      id: 'partnership',
      title: 'Partnerships',
      description: 'University partnerships and integrations',
      icon: '🤝',
      responseTime: 'Within 24 hours',
      color: 'purple'
    },
    {
      id: 'feedback',
      title: 'Product Feedback',
      description: 'Feature requests and suggestions',
      icon: '💡',
      responseTime: 'Within 48 hours',
      color: 'orange'
    }
  ];

  const offices = [
    {
      city: 'San Francisco',
      address: '123 Innovation Drive, Suite 400',
      postal: 'San Francisco, CA 94107',
      phone: '+1 (415) 555-0123',
      email: 'sf@academicai.com',
      type: 'Headquarters'
    },
    {
      city: 'Boston',
      address: '456 Cambridge Street, Floor 2',
      postal: 'Cambridge, MA 02139',
      phone: '+1 (617) 555-0456',
      email: 'boston@academicai.com',
      type: 'Research Lab'
    },
    {
      city: 'London',
      address: '789 Academic Lane, Level 3',
      postal: 'London EC1A 1BB, UK',
      phone: '+44 20 7946 0789',
      email: 'london@academicai.com',
      type: 'European Office'
    }
  ];

  const supportCategories = [
    'Technical Issue',
    'Account & Billing',
    'Document Analysis',
    'Collaboration Features',
    'Integrations',
    'Citations & References',
    'General Question'
  ];

  const priorityLevels = [
    { value: 'low', label: 'Low - General inquiry', color: 'gray' },
    { value: 'medium', label: 'Medium - Standard support', color: 'blue' },
    { value: 'high', label: 'High - Urgent issue', color: 'orange' },
    { value: 'critical', label: 'Critical - Service down', color: 'red' }
  ];

  const faqs = [
    {
      question: 'How quickly do you respond to support requests?',
      answer: 'We aim to respond to all support requests within 2 hours during business hours (9 AM - 6 PM PST). Critical issues receive immediate attention 24/7.'
    },
    {
      question: 'Do you offer phone support?',
      answer: 'Phone support is available for Premium and Institutional customers. Free users can access our comprehensive help center and email support.'
    },
    {
      question: 'Can I schedule a demo for my institution?',
      answer: 'Absolutely! We offer personalized demos for educational institutions. Contact our sales team to schedule a presentation tailored to your needs.'
    },
    {
      question: 'How do I report a bug or technical issue?',
      answer: 'Use the support form below and select "Technical Issue" as the category. Include as much detail as possible, including screenshots if applicable.'
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We\'ll get back to you soon.');
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
      priority: 'medium',
      category: 'general'
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const renderSupportForm = () => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Submit a Support Request</h3>
      
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your.email@university.edu"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {supportCategories.map((category, index) => (
                <option key={index} value={category.toLowerCase().replace(' ', '-')}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => handleInputChange('priority', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {priorityLevels.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <input
            type="text"
            value={formData.subject}
            onChange={(e) => handleInputChange('subject', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Brief description of your issue or question"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
          <textarea
            value={formData.message}
            onChange={(e) => handleInputChange('message', e.target.value)}
            rows={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Please provide as much detail as possible about your issue or question..."
          />
        </div>

        <button
          onClick={handleSubmit}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
        >
          Submit Request
        </button>
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">💡 Before submitting:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Check our <button onClick={() => onNavigate('help')} className="underline">Help Center</button> for common solutions</li>
          <li>• Include screenshots or error messages if reporting a bug</li>
          <li>• Mention your account email and subscription plan</li>
          <li>• Describe steps you've already tried to resolve the issue</li>
        </ul>
      </div>
    </div>
  );

  const renderSalesForm = () => (
    <div className="bg-white rounded-xl shadow-lg p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Sales Inquiry</h3>
      
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="your.email@institution.edu"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Organization</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="University or company name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Your Role</label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option>Select your role</option>
              <option>Professor/Faculty</option>
              <option>IT Administrator</option>
              <option>Department Head</option>
              <option>Procurement Officer</option>
              <option>Student Services</option>
              <option>Other</option>
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Number of Users</label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option>Select user count</option>
              <option>1-10 users</option>
              <option>11-50 users</option>
              <option>51-200 users</option>
              <option>201-1000 users</option>
              <option>1000+ users</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Timeline</label>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent">
              <option>When do you need this?</option>
              <option>Immediately</option>
              <option>Within 1 month</option>
              <option>Within 3 months</option>
              <option>Within 6 months</option>
              <option>Just exploring</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
          <textarea
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Tell us about your specific needs, integration requirements, or questions about pricing..."
          />
        </div>

        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-3" />
            <span className="text-sm text-gray-700">I'd like to schedule a demo</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-3" />
            <span className="text-sm text-gray-700">I need custom pricing for my institution</span>
          </label>
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-3" />
            <span className="text-sm text-gray-700">I'm interested in API access</span>
          </label>
        </div>

        <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
          Contact Sales Team
        </button>
      </div>
    </div>
  );

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
          <button onClick={() => onNavigate('about')} className="text-gray-600 hover:text-gray-900 transition-colors">About</button>
          <button className="text-blue-600 font-medium">Contact</button>
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
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Get in <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Touch</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Whether you need support, want to explore partnerships, or have questions about our platform, 
            we're here to help you succeed.
          </p>
        </div>

        {/* Contact Options */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          {contactOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => setActiveTab(option.id)}
              className={`p-6 rounded-xl shadow-lg transition-all duration-300 text-left ${
                activeTab === option.id
                  ? `bg-${option.color}-50 border-2 border-${option.color}-200 shadow-xl`
                  : 'bg-white border-2 border-transparent hover:shadow-xl'
              }`}
            >
              <div className="text-3xl mb-4">{option.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{option.title}</h3>
              <p className="text-gray-600 text-sm mb-3">{option.description}</p>
              <div className="text-xs text-gray-500 font-medium">
                Response: {option.responseTime}
              </div>
            </button>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            {activeTab === 'support' && renderSupportForm()}
            {activeTab === 'sales' && renderSalesForm()}
            {(activeTab === 'partnership' || activeTab === 'feedback') && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  {activeTab === 'partnership' ? 'Partnership Inquiry' : 'Product Feedback'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'partnership' 
                    ? 'Interested in partnering with AcademicAI? We\'d love to explore opportunities for collaboration.'
                    : 'Help us improve AcademicAI by sharing your feedback, feature requests, or suggestions.'
                  }
                </p>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder={activeTab === 'partnership' ? 'Organization/Institution' : 'Subject'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <textarea
                    rows={6}
                    placeholder={
                      activeTab === 'partnership' 
                        ? 'Tell us about your organization and how you\'d like to partner with us...'
                        : 'Share your feedback, feature requests, or suggestions...'
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                  <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                    Send Message
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Office Locations */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Offices</h3>
              <div className="space-y-6">
                {offices.map((office, index) => (
                  <div key={index} className="border-b border-gray-200 last:border-b-0 pb-4 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{office.city}</h4>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                        {office.type}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{office.address}</p>
                      <p>{office.postal}</p>
                      <p className="text-blue-600">{office.phone}</p>
                      <p className="text-blue-600">{office.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => onNavigate('help')}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">📚</span>
                    <div>
                      <div className="font-medium text-gray-900">Help Center</div>
                      <div className="text-xs text-gray-500">Find answers to common questions</div>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">🔧</span>
                    <div>
                      <div className="font-medium text-gray-900">System Status</div>
                      <div className="text-xs text-gray-500">Check service availability</div>
                    </div>
                  </div>
                </button>
                <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">💬</span>
                    <div>
                      <div className="font-medium text-gray-900">Community Forum</div>
                      <div className="text-xs text-gray-500">Connect with other users</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Frequently Asked</h3>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div key={index}>
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{faq.question}</h4>
                    <p className="text-gray-600 text-xs">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2 flex items-center">
                <span className="text-xl mr-2">🚨</span>
                Critical Issues
              </h3>
              <p className="text-red-800 text-sm mb-3">
                For service outages or critical technical issues affecting multiple users:
              </p>
              <div className="space-y-2 text-sm">
                <div className="text-red-700 font-medium">Emergency Hotline: +1 (415) 555-HELP</div>
                <div className="text-red-700">Email: emergency@academicai.com</div>
                <div className="text-red-600 text-xs">Available 24/7 for critical issues</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;