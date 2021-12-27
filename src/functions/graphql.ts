import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from '@netlify/functions';
import { graphql, buildSchema } from 'graphql';
import { root } from '../graphql/server';
import { source } from '../graphql/server-types.g';
import { Profile } from '../types';
import { registry } from '../registry';

import { verify } from 'jsonwebtoken';

type Request = {
  query: string;
  operationName?: string;
  variables?: Record<string, any>;
};

const handler: Handler = async (event, context) => {
  const { profile, notAuthorized } = authorize(event);
  if (notAuthorized) return notAuthorized;

  const { methodNotAllowed } = checkMethod(event, ['POST', 'HEAD', 'OPTIONS']);
  if (methodNotAllowed) return methodNotAllowed;

  const { unsupportedMediaType } = checkContentType(event, 'application/json');
  if (unsupportedMediaType) return unsupportedMediaType;

  const { query, operationName, variables } = JSON.parse(
    event.body || '{}',
  ) as Request;
  console.log({ query });

  const schema = buildSchema(source);

  const response = await graphql({
    schema,
    source: query,
    rootValue: root,
    operationName,
    variableValues: variables,
    contextValue: {
      profile,
      registry,
    },
  });

  return {
    statusCode: 200,
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify(response),
  };
};

export { handler };

function checkMethod(
  event: HandlerEvent,
  allow: string[],
): { methodNotAllowed?: HandlerResponse } {
  if (allow.includes(event.httpMethod)) return {};

  return {
    methodNotAllowed: {
      statusCode: 405,
      headers: {
        allow: allow.join(', '),
      },
    },
  };
}

function checkContentType(
  event: HandlerEvent,
  contentType: string,
): { unsupportedMediaType?: HandlerResponse } {
  if (event.headers['content-type'] === contentType) return {};

  return {
    unsupportedMediaType: {
      statusCode: 415,
      headers: {
        accept: contentType,
      },
    },
  };
}

function authorize(event: HandlerEvent): {
  notAuthorized?: HandlerResponse;
  profile?: Profile;
} {
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

  try {
    const profile = verify(token, process.env.SESSION_COOKIE_SECRET);

    if (typeof profile === 'string') return { notAuthorized };

    if (!profile.sub) return { notAuthorized };
    if (!profile.name) return { notAuthorized };
    if (!profile.email) return { notAuthorized };

    return {
      profile: {
        id: profile.sub,
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
      },
    };
  } catch {
    return { notAuthorized };
  }
}
