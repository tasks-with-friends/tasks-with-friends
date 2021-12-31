import { Router } from 'express';
import passport from 'passport';
import * as refresh from 'passport-oauth2-refresh';
import { OAuth2Strategy } from 'passport-google-oauth';

import { registry } from '../../registry';

export const router = Router();

const options: passport.AuthenticateOptions & { accessType: string } = {
  scope: [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ],
  accessType: 'offline',
  prompt: 'consent',
};

const strategy = new OAuth2Strategy(
  {
    clientID: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    callbackURL: `${process.env.WEBAPP_DOMAIN}/api/auth/google/callback`,
  },
  async (accessToken, refreshToken, profile, done) => {
    const user = await registry.get('user-service').getOrCreateUser({
      user: {
        name: profile.displayName,
        email: 'none',
        avatarUrl: profile.photos?.[0]?.value,
        provider: profile.provider,
        providerUserId: profile.id,
      },
    });

    return done(null, {
      id: user.id,
      provider: 'google',
      accessToken,
      refreshToken,
    });
  },
);

passport.use(strategy);
refresh.use(strategy as any);

router.get('/', passport.authenticate('google', options));

router.get(
  '/callback',
  (req, res) => {
    console.log(req);
    const { method, originalUrl, rawHeaders } = req;
    res.json({ method, originalUrl, rawHeaders });
  },
  // passport.authenticate('google', {
  //   successRedirect: '/api/auth/success',
  //   failureRedirect: '/api/auth/failure',
  // }),
);
