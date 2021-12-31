import { post } from '../net';
import { NetlifyRouter } from '../netlify-router';
import { registry } from '../registry';
import jwt from 'jsonwebtoken';

const router = new NetlifyRouter('/auth');

router.get('/logout', async (event) => ({
  statusCode: 302,
  headers: {
    location: '/?logout=success',
    'set-cookie': `token=${jwt.sign(
      {
        iss: process.env.WEBAPP_DOMAIN,
      },
      process.env.SESSION_COOKIE_SECRET || '',
    )}; Max-Age=3000; path=/`,
  },
}));

router.get('/google', async () => ({
  statusCode: 302,
  headers: {
    location: `https://accounts.google.com/o/oauth2/v2/auth/oauthchooseaccount?client_id=${encodeURIComponent(
      process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    )}&redirect_uri=${encodeURIComponent(
      `${process.env.WEBAPP_DOMAIN}/auth/google/callback`,
    )}&access_type=offline&prompt=consent&response_type=code&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.email&flowName=GeneralOAuthFlow`,
  },
}));

router.get('/google/callback', async (event) => {
  try {
    // 1) read profile
    const res =
      (await post({
        url: 'https://www.googleapis.com/oauth2/v4/token',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
        },
        data: `code=${encodeURIComponent(
          event?.queryStringParameters?.code || '',
        )}&redirect_uri=${encodeURIComponent(
          `${process.env.WEBAPP_DOMAIN}/auth/google/callback`,
        )}&client_id=${encodeURIComponent(
          process.env.GOOGLE_OAUTH_CLIENT_ID || '',
        )}&client_secret=${encodeURIComponent(
          process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
        )}&scope=&grant_type=authorization_code`,
      })) || '';
    const profile = jwt.decode(JSON.parse(res).id_token);
    if (!profile || typeof profile === 'string') {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Unable to parse id_token' }),
      };
    }

    // 2) get or set user
    const user = await registry.get('user-service').getOrCreateUser({
      user: {
        name: profile.name,
        email: profile.email || '',
        provider: 'google',
        providerUserId: profile.sub || '',
        avatarUrl: profile.picture,
      },
    });

    const token = jwt.sign(
      {
        iss: process.env.WEBAPP_DOMAIN,
        sub: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        provider: user.provider,
        providerUserId: user.providerUserId,
        iat: profile.iat,
        exp: profile.exp,
      },
      process.env.SESSION_COOKIE_SECRET || '',
    );

    // 3) on success, set session cookie
    // 4) redirect to home page
    return {
      statusCode: 302,
      headers: {
        location: '/?login=success',
        'set-cookie': `token=${token}; Max-Age=3000; path=/`,
      },
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        err,
      }),
    };
  }
});

module.exports.handler = router.handler.bind(router);
