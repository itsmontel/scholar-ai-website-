const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userService = require('../services/userService');
const emailService = require('../services/emailService');
const { parseDeviceFromUserAgent } = require('../utils/deviceParser');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await userService.findUserById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
// passReqToCallback: true gives us the Express `req` as the first verify
// argument, so we can read req.headers['user-agent'] and capture which
// device the user signed up on. Without this flag the verify callback only
// gets (accessToken, refreshToken, profile, done) and there's no way to
// reach the original HTTP request.
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback",
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists with this Google ID
    let user = await userService.findUserByGoogleId(profile.id);

    if (user) {
      // User exists, return user
      return done(null, user);
    }

    // Check if user exists with this email
    const email = profile.emails?.[0]?.value;
    if (email) {
      user = await userService.findUserByEmail(email);

      if (user) {
        // User exists with email, link Google account
        await userService.linkGoogleAccount(user.id, profile.id);
        user.google_id = profile.id;
        return done(null, user);
      }
    }

    // Create new user. signup_device captures the User-Agent device class
    // at registration so cohort analytics in Supabase work consistently
    // across email/password AND Google OAuth signup paths.
    const newUser = await userService.createGoogleUser({
      googleId: profile.id,
      email: email,
      name: profile.displayName || email?.split('@')[0] || 'User',
      picture: profile.photos?.[0]?.value,
      emailVerified: true, // Google accounts are pre-verified
      signupDevice: parseDeviceFromUserAgent(req.headers['user-agent']),
    });

    // Send welcome email with free study tips guide (same as email/password signups)
    const welcomeResult = await emailService.sendWelcomeEmail(newUser.email || email);
    if (!welcomeResult.success) {
      console.error('Failed to send welcome email to Google signup:', welcomeResult.error);
    }

    return done(null, newUser);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

module.exports = passport;

