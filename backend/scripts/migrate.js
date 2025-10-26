// Command: node scripts/migrate.js
// Migrate MongoDB backup from Github Artifact to a MongoDB

import { exec } from 'child_process';

const backupFolder = 'C:/Users/kolli/Downloads/backup-26-10-2025/xdb';
const mongoUri = 'mongodb://localhost:27017/xyzdb';

// Full path to mongorestore.exe
const mongoRestorePath = `"C:/Program Files/MongoDB/Tools/bin/mongorestore.exe"`;

function migrate() {
  console.log('⏳ Starting migration from backup to MongoDB...');

  const cmd = `${mongoRestorePath} --uri="${mongoUri}" "${backupFolder}"`;

  const child = exec(cmd, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Migration failed:', error);
      return;
    }
    if (stderr) console.error('⚠️ stderr:', stderr);
    console.log('✅ Migration complete!');
    console.log(stdout);
  });

  child.stdout.on('data', data => process.stdout.write(data));
  child.stderr.on('data', data => process.stderr.write(data));
}

migrate();
