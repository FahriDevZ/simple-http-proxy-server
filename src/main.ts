import dotenv from "dotenv";
import http from 'http';
import nodeDebug from "debug";
import { createProxy } from "proxy";

dotenv.config();

const debug = nodeDebug('simple-http-proxy-server');

function parseColon(value: string): [string, string] {
  const colon = value.indexOf(':');
  return [value.slice(0, colon), value.slice(colon + 1)];
}

function parseBasicAuth(value?: unknown): string | [string, string] {
  if (!value || typeof value !== 'string') {
    throw new Error('No or wrong argument');
  }

  const parts = value.split(' ');
  const scheme = parts[0];
  if (scheme !== 'Basic') {
    return scheme;
  }

  const decoded = Buffer.from(parts[1], 'base64').toString('utf8');
  return parseColon(decoded);
}

function getEnv(key: string, type?: 'string'): string | undefined;
function getEnv(key: string, type: 'number'): number | undefined;
function getEnv(key: string, type?: 'string' | 'number'): string | number | undefined {
  if (key in process.env) {
    const value = process.env[key];
    if (type === 'number' && value) {
      return parseInt(value, 10);
    }
    return value;
  }

  return undefined;
}

/**
 * Get auth from env
 *
 * should ordering env number like AUTH0, AUTH1, AUTH2, ...and more
 */
function getAuthEnv() {
  let result = [];

  if (!process.env.AUTH0) {
    const auth = getEnv('AUTH');
    if (auth) return [auth];
    return [];
  }
  let done = false;
  let i = 0;
  do {
    const auth = getEnv(`AUTH${i++}`);
    if (!auth) {
      done = true;
    } else {
      result.push(auth);
    }
  } while (!done);
  return result;
}

async function bootstrap() {
  const port = getEnv("PORT", "number") ?? 9875;
  const host = getEnv("HOST") ?? "0.0.0.0";

  const server = createProxy(http.createServer());

  const authEnv = getAuthEnv();
  if (authEnv.length > 0) {
    debug("Using basic authentication: %s", authEnv.map(x => `"${x}"`).join(", "));

    const authList = authEnv.map(x => parseColon(x));

    server.authenticate = (req) => {
      const auth = req.headers['proxy-authorization'];
      if (!auth) {
        return false;
      }

      const parsed = parseBasicAuth(auth);
      if (typeof parsed === 'object') {
        debug(`Basic authentication: ${parsed[0]} ${parsed[1]}`);
        const passed = authList.some(x => x[0] === parsed[0] && x[1] === parsed[1]);
        if (passed) {
          return true;
        } else {
          debug('Basic authentication failed: %s', parsed[0]);
        }
      }

      return false;
    };
  }

  server.listen({ port, host }, () => {
    const address = server.address() as { address: string; port: number };
    debug('HTTP(s) proxy server listening on %s:%d', address.address, address.port);
  });
}

void bootstrap();
