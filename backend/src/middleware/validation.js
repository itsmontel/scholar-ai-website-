const Joi = require('joi');

// User validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'Password is required'
    }),
  institution: Joi.string().max(255).optional(),
  researchField: Joi.string().max(255).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required'
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required'
  })
});

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  institution: Joi.string().max(255).optional(),
  researchField: Joi.string().max(255).optional()
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required'
  }),
  newPassword: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]'))
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required'
    })
});

// Document validation schemas
const documentUploadSchema = Joi.object({
  title: Joi.string().min(1).max(500).required().messages({
    'string.min': 'Document title is required',
    'string.max': 'Document title cannot exceed 500 characters',
    'any.required': 'Document title is required'
  }),
  citationStyle: Joi.string().valid('APA', 'MLA', 'Chicago', 'Harvard', 'IEEE').optional(),
  focusAreas: Joi.array().items(
    Joi.string().valid(
      'grammar',
      'clarity',
      'structure',
      'citations',
      'plagiarism',
      'academic_tone',
      'research_quality',
      'argument_strength'
    )
  ).optional()
});

const analysisRequestSchema = Joi.object({
  documentId: Joi.string().uuid().required().messages({
    'string.guid': 'Invalid document ID format',
    'any.required': 'Document ID is required'
  }),
  analysisType: Joi.string().valid('general', 'citation', 'grammar', 'plagiarism', 'comprehensive').required().messages({
    'any.only': 'Analysis type must be one of: general, citation, grammar, plagiarism, comprehensive',
    'any.required': 'Analysis type is required'
  }),
  citationStyle: Joi.string().valid('APA', 'MLA', 'Chicago', 'Harvard', 'IEEE', 'Vancouver', 'ACS', 'AMA').optional(),
  focusAreas: Joi.array().items(
    Joi.string().valid(
      'grammar',
      'clarity',
      'structure',
      'citations',
      'plagiarism',
      'academic_tone',
      'research_quality',
      'argument_strength',
      'methodology',
      'statistical_analysis',
      'data_quality',
      'reproducibility',
      'ethical_considerations',
      'novelty',
      'significance',
      'impact'
    )
  ).optional(),
  targetJournal: Joi.string().max(255).optional().messages({
    'string.max': 'Target journal name cannot exceed 255 characters'
  }),
  researchField: Joi.string().max(255).optional().messages({
    'string.max': 'Research field cannot exceed 255 characters'
  })
});

// Document validation schemas
const documentUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(500).required().messages({
    'string.min': 'Document title is required',
    'string.max': 'Document title cannot exceed 500 characters',
    'any.required': 'Document title is required'
  })
});

// Subscription validation schemas
const createSubscriptionSchema = Joi.object({
  planType: Joi.string().valid('basic', 'premium').required().messages({
    'any.only': 'Plan type must be either basic or premium',
    'any.required': 'Plan type is required'
  }),
  billingCycle: Joi.string().valid('monthly', 'yearly').required().messages({
    'any.only': 'Billing cycle must be either monthly or yearly',
    'any.required': 'Billing cycle is required'
  })
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessages
      });
    }
    
    next();
  };
};

// File upload validation
const validateFileUpload = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'No file uploaded'
    });
  }

  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
  const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default

  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed'
    });
  }

  if (req.file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`
    });
  }

  next();
};

module.exports = {
  validate,
  validateFileUpload,
  schemas: {
    register: registerSchema,
    login: loginSchema,
    updateProfile: updateProfileSchema,
    changePassword: changePasswordSchema,
    documentUpload: documentUploadSchema,
    documentUpdate: documentUpdateSchema,
    analysisRequest: analysisRequestSchema,
    createSubscription: createSubscriptionSchema
  }
};
