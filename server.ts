import { setupServer } from 'msw/node';
import { handlers } from './src/handlers';
import http from 'http';

const port = Number(process.env.PORT) || 8000;

(async function runServer() {
  const { default: fetch, Headers, Response } = await import('node-fetch');
  const mockServer = setupServer(...handlers);

  mockServer.listen({
    onUnhandledRequest: 'warn',
  });

  const server = http.createServer(async (req, res) => {
    const body: string = await new Promise(res => {
      let data = '';
      req.on('data', chunk => {
        data += chunk;
      });

      req.on('end', () => {
        res(data);
      });
    });
    const headers = new Headers();
    for (let header in req.headers) {
      headers.append(header, req.headers[header].toString());
    }
    if (req.method === 'OPTIONS') {
      res.writeHead(200, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      });
      res.end('');
      return;
    }
    try {
      res.setHeader('access-control-allow-origin', '*');
      res.setHeader('access-control-allow-headers', '*');
      const requestUrl = `http://localhost:8000${req.url}`;
      const response = await fetch(requestUrl, {
        method: req.method,
        body: req.method !== 'GET' ? body : undefined,
        headers,
      });
      if (!(response instanceof Response)) {
        throw new Error('Response is not instance of Response');
      }
      const result = await response.text();
      response.headers.forEach((v, k) => res.setHeader(k, v));
      res.statusCode = response.status;
      res.end(result);
    } catch (err) {
      console.error(err);
      res.statusCode = 500;
      if (err instanceof Error) {
        res.end(err.message);
      } else {
        res.end(err.toString());
      }
    }
  });

  server.listen(port, () => {
    console.log(`Server running at port ${port}`);
  });
})();
