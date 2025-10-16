# WriteScholar Backend

A comprehensive backend API for the WriteScholar academic writing assistant platform.

## 🚀 Features

- **User Authentication**: JWT-based authentication with email verification and password reset
- **Document Management**: Upload, store, and manage academic documents with AWS S3
- **AI Analysis**: OpenAI GPT-4 integration for document analysis and writing feedback
- **Subscription Management**: Stripe integration for subscription billing and management
- **File Processing**: Support for PDF, DOC, DOCX, and TXT files with content extraction
- **Usage Tracking**: Monitor user activity and credit usage
- **Notifications**: In-app notification system
- **Security**: Rate limiting, input validation, and secure file handling

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (jsonwebtoken)
- **File Storage**: AWS S3
- **AI Service**: OpenAI GPT-4
- **Payment Processing**: Stripe
- **File Processing**: pdf-parse, mammoth
- **Security**: Helmet, CORS, bcryptjs
- **Validation**: Joi
- **Rate Limiting**: express-rate-limit

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- PostgreSQL 12 or higher
- AWS S3 bucket
- OpenAI API key
- Stripe account

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd writescholar-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your secure configuration. See `env.example` for required variables.
   
   **⚠️ Security Note**: Use strong, unique passwords and API keys. Never commit `.env` files to version control.

4. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb writescholar
   
   # Run the schema
   psql -d writescholar -f src/database/schema.sql
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 📚 API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/verify-email` - Verify email address
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - Logout user

### Document Endpoints

- `POST /api/documents/upload` - Upload a document
- `GET /api/documents` - Get user's documents
- `GET /api/documents/:id` - Get specific document
- `GET /api/documents/:id/download` - Get download URL
- `PUT /api/documents/:id` - Update document metadata
- `DELETE /api/documents/:id` - Delete document
- `GET /api/documents/:id/content` - Get document content

### Analysis Endpoints

- `POST /api/analysis/analyze` - Analyze a document
- `GET /api/analysis/:analysisId` - Get analysis results
- `GET /api/analysis/document/:documentId` - Get all analyses for a document
- `POST /api/analysis/suggestions` - Get writing suggestions
- `POST /api/analysis/citations/check` - Check citation formatting
- `POST /api/analysis/summarize` - Summarize document

### Subscription Endpoints

- `POST /api/subscriptions/create` - Create subscription
- `GET /api/subscriptions/current` - Get current subscription
- `PUT /api/subscriptions/update` - Update subscription
- `POST /api/subscriptions/cancel` - Cancel subscription
- `GET /api/subscriptions/payment-methods` - Get payment methods
- `POST /api/subscriptions/setup-payment-method` - Setup payment method
- `POST /api/subscriptions/billing-portal` - Create billing portal session
- `GET /api/subscriptions/usage` - Get usage statistics

### User Endpoints

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/change-password` - Change password
- `GET /api/users/notifications` - Get notifications
- `PUT /api/users/notifications/:id/read` - Mark notification as read
- `PUT /api/users/notifications/read-all` - Mark all notifications as read
- `GET /api/users/usage-stats` - Get usage statistics
- `DELETE /api/users/account` - Delete account

### Webhook Endpoints

- `POST /api/webhooks/stripe` - Stripe webhook handler

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: Prevent abuse with request limits
- **Input Validation**: Joi schema validation
- **CORS Protection**: Configured for specific origins
- **Helmet Security**: Security headers
- **File Upload Security**: Type and size validation
- **SQL Injection Protection**: Parameterized queries

## 📊 Database Schema

The database includes the following main tables:

- `users` - User accounts and profiles
- `subscriptions` - Subscription management
- `documents` - Document storage metadata
- `document_analyses` - AI analysis results
- `usage_tracking` - User activity tracking
- `notifications` - In-app notifications
- `api_keys` - API key management

## 🚀 Deployment

### Environment Setup

1. **Production Environment Variables**
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://user:pass@host:port/db
   JWT_SECRET=your_production_jwt_secret
   AWS_ACCESS_KEY_ID=your_production_aws_key
   AWS_SECRET_ACCESS_KEY=your_production_aws_secret
   OPENAI_API_KEY=your_production_openai_key
   STRIPE_SECRET_KEY=sk_live_your_live_stripe_key
   ```

2. **Database Migration**
   ```bash
   npm run migrate
   ```

3. **Start Production Server**
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## 📈 Monitoring

- Health check endpoint: `GET /health`
- Error logging with timestamps
- Usage tracking and analytics
- Stripe webhook monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- Authentication, document management, AI analysis, and subscription features
