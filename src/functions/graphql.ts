import type {
  Handler,
  HandlerEvent,
  HandlerResponse,
} from '@netlify/functions';
import { graphql, buildSchema } from 'graphql';
import { root } from '../graphql/server';
import { source } from '../domain/v1/graph.g';
import { registry } from '../registry';

import { authorize } from '../google-oauth';

type Request = {
  query: string;
  operationName?: string;
  variables?: Record<string, any>;
};

const handler: Handler = async (event, context) => {
  const { profile, cookie, notAuthorized } = await authorize(event);
  if (notAuthorized) return notAuthorized;

  const { methodNotAllowed } = checkMethod(event, ['POST', 'HEAD', 'OPTIONS']);
  if (methodNotAllowed) return methodNotAllowed;

  const { unsupportedMediaType } = checkContentType(event, 'application/json');
  if (unsupportedMediaType) return unsupportedMediaType;

  const { query, operationName, variables } = JSON.parse(
    event.body || '{}',
  ) as Request;

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

  const headers: Record<string, string | number | boolean> = {
    'content-type': 'application/json',
  };

  if (cookie) headers['set-cookie'] = cookie;

  return {
    statusCode: 200,
    headers,
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
