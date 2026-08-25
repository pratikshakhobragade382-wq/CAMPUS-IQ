// server.js

require('dotenv').config({ quiet: true });

const { validateEnv } = require('./utils/validateEnv');
validateEnv(); // Exits with a clear error if required config (DB, JWT secret) is missing.

const app = require('./app');
const { startFeeDeadlineJob } = require('./jobs/feeDeadlineJob'); // NEW

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );

  // NEW: start the daily fee-deadline background job once the server is up.
  startFeeDeadlineJob();
});