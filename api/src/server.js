import { createApp } from './app.js';
import { getApiConfig } from './config.js';
import { AuthService } from './services/AuthService.js';

const { port, tokenSecret } = getApiConfig();
const authService = new AuthService({ tokenSecret });
const app = createApp({ authService });

const server = app.listen(port, () => {
  console.log(`MySeizures API listening on port ${port}.`);
});

function shutdown() {
  server.close((error) => {
    if (error) {
      console.error('MySeizures API failed to shut down cleanly.', error);
      process.exitCode = 1;
    }
  });
}

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
