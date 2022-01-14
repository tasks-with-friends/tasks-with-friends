import { NetlifyRouter } from '../netlify-router';
import { registry } from '../registry';
import {
  exchangeAuthCodeForToken,
  getSignedLogoutSession,
  getSignedSession,
} from '../google-oauth';

const router = new NetlifyRouter('/auth');

// TODO: clear user's refresh token
router.get('/logout', async (event) => ({
  statusCode: 302,
  headers: {
    location: '/?logout=success',
    'set-cookie': getSignedLogoutSession().cookie,
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
    // 1) exchange auth code for token
    const authCode = event?.queryStringParameters?.code || '';
    const { idToken, refreshToken } = await exchangeAuthCodeForToken(authCode);

    // 2) get or set user
    const user = await registry.get('user-service').getOrCreateUser({
      user: {
        name: idToken.name,
        email: idToken.email || '',
        provider: 'google',
        providerUserId: idToken.sub || '',
        avatarUrl: idToken.picture,
        refreshToken,
      },
    });

    // 3) on success, set session cookie
    const { cookie } = getSignedSession(user, idToken.iat, idToken.exp);

    // 4) redirect to home page
    return {
      statusCode: 302,
      headers: {
        location: '/?login=success',
        'set-cookie': cookie,
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
