// Command: node scripts/mongodbMigrate.js
// Migrate MongoDB Atlas data to other MongoDB Atlas

import 'dotenv/config';
import mongoose from 'mongoose';

const SOURCE_URI = process.env.SOURCE_MONGODB_URI;
const DESTINATION_URI = process.env.DESTINATION_MONGODB_URI;

async function copyMongoDatabase() {
  let sourceConnection;
  let destinationConnection;

  try {
    if (!SOURCE_URI || !DESTINATION_URI) {
      throw new Error(
        'SOURCE_MONGODB_URI or DESTINATION_MONGODB_URI is missing from .env'
      );
    }

    console.log('Connecting to source MongoDB...');
    sourceConnection = await mongoose
      .createConnection(SOURCE_URI)
      .asPromise();

    console.log('Connecting to destination MongoDB...');
    destinationConnection = await mongoose
      .createConnection(DESTINATION_URI)
      .asPromise();

    const sourceDb = sourceConnection.db;
    const destinationDb = destinationConnection.db;

    console.log('Source database:', sourceDb.databaseName);
    console.log('Destination database:', destinationDb.databaseName);

    const collections = await sourceDb
      .listCollections({}, { nameOnly: false })
      .toArray();

    console.log(`\nFound ${collections.length} collections.\n`);

    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;

      if (collectionName.startsWith('system.')) {
        console.log(`Skipping internal collection: ${collectionName}`);
        continue;
      }

      console.log(`Copying collection: ${collectionName}`);

      const sourceCollection = sourceDb.collection(collectionName);

      let destinationCollection;

      const existingCollection = await destinationDb
        .listCollections({ name: collectionName }, { nameOnly: true })
        .hasNext();

      if (!existingCollection) {
        destinationCollection = await destinationDb.createCollection(
          collectionName
        );
      } else {
        destinationCollection = destinationDb.collection(collectionName);
      }

      let batch = [];
      let copied = 0;
      const batchSize = 500;

      const cursor = sourceCollection.find({});

      async function writeBatch() {
        if (batch.length === 0) return;

        await destinationCollection.bulkWrite(
          batch.map((document) => ({
            replaceOne: {
              filter: { _id: document._id },
              replacement: document,
              upsert: true,
            },
          })),
          { ordered: false }
        );

        copied += batch.length;
        batch = [];
      }

      for await (const document of cursor) {
        batch.push(document);

        if (batch.length >= batchSize) {
          await writeBatch();
        }
      }

      await writeBatch();
      await cursor.close();

      // Copy indexes, except the automatically created _id index.
      const indexes = await sourceCollection.indexes();

      for (const index of indexes) {
        if (index.name === '_id_') continue;

        const { key, name, ns, v, background, ...options } = index;

        await destinationCollection.createIndex(key, {
          ...options,
          name,
        });
      }

      console.log(`Completed: ${collectionName} (${copied} documents)`);
    }

    console.log('\nAll source collections copied successfully.');
    console.log(
      'Existing destination-only documents and collections were preserved.'
    );
  } catch (error) {
    console.error('\nMongoDB copy failed:', error);
    process.exitCode = 1;
  } finally {
    if (sourceConnection) await sourceConnection.close();
    if (destinationConnection) await destinationConnection.close();

    console.log('MongoDB connections closed.');
  }
}

copyMongoDatabase();
