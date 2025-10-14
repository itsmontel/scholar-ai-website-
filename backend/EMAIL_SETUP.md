# Email Configuration Setup

## Option 1: Gmail (Recommended for Development)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to "App passwords" section
4. Generate an app password for "Mail"

### Step 2: Update .env file
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_actual_email@gmail.com
EMAIL_PASS=your_16_character_app_password
```

## Option 2: SendGrid (Recommended for Production)

### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com/
2. Create a free account (100 emails/day free)
3. Verify your sender identity
4. Create an API key

### Step 2: Update .env file
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
```

## Option 3: Mailgun (Alternative)

### Step 1: Create Mailgun Account
1. Go to https://www.mailgun.com/
2. Create a free account (5,000 emails/month free)
3. Get your SMTP credentials

### Step 2: Update .env file
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=587
EMAIL_USER=your_mailgun_username
EMAIL_PASS=your_mailgun_password
```

## Option 4: Development Mode (No Real Emails)

For development, you can disable email sending and just log verification links to console:

```bash
# Comment out or remove email configuration
# EMAIL_HOST=
# EMAIL_PORT=
# EMAIL_USER=
# EMAIL_PASS=
```

## Testing Email Configuration

After setting up, test with:
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo@writescholar.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

## Troubleshooting

### Gmail Issues:
- Make sure 2FA is enabled
- Use app password, not regular password
- Check if "Less secure app access" is disabled (it should be)

### SendGrid Issues:
- Verify your sender identity
- Check API key permissions
- Ensure domain is verified

### General Issues:
- Check firewall settings
- Verify port 587 is not blocked
- Check email service status
