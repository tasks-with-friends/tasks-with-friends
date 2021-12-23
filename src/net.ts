import https from 'https';
import { URL } from 'url';

export function post(options: {
  url?: string;
  data?: string;
  headers?: Record<string, string>;
}): Promise<string | null> {
  if (!options.url) return Promise.resolve(null);

  const url = new URL(options.url);
  const data = Buffer.from(options.data || '');

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: 'POST',
        headers: {
          ...(options.headers || {}),
          'Content-Length': data.length,
        },
      },
      (response) => {
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
      },
    );

    req.write(data);
    req.end();
  });
}
