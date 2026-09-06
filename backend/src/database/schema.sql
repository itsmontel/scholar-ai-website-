-- WriteScholar Database Schema
-- PostgreSQL Database Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    institution VARCHAR(255),
    research_field VARCHAR(255),
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    stripe_customer_id VARCHAR(255),
    -- See add_manual_grant_column.sql migration. When true, reconcileSubscriptions()
    -- leaves this user alone — used for comped accounts, partner deals, refunds.
    manual_grant BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    last_active_at TIMESTAMP WITH TIME ZONE,
    free_library_expiry_started_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    email_verification_token VARCHAR(255),
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE
);

-- Subscriptions table
-- NOTE: column is `plan` (not `plan_type`); see fix_subscriptions_table.sql
-- migration. `stripe_customer_id` and `canceled_at` were added by that
-- migration as well.
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255),
    plan VARCHAR(50) NOT NULL, -- 'pro', 'premium', 'focus', 'free'
    status VARCHAR(50) NOT NULL, -- 'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired'
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT false,
    canceled_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    s3_key VARCHAR(1000) NOT NULL,
    s3_url VARCHAR(1000),
    content_text TEXT,
    word_count INTEGER,
    page_count INTEGER,
    upload_status VARCHAR(50) DEFAULT 'uploaded', -- 'uploaded', 'processing', 'processed', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Document analyses table
CREATE TABLE IF NOT EXISTS document_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    analysis_type VARCHAR(100) NOT NULL, -- 'general', 'citation', 'grammar', 'plagiarism'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    citation_style VARCHAR(50), -- 'None', 'APA', 'MLA', 'Chicago', 'Harvard'
    focus_areas TEXT[], -- Array of focus areas
    analysis_results JSONB,
    ai_model_used VARCHAR(100),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    action_type VARCHAR(100) NOT NULL, -- 'upload', 'analysis', 'download'
    credits_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API keys table (for rate limiting and tracking)
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    permissions TEXT[],
    last_used TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL, -- 'analysis_complete', 'subscription_expired', 'system'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email subscriptions table
CREATE TABLE IF NOT EXISTS email_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_subscribed BOOLEAN DEFAULT true,
    subscription_type VARCHAR(50) DEFAULT 'marketing', -- 'marketing', 'transactional', 'all'
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Permanent marketing blocklist — never send promo emails to these addresses.
CREATE TABLE IF NOT EXISTS marketing_email_unsubscribes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    source VARCHAR(50) DEFAULT 'unsubscribe_page',
    unsubscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_last_active_at ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_users_stripe_customer_id ON users(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);
CREATE INDEX IF NOT EXISTS idx_document_analyses_document_id ON document_analyses(document_id);
CREATE INDEX IF NOT EXISTS idx_document_analyses_user_id ON document_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_created_at ON usage_tracking(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_email ON email_subscriptions(email);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_user_id ON email_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_is_subscribed ON email_subscriptions(is_subscribed);
CREATE INDEX IF NOT EXISTS idx_email_subscriptions_type ON email_subscriptions(subscription_type);
CREATE INDEX IF NOT EXISTS idx_marketing_email_unsubscribes_email ON marketing_email_unsubscribes(email);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop triggers if they exist, then recreate them
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_document_analyses_updated_at ON document_analyses;
CREATE TRIGGER update_document_analyses_updated_at BEFORE UPDATE ON document_analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_subscriptions_updated_at ON email_subscriptions;
CREATE TRIGGER update_email_subscriptions_updated_at BEFORE UPDATE ON email_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Quizzes/Study Tools table (for quizzes, flashcards, crosswords)
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    quiz_type VARCHAR(50) NOT NULL, -- 'mixed', 'multiple_choice', 'true_false', 'fill_blank', 'flashcards', 'crossword'
    difficulty VARCHAR(50) DEFAULT 'medium',
    question_count INTEGER DEFAULT 0,
    questions JSONB, -- Stores questions array, flashcard cards, or crossword data
    source_word_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE -- NULL for permanent (paid users), timestamp for free users
);

-- Indexes for quizzes table
CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_quiz_type ON quizzes(quiz_type);
CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at);
CREATE INDEX IF NOT EXISTS idx_quizzes_expires_at ON quizzes(expires_at);

-- Quiz usage tracking table
CREATE TABLE IF NOT EXISTS quiz_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM'
    generations_used INTEGER DEFAULT 0,
    words_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_quiz_usage_user_month ON quiz_usage(user_id, month_year);
