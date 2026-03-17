const Joi = require('joi');

// Validation middleware factory
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        value: detail.context?.value
      }));

      // Use the first error's message as the main message so clients get a helpful reason (e.g. "Content is too long (max 100,000 characters)")
      const mainMessage = errorDetails.length > 0 ? errorDetails[0].message : 'Validation failed';

      return res.status(400).json({
        success: false,
        message: mainMessage,
        errors: errorDetails
      });
    }

    // Replace the request property with the validated and sanitized value
    req[property] = value;
    next();
  };
};

// Common validation schemas
const commonSchemas = {
  // Email validation
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.max': 'Email address is too long',
      'any.required': 'Email is required'
    }),

  // Password validation
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password is too long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),

  // Name validation
  name: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name is too long',
      'string.pattern.base': 'Name can only contain letters, spaces, hyphens, and apostrophes',
      'any.required': 'Name is required'
    }),

  // UUID validation
  uuid: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.guid': 'Invalid ID format',
      'any.required': 'ID is required'
    }),

  // Document title validation
  title: Joi.string()
    .min(1)
    .max(255)
    .trim()
    .required()
    .messages({
      'string.min': 'Title cannot be empty',
      'string.max': 'Title is too long',
      'any.required': 'Title is required'
    }),

  // Text content validation
  content: Joi.string()
    .min(10)
    .max(100000)
    .trim()
    .required()
    .messages({
      'string.min': 'Content must be at least 10 characters long',
      'string.max': 'Content is too long (max 100,000 characters). Please shorten your text or split it into smaller sections.',
      'any.required': 'Content is required'
    }),

  // Analysis type validation
  analysisType: Joi.string()
    .valid('comprehensive', 'grammar', 'style', 'structure', 'citation', 'plagiarism', 'citation_review')
    .required()
    .messages({
      'any.only': 'Invalid analysis type',
      'any.required': 'Analysis type is required'
    }),

  // Citation style validation
  citationStyle: Joi.string()
    .valid('None', 'APA', 'MLA', 'Chicago', 'Harvard', 'IEEE', 'Vancouver')
    .required()
    .messages({
      'any.only': 'Invalid citation style',
      'any.required': 'Citation style is required'
    }),

  // Pagination validation
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }
};

// Specific validation schemas for different endpoints
const validationSchemas = {
  // Auth endpoints
  register: Joi.object({
    email: commonSchemas.email,
    password: commonSchemas.password
  }),

  login: Joi.object({
    email: commonSchemas.email,
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  // Document endpoints
  uploadDocument: Joi.object({
    title: commonSchemas.title,
    content: commonSchemas.content
  }),

  updateDocument: Joi.object({
    title: commonSchemas.title
  }),

  // Analysis endpoints
  // documentId is optional: when pasting text from dashboard, we send content without documentId
  createAnalysis: Joi.object({
    documentId: Joi.string().uuid({ version: 'uuidv4' }).optional().allow(null, ''),
    analysisType: commonSchemas.analysisType,
    citationStyle: commonSchemas.citationStyle,
    content: commonSchemas.content,
    educationLevel: Joi.string().valid('college', 'sixth_form', 'middle_school').optional().default('college'),
    rubricContent: Joi.string().max(100000).optional().allow('').messages({
      'string.max': 'Rubric content is too long (max 100,000 characters)'
    })
  }),

  // Citation review endpoint (temporary analysis, no documentId needed)
  citationReview: Joi.object({
    content: commonSchemas.content,
    citationStyle: Joi.string()
      .valid('APA', 'MLA', 'Chicago', 'Harvard', 'IEEE', 'Vancouver')
      .required()
      .messages({
        'any.only': 'Invalid citation style. Citation review requires a specific citation style (not "None")',
        'any.required': 'Citation style is required for citation review'
      })
  }),

  saveAnalysis: Joi.object({
    documentId: Joi.string().uuid({ version: 'uuidv4' }).optional().allow(null, ''),
    analysisType: commonSchemas.analysisType,
    citationStyle: commonSchemas.citationStyle,
    content: Joi.string().min(1).max(100000).optional(),
    analysisResult: commonSchemas.content,
    annotations: Joi.array().items(Joi.object()).optional(),
  }),

  // Query parameters
  getDocuments: Joi.object({
    page: commonSchemas.pagination.page,
    limit: commonSchemas.pagination.limit,
    search: Joi.string().max(100).optional()
  }),

  getAnalysisHistory: Joi.object({
    page: commonSchemas.pagination.page,
    limit: commonSchemas.pagination.limit,
    documentId: commonSchemas.uuid.optional()
  }),

  // User profile validation
  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    name: Joi.string().min(1).max(100).optional(),
    institution: Joi.string().max(255).optional(),
    researchField: Joi.string().max(255).optional()
  }).min(1), // At least one field must be provided

  // Change password validation
  changePassword: Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    newPassword: commonSchemas.password
  })
};

// Export validation functions for different endpoints
module.exports = {
  validate,
  commonSchemas,
  validationSchemas,
  
  // Auth validations
  validateRegister: validate(validationSchemas.register),
  validateLogin: validate(validationSchemas.login),
  
  // Document validations
  validateUploadDocument: validate(validationSchemas.uploadDocument),
  validateUpdateDocument: validate(validationSchemas.updateDocument),
  
  // Analysis validations
  validateCreateAnalysis: validate(validationSchemas.createAnalysis),
  validateSaveAnalysis: validate(validationSchemas.saveAnalysis),
  validateCitationReview: validate(validationSchemas.citationReview),
  
  // Query parameter validations
  validateGetDocuments: validate(validationSchemas.getDocuments, 'query'),
  validateGetAnalysisHistory: validate(validationSchemas.getAnalysisHistory, 'query'),
  
  // Parameter validations
  validateDocumentId: validate(Joi.object({
    id: commonSchemas.uuid
  }), 'params'),
  
  validateAnalysisId: validate(Joi.object({
    id: commonSchemas.uuid
  }), 'params'),

  // User validations
  validateUpdateProfile: validate(validationSchemas.updateProfile),
  validateChangePassword: validate(validationSchemas.changePassword)
};