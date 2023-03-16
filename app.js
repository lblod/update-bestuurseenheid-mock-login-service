import { app, errorHandler } from 'mu';
import { CronJob } from 'cron';
import { CRON_PATTERN } from './config';
import { deleteDanglingAccounts, createMissingAccounts } from './queries';

app.get('/', function( req, res ) {
  res.send('Hello mu-javascript-template');
} );

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

app.use(errorHandler);
