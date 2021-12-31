import express, { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import refresh from 'passport-oauth2-refresh';
import cookieSession from 'cookie-session';

import { registry } from '../../registry';

import * as google from './google';

export type RequestWithRegistry = Request & {
  registry: typeof registry;
  user: SessionUser;
  session: {
    passport: {
      user: SessionUser;
    };
  };
};

export type SessionUser = {
  id: string;
  iat: number;
  exp: number;
  provider: string;
  accessToken: string;
  refreshToken: string;
};

passport.serializeUser(function (user, done) {
  done(null, {
    ...user,
    iss: 'video-cms',
    iat: Math.round(new Date().getTime() / 1000),
    exp: Math.round(new Date().getTime() / 1000) + 3600,
  });
});

passport.deserializeUser(function (user, done) {
  done(null, user as any);
});

function refreshTokenMiddleware(
  req: RequestWithRegistry,
  res: Response,
  next: NextFunction,
) {
  const user: SessionUser | undefined = req?.session?.passport?.user;
  if (!user) return next();

  const { provider, accessToken, refreshToken } = user;

  if (accessToken && refreshToken && isTokenAboutToExpire(user.exp, 3540)) {
    console.log('========== We need to refresh ==========');
    console.log({ provider, accessToken, refreshToken });
    refresh.requestNewAccessToken(
      provider,
      refreshToken,
      (err, newAccessToken, newRefreshToken) => {
        if (err) {
          req.logout();
          res.redirect('/');
        } else {
          req.session.passport.user.accessToken = newAccessToken;
          req.session.passport.user.refreshToken = newRefreshToken;
          next();
        }
      },
    );
  } else {
    return next();
  }
}

function isTokenAboutToExpire(exp: number, thresholdSeconds: number): boolean {
  const now = new Date().getTime() / 1000;
  return typeof exp === 'number' && now + thresholdSeconds > exp;
}

export const middleware = [
  cookieSession({
    name: 'googleauth:sess',
    secret: process.env.SESSION_COOKIE_SECRET || '',
  }),
  refreshTokenMiddleware,
  passport.initialize(),
  passport.session(),
];

export const router = express.Router();

router.get('/', async (_, res) => {
  const currentUserId = registry.get('current-user-id');
  if (currentUserId) {
    const users = await registry
      .get('user-service')
      .getUsers({ userIds: [currentUserId] });

    return res
      .set('content-type', 'text/html')
      .send(
        `<html><body>Logged in as ${users.items[0]?.name} <a href="/api/auth/logout">logout</a><br/></body></html>`,
      );
  } else {
    return res.redirect('/api/auth/login');
  }
});

router.get('/login', async (req, res) => {
  const currentUserId = registry.get('current-user-id');
  if (currentUserId) {
    return res.redirect('/api/auth');
  } else {
    return res
      .set('content-type', 'text/html')
      .send(
        `<html><body><a href="/api/auth/google">Log in with Google</a></body></html>`,
      );
  }
});

router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/api/auth/login');
});

router.use('/google', google.router);

router.get('/success', (_, res) => res.redirect('/api/auth'));
router.get('/failure', (_, res) => res.json({ message: 'failure' }));
