const DEFAULT_PORT = 3000;

function requireValue(environment, name) {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`Missing ${name}. Copy .env.example to .env and provide a local value.`);
  }

  return value;
}

function parsePort(value) {
  if (!value) {
    return DEFAULT_PORT;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('API_PORT must be an integer between 1 and 65535.');
  }

  return port;
}

export function getApiConfig(environment = process.env) {
  return {
    port: parsePort(environment.API_PORT),
    tokenSecret: requireValue(environment, 'API_TOKEN_SECRET'),
  };
}
