const defaultEnvironment = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
};

function requireApiBaseUrl(value) {
  if (!value) {
    throw new Error(
      'Missing EXPO_PUBLIC_API_BASE_URL. Copy .env.example to .env and set the API URL.',
    );
  }

  try {
    const url = new URL(value);

    if (!['http:', 'https:'].includes(url.protocol)) {
      throw new Error('Unsupported protocol');
    }

    return url.toString().replace(/\/$/, '');
  } catch {
    throw new Error('EXPO_PUBLIC_API_BASE_URL must be a valid HTTP or HTTPS URL.');
  }
}

export function getMobileConfig(environment = defaultEnvironment) {
  return {
    apiBaseUrl: requireApiBaseUrl(environment.apiBaseUrl),
  };
}
