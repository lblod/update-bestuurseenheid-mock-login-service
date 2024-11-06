import { app, errorHandler } from 'mu';
import { CronJob } from 'cron';
import { CRON_PATTERN } from './config';
import { deleteDanglingAccounts, createMissingAccounts } from './queries';

new CronJob(CRON_PATTERN, async function() {
  const now = new Date().toISOString();
  console.log(`Mock-login accounts healing triggered by cron job at ${now}`);
  try {
    await healMockLoginAccounts();
  } catch (err) {
    console.log(`An error occurred during mock-login accounts healing at ${now}: ${err}`)
  }
}, null, true);

/**
 *
 */
async function healMockLoginAccounts() {
  try {
    await deleteDanglingAccounts();
    await createMissingAccounts();
  } catch (err) {
    console.log(`An error occurred: ${err}`);

  }
}

app.get('/', function( req, res ) {
  res.send('Hello mu-javascript-template');
} );


app.post("/heal-mock-logins", async function( req, res ) {
  console.log(`Mock-login accounts healing triggered by manual job.`);
  res.status(201).json({ message: 'Manual healing job scheduled.' });
  try {
    await healMockLoginAccounts();
    console.log(`Mock-login accounts healing triggered by manual job has finished.`);
  } catch (err) {
    console.log(`An error occurred during mock-login accounts healing triggered by manual job: ${err}`);
  }
});

app.use(errorHandler);
