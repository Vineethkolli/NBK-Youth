// PERMANENT DELETE command: node utils/deleteDriveFolders.js --ids=1Mg0DkVdE2jSQlrWsVReVVxbmkAJu26gC --permanent

import 'dotenv/config';
import { google } from 'googleapis';
import readline from 'readline';

const argv = process.argv.slice(2);
const params = {};
for (const a of argv) {
  const eq = a.indexOf('=');
  if (eq === -1) params[a.replace(/^--/, '')] = true;
  else params[a.slice(2, eq)] = a.slice(eq + 1);
}

if (!params.ids) {
  console.error('Usage: node utils/deleteDriveFolders.js --ids=<id1,id2,...> [--permanent] [--yes]');
  process.exit(1);
}

const ids = params.ids.split(',').map(s => s.trim()).filter(Boolean);
const permanent = !!params.permanent;
const autoYes = !!params.yes;

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(process.env.GOOGLE_DRIVE_CREDENTIALS),
    scopes: ['https://www.googleapis.com/auth/drive'],
  });
  return await auth.getClient();
}

async function getFileMeta(drive, id) {
  try {
    const res = await drive.files.get({
      fileId: id,
      fields: 'id, name, mimeType, trashed, parents, owners',
      supportsAllDrives: true,
    });
    return res.data;
  } catch (err) {
    return { error: err };
  }
}

async function trashFolder(drive, id) {
  try {
    await drive.files.update({
      fileId: id,
      requestBody: { trashed: true },
      supportsAllDrives: true,
      fields: 'id, trashed',
    });
    return { success: true };
  } catch (err) {
    return { error: err };
  }
}

async function deleteFolderPermanent(drive, id) {
  try {
    await drive.files.delete({
      fileId: id,
      supportsAllDrives: true,
    });
    return { success: true };
  } catch (err) {
    return { error: err };
  }
}

async function confirm(question) {
  if (autoYes) return true;
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question(question + ' (y/N): ', ans => {
      rl.close();
      resolve(ans.trim().toLowerCase() === 'y');
    });
  });
}

(async () => {
  try {
    const authClient = await getAuthClient();
    const drive = google.drive({ version: 'v3', auth: authClient });

    console.log('Checking metadata for folder IDs...\n');

    const metas = [];
    for (const id of ids) {
      const m = await getFileMeta(drive, id);
      if (m.error) {
        console.log(`❌ ${id}: ERROR fetching metadata -> ${m.error.message || m.error}`);
        metas.push({ id, found: false });
      } else {
        console.log(`📁 ${m.name} (${m.id}) — mimeType: ${m.mimeType} — trashed: ${m.trashed}`);
        metas.push({ id: m.id, name: m.name, mimeType: m.mimeType, trashed: !!m.trashed });
      }
    }

    console.log('\nSummary:');
    metas.forEach(m => {
      if (!m.found && !m.name) {
      }
    });

    if (!permanent) {
      // default action: move to trash
      const ok = await confirm(`Move ${ids.length} folder(s) to Trash?`);
      if (!ok) { console.log('Aborted by user.'); process.exit(0); }

      for (const id of ids) {
        const result = await trashFolder(drive, id);
        if (result.error) {
          console.log(`❌ Failed to trash ${id}: ${result.error.message || result.error}`);
        } else {
          console.log(`✅ Trashed ${id}`);
        }
      }
    } else {
      // permanent delete
      const ok = await confirm(`PERMANENTLY DELETE ${ids.length} folder(s)? This is irreversible.`);
      if (!ok) { console.log('Aborted by user.'); process.exit(0); }

      for (const id of ids) {
        const result = await deleteFolderPermanent(drive, id);
        if (result.error) {
          console.log(`❌ Failed to permanently delete ${id}: ${result.error.message || result.error}`);
        } else {
          console.log(`✅ Permanently deleted ${id}`);
        }
      }
    }

    console.log('\nDone.');
  } catch (err) {
    console.error('Fatal error:', err.message || err);
    process.exit(1);
  }
})();
