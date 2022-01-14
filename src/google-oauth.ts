import { HandlerEvent, HandlerResponse } from '@netlify/functions';
import jwt, { JwtPayload, verify } from 'jsonwebtoken';
import { User } from './domain/v1/api.g';
import { post } from './net';
import { registry } from './registry';
import { Profile } from './types';

// See: https://developers.google.com/oauthplayground

export function getRedirect() {
  return {
    location: `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?client_id=${encodeURIComponent(
      process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    )}&redirect_uri=${encodeURIComponent(
      `${process.env.WEBAPP_DOMAIN}/auth/google/callback`,
    )}&access_type=offline&prompt=consent&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&flowName=GeneralOAuthFlow`,
  };
}

export async function exchangeAuthCodeForToken(code: string): Promise<{
  idToken: jwt.JwtPayload;
  refreshToken: string;
}> {
  const res =
    (await post({
      url: 'https://www.googleapis.com/oauth2/v4/token',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: `code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(
        `${process.env.WEBAPP_DOMAIN}/auth/google/callback`,
      )}&client_id=${encodeURIComponent(
        process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      )}&client_secret=${encodeURIComponent(
        process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
      )}&scope=&grant_type=authorization_code`,
    })) || '';
  const parsedRes = JSON.parse(res);
  const idToken = jwt.decode(parsedRes.id_token);

  if (typeof idToken === 'string' || idToken === null) {
    throw new Error(
      'Unable to parse id_token from https://www.googleapis.com/oauth2/v4/token',
    );
  }

  return { refreshToken: parsedRes.refresh_token, idToken };
}

export async function refreshIdToken(refreshToken: string): Promise<{
  idToken: jwt.JwtPayload;
}> {
  const res =
    (await post({
      url: 'https://www.googleapis.com/oauth2/v4/token',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
      data: `client_secret=${encodeURIComponent(
        process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
      )}&grant_type=refresh_token&refresh_token=${encodeURIComponent(
        refreshToken,
      )}&client_id=${encodeURIComponent(
        process.env.GOOGLE_OAUTH_CLIENT_ID || '',
      )}`,
    })) || '';
  const parsedRes = JSON.parse(res);
  const idToken = jwt.decode(parsedRes.id_token);

  if (typeof idToken === 'string' || idToken === null) {
    throw new Error(
      'Unable to parse id_token from https://www.googleapis.com/oauth2/v4/token',
    );
  }

  return { idToken };
}

export function getSignedSession(
  user: User,
  iat: number | null | undefined,
  exp: number | null | undefined,
): { token: string; cookie: string } {
  const issuedAt =
    typeof iat === 'number' ? iat : Math.floor(new Date().getTime() / 1000);

  const expires = typeof exp === 'number' ? exp : issuedAt + 30;

  const token = jwt.sign(
    {
      iss: process.env.WEBAPP_DOMAIN,
      sub: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
      providerUserId: user.providerUserId,
      iat: issuedAt,
      exp: expires,
    },
    process.env.SESSION_COOKIE_SECRET || '',
  );

  return {
    token,
    cookie: `token=${token}; Max-Age=604800; path=/`,
  };
}

export function getSignedLogoutSession(): { token: string; cookie: string } {
  const token = jwt.sign(
    {
      iss: process.env.WEBAPP_DOMAIN,
    },
    process.env.SESSION_COOKIE_SECRET || '',
  );

  return {
    token,
    cookie: `token=${token}; path=/`,
  };
}

export async function authorize(event: HandlerEvent): Promise<{
  notAuthorized?: HandlerResponse;
  profile?: Profile;
  cookie?: string;
}> {
  const cookie = event.headers.cookie;

  const notAuthorized: HandlerResponse = {
    statusCode: 401,
  };

  if (!cookie) return { notAuthorized };

  const token = cookie
    .split(';')
    .map((c) => c.trim().split('='))
    .find(([key]) => key === 'token')?.[1];

  if (!token || !process.env.SESSION_COOKIE_SECRET) return { notAuthorized };

  const parsed = parseToken(token, process.env.SESSION_COOKIE_SECRET);
  if (!parsed.valid) return { notAuthorized };

  const { profile, expired } = parsed;

  if (!profile.sub) return { notAuthorized };
  if (!profile.name) return { notAuthorized };
  if (!profile.email) return { notAuthorized };
  registry.for('current-user-id').use(() => profile.sub);

  if (expired && profile.sub) {
    const { refreshToken } = await registry
      .get('user-service')
      .getUserRefreshToken({ userId: profile.sub });

    if (!refreshToken) return { notAuthorized };

    const { idToken } = await refreshIdToken(refreshToken);

    const user = await registry
      .get('user-service')
      .getUser({ userId: profile.sub });

    const { cookie: newCookie } = getSignedSession(
      user,
      idToken.iat,
      idToken.exp,
    );

    return {
      cookie: newCookie,
      profile: {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
      },
    };
  }

  return {
    profile: {
      id: profile.sub,
      name: profile.name,
      email: profile.email,
      avatarUrl: profile.avatarUrl,
    },
  };
}

function parseToken(
  token: string,
  secret: string,
):
  | {
      valid: false;
    }
  | { profile: JwtPayload; expired: boolean; valid: true } {
  try {
    const profile = verify(token, secret, {
      ignoreExpiration: true,
    });

    if (typeof profile === 'string') return { valid: false };
    try {
      verify(token, secret);
      return { profile, expired: false, valid: true };
    } catch {
      return { profile, expired: true, valid: true };
    }
  } catch {
    return { valid: false };
  }
}
