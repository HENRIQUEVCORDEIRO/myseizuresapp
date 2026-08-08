import app from './app.js';
import { getApiConfig } from './config.js';

const { port } = getApiConfig();

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
