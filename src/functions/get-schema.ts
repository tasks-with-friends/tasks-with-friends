import type { Handler } from '@netlify/functions';

import http from 'http';
import https from 'https';
function get(url: string | undefined): Promise<string | null> {
  if (!url) return Promise.resolve(null);

  return new Promise((resolve, reject) => {
    const request =
      new URL(url).protocol === 'http' ? http.request : https.request;
    request(url, (response) => {
      let str = '';

      response.on('data', (chunk) => {
        str += chunk;
      });

      response.on('error', (err) => {
        reject(err);
      });

      response.on('end', function () {
        resolve(str);
      });
    }).end();
  });
}

const handler: Handler = async (event, context) => {
  const url = event.queryStringParameters?.url;

  let schema: string | null;
  try {
    schema = await get(url);
  } catch (err) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: err.message }),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ schema }),
  };
};

export { handler };
