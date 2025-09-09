const { connectDB, query } = require('./connection');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDB();
    
    // Check if data already exists
    const existingUsers = await query('SELECT COUNT(*) as count FROM users');
    if (parseInt(existingUsers.rows[0].count) > 0) {
      console.log('⚠️  Database already contains data. Skipping seed.');
      return;
    }
    
    console.log('📝 Creating sample data...');
    
    // Create sample users
    const sampleUsers = [
      {
        email: 'demo@scholarai.com',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2a', // password: demo123
        first_name: 'Demo',
        last_name: 'User',
        institution: 'University of Technology',
        research_field: 'Computer Science',
        subscription_plan: 'premium',
        subscription_status: 'active',
        email_verified: true
      },
      {
        email: 'researcher@university.edu',
        password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8KzKz2a', // password: demo123
        first_name: 'Dr. Sarah',
        last_name: 'Johnson',
        institution: 'Harvard University',
        research_field: 'Psychology',
        subscription_plan: 'basic',
        subscription_status: 'active',
        email_verified: true
      }
    ];
    
    const userIds = [];
    for (const user of sampleUsers) {
      const result = await query(
        `INSERT INTO users (email, password_hash, first_name, last_name, institution, research_field, subscription_plan, subscription_status, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [user.email, user.password_hash, user.first_name, user.last_name, user.institution, user.research_field, user.subscription_plan, user.subscription_status, user.email_verified]
      );
      userIds.push(result.rows[0].id);
      console.log(`✅ Created user: ${user.email}`);
    }
    
    // Create sample subscriptions
    const sampleSubscriptions = [
      {
        user_id: userIds[0],
        stripe_subscription_id: 'sub_demo_premium',
        plan_type: 'premium',
        status: 'active',
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        user_id: userIds[1],
        stripe_subscription_id: 'sub_demo_basic',
        plan_type: 'basic',
        status: 'active',
        current_period_start: new Date(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      }
    ];
    
    for (const subscription of sampleSubscriptions) {
      await query(
        `INSERT INTO subscriptions (user_id, stripe_subscription_id, plan_type, status, current_period_start, current_period_end)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [subscription.user_id, subscription.stripe_subscription_id, subscription.plan_type, subscription.status, subscription.current_period_start, subscription.current_period_end]
      );
      console.log(`✅ Created subscription for user: ${subscription.user_id}`);
    }
    
    // Create sample documents
    const sampleDocuments = [
      {
        user_id: userIds[0],
        title: 'Machine Learning in Healthcare: A Comprehensive Review',
        original_filename: 'ml_healthcare_review.pdf',
        file_type: 'application/pdf',
        file_size: 2048576,
        s3_key: 'demo/documents/ml_healthcare_review.pdf',
        s3_url: 'https://s3.amazonaws.com/scholar-ai-documents/demo/documents/ml_healthcare_review.pdf',
        content_text: 'This paper provides a comprehensive review of machine learning applications in healthcare...',
        word_count: 2500,
        page_count: 8,
        upload_status: 'processed'
      },
      {
        user_id: userIds[1],
        title: 'The Impact of Social Media on Academic Performance',
        original_filename: 'social_media_academic_performance.docx',
        file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        file_size: 1536000,
        s3_key: 'demo/documents/social_media_academic_performance.docx',
        s3_url: 'https://s3.amazonaws.com/scholar-ai-documents/demo/documents/social_media_academic_performance.docx',
        content_text: 'This study examines the relationship between social media usage and academic performance among university students...',
        word_count: 1800,
        page_count: 6,
        upload_status: 'processed'
      }
    ];
    
    const documentIds = [];
    for (const document of sampleDocuments) {
      const result = await query(
        `INSERT INTO documents (user_id, title, original_filename, file_type, file_size, s3_key, s3_url, content_text, word_count, page_count, upload_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id`,
        [document.user_id, document.title, document.original_filename, document.file_type, document.file_size, document.s3_key, document.s3_url, document.content_text, document.word_count, document.page_count, document.upload_status]
      );
      documentIds.push(result.rows[0].id);
      console.log(`✅ Created document: ${document.title}`);
    }
    
    // Create sample document analyses
    const sampleAnalyses = [
      {
        document_id: documentIds[0],
        user_id: userIds[0],
        analysis_type: 'comprehensive',
        status: 'completed',
        citation_style: 'APA',
        focus_areas: ['clarity', 'structure', 'citations'],
        analysis_results: {
          overall_score: 85,
          summary: 'This is a well-structured academic paper with strong research methodology.',
          strengths: ['Clear research question', 'Comprehensive literature review', 'Good data analysis'],
          areas_for_improvement: ['Some sections could be more concise', 'Additional citations needed in methodology section'],
          recommendations: ['Consider adding more recent studies', 'Strengthen the conclusion section']
        },
        ai_model_used: 'gpt-4-turbo-preview',
        processing_time_ms: 4500
      },
      {
        document_id: documentIds[1],
        user_id: userIds[1],
        analysis_type: 'general',
        status: 'completed',
        citation_style: 'MLA',
        focus_areas: ['grammar', 'clarity'],
        analysis_results: {
          overall_score: 78,
          summary: 'Good research paper with room for improvement in writing clarity.',
          strengths: ['Interesting research topic', 'Good use of statistical analysis'],
          areas_for_improvement: ['Some grammatical errors', 'Could improve paragraph transitions'],
          recommendations: ['Proofread for grammar', 'Add transition sentences between paragraphs']
        },
        ai_model_used: 'gpt-4-turbo-preview',
        processing_time_ms: 3200
      }
    ];
    
    for (const analysis of sampleAnalyses) {
      await query(
        `INSERT INTO document_analyses (document_id, user_id, analysis_type, status, citation_style, focus_areas, analysis_results, ai_model_used, processing_time_ms, completed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)`,
        [analysis.document_id, analysis.user_id, analysis.analysis_type, analysis.status, analysis.citation_style, analysis.focus_areas, JSON.stringify(analysis.analysis_results), analysis.ai_model_used, analysis.processing_time_ms]
      );
      console.log(`✅ Created analysis for document: ${analysis.document_id}`);
    }
    
    // Create sample usage tracking
    const sampleUsage = [
      { user_id: userIds[0], document_id: documentIds[0], action_type: 'upload', credits_used: 1 },
      { user_id: userIds[0], document_id: documentIds[0], action_type: 'analysis', credits_used: 3 },
      { user_id: userIds[1], document_id: documentIds[1], action_type: 'upload', credits_used: 1 },
      { user_id: userIds[1], document_id: documentIds[1], action_type: 'analysis', credits_used: 1 }
    ];
    
    for (const usage of sampleUsage) {
      await query(
        `INSERT INTO usage_tracking (user_id, document_id, action_type, credits_used)
         VALUES ($1, $2, $3, $4)`,
        [usage.user_id, usage.document_id, usage.action_type, usage.credits_used]
      );
    }
    console.log(`✅ Created ${sampleUsage.length} usage tracking records`);
    
    // Create sample notifications
    const sampleNotifications = [
      {
        user_id: userIds[0],
        type: 'analysis_complete',
        title: 'Document Analysis Complete',
        message: 'Your analysis of "Machine Learning in Healthcare" has been completed.',
        is_read: false,
        metadata: { document_id: documentIds[0], analysis_type: 'comprehensive' }
      },
      {
        user_id: userIds[1],
        type: 'system',
        title: 'Welcome to Scholar AI',
        message: 'Welcome to Scholar AI! Start by uploading your first document for analysis.',
        is_read: true,
        metadata: {}
      }
    ];
    
    for (const notification of sampleNotifications) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, is_read, metadata)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [notification.user_id, notification.type, notification.title, notification.message, notification.is_read, JSON.stringify(notification.metadata)]
      );
    }
    console.log(`✅ Created ${sampleNotifications.length} notifications`);
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Sample Data Created:');
    console.log(`   - ${sampleUsers.length} users`);
    console.log(`   - ${sampleSubscriptions.length} subscriptions`);
    console.log(`   - ${sampleDocuments.length} documents`);
    console.log(`   - ${sampleAnalyses.length} document analyses`);
    console.log(`   - ${sampleUsage.length} usage tracking records`);
    console.log(`   - ${sampleNotifications.length} notifications`);
    
    console.log('\n🔑 Demo Login Credentials:');
    console.log('   Email: demo@scholarai.com');
    console.log('   Password: demo123');
    console.log('   Plan: Premium');
    console.log('\n   Email: researcher@university.edu');
    console.log('   Password: demo123');
    console.log('   Plan: Basic');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seeding script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
