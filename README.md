# WriteScholar - Academic Writing Assistant

A comprehensive web application that provides AI-powered academic writing analysis and feedback for students and researchers at all levels.

## 🎯 **Overview**

WriteScholar is designed to help students and researchers improve their academic writing through advanced AI analysis. The platform serves users from undergraduate students to senior researchers, providing tailored feedback and learning resources.

## 🚀 **Features**

### **Frontend (React + TypeScript)**
- Modern, responsive UI with glassmorphism design
- User authentication and profile management
- Document upload and management
- Real-time AI analysis results
- Subscription management
- Interactive dashboard

### **Backend (Node.js + Express)**
- RESTful API with comprehensive endpoints
- JWT-based authentication
- File upload with AWS S3 integration
- OpenAI GPT-4 integration for document analysis
- Stripe payment processing
- PostgreSQL database
- Advanced security features

### **AI Analysis Capabilities**
- **Comprehensive Analysis**: Full document assessment
- **Citation Analysis**: Reference and citation checking
- **Grammar & Style**: Academic writing excellence
- **Plagiarism Detection**: Academic integrity assessment
- **Peer Review Simulation**: Advanced review analysis

## 🛠️ **Tech Stack**

### **Frontend**
- React 18 with TypeScript
- Tailwind CSS for styling
- Vite for build tooling
- React Router for navigation

### **Backend**
- Node.js with Express.js
- PostgreSQL database
- JWT authentication
- AWS S3 for file storage
- OpenAI GPT-4 for AI analysis
- Stripe for payments
- Redis for caching

## 📋 **Prerequisites**

- Node.js 18.0.0 or higher
- PostgreSQL 12 or higher
- AWS S3 bucket
- OpenAI API key
- Stripe account

## 🔧 **Installation**

### **1. Clone the Repository**
```bash
git clone <repository-url>
cd writescholar-website
```

### **2. Frontend Setup**
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### **3. Backend Setup**
```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Set up database
createdb writescholar
npm run migrate
npm run seed

# Start development server
npm run dev
```

## ⚙️ **Environment Configuration**

### **Frontend (.env)**
```env
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### **Backend (.env)**
Copy `backend/env.example` to `backend/.env` and configure with your credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=writescholar
DB_USER=your_db_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRES_IN=7d

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket_name

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

**⚠️ Security Note**: Never commit your `.env` files to version control. Use strong, unique passwords and API keys.

## 🚀 **Running the Application**

### **Development Mode**
```bash
# Frontend (Terminal 1)
npm run dev

# Backend (Terminal 2)
cd backend
npm run dev
```

### **Production Mode**
```bash
# Build frontend
npm run build

# Start backend
cd backend
npm start
```

## 📚 **API Documentation**

### **Authentication Endpoints**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - User logout

### **Document Endpoints**
- `POST /api/documents/upload` - Upload document
- `GET /api/documents` - Get user documents
- `GET /api/documents/:id` - Get specific document
- `DELETE /api/documents/:id` - Delete document

### **Analysis Endpoints**
- `POST /api/analysis/analyze` - Analyze document
- `GET /api/analysis/:id` - Get analysis results
- `POST /api/analysis/peer-review` - Peer review analysis
- `POST /api/analysis/summarize` - Summarize document

### **Subscription Endpoints**
- `POST /api/subscriptions/create` - Create subscription
- `GET /api/subscriptions/current` - Get current subscription
- `PUT /api/subscriptions/update` - Update subscription
- `POST /api/subscriptions/cancel` - Cancel subscription

## 🎯 **Target Audience**

- **College Students**: Freshmen to seniors working on academic papers
- **Graduate Students**: Master's and PhD candidates
- **Postgraduate Researchers**: Postdocs and early career researchers
- **Senior Researchers**: Professors and established scientists
- **Educators**: Teachers and professors helping students

## 📊 **Analysis Types**

1. **Comprehensive Analysis** (Premium)
   - Full document assessment
   - Research excellence evaluation
   - Improvement strategy recommendations
   - Academic guidance

2. **General Analysis** (Basic+)
   - Document structure review
   - Writing quality assessment
   - Technical quality evaluation

3. **Citation Analysis** (Basic+)
   - Citation style compliance
   - Reference quality assessment
   - Academic integrity evaluation

4. **Grammar & Style** (Basic+)
   - Academic writing excellence
   - Grammatical analysis
   - Readability metrics

5. **Plagiarism Analysis** (Basic+)
   - Academic integrity assessment
   - Originality evaluation
   - Risk mitigation

## 🔒 **Security Features**

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- Input validation
- CORS protection
- Helmet security headers
- File upload security
- SQL injection protection

## 🛡️ **Security Best Practices**

### **Environment Variables**
- Never commit `.env` files to version control
- Use strong, unique passwords and API keys
- Rotate secrets regularly
- Use environment-specific configurations

### **Database Security**
- Use strong database passwords
- Enable SSL connections in production
- Regular database backups
- Limit database user permissions

### **API Security**
- Implement rate limiting
- Validate all input data
- Use HTTPS in production
- Monitor for suspicious activity

### **Deployment Security**
- Use secure hosting platforms
- Enable firewall protection
- Regular security updates
- Monitor application logs

## 📈 **Subscription Plans**

### **Free Plan**
- 1,000 words per analysis
- Basic analysis types
- Limited document storage

### **Basic Plan** ($19.99/month)
- 5,000 words per analysis
- All analysis types
- Enhanced document storage
- Priority support

### **Premium Plan** ($39.99/month)
- 50,000 words per analysis
- Advanced peer review analysis
- Unlimited document storage
- Premium support

## 🧪 **Testing**

```bash
# Frontend tests
npm test

# Backend tests
cd backend
npm test
```

## 🚀 **Deployment**

### **Frontend (Vercel/Netlify)**
```bash
npm run build
# Deploy dist/ folder
```

### **Backend (Railway/Heroku)**
```bash
cd backend
# Configure environment variables
# Deploy with PM2 or similar
```

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 **License**

This project is licensed under the MIT License.

## 🆘 **Support**

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 **Version History**

- **v1.0.0** - Initial release with core functionality
- Complete frontend and backend implementation
- AI analysis integration
- Subscription management
- User authentication and document management

---

*WriteScholar: Supporting academic excellence at every level of learning.*
