const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const userService = require('../services/userService');

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
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log('Google OAuth Profile:', {
      id: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value
    });

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

    // Create new user
    const newUser = await userService.createGoogleUser({
      googleId: profile.id,
      email: email,
      name: profile.displayName || email?.split('@')[0] || 'User',
      picture: profile.photos?.[0]?.value,
      emailVerified: true // Google accounts are pre-verified
    });

    return done(null, newUser);
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

module.exports = passport;

