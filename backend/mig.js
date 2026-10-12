
import 'dotenv/config';
import mongoose from 'mongoose';

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URL;

async function migrate() {
  if (!MONGO_URI) {
    throw new Error('MongoDB connection string not found in .env');
  }

  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.\n');

    const db = mongoose.connection.db;

    // 1. Migrate EstimatedIncome records
    for (const collectionName of ['estimatedincomes', 'incomes']) {
      const collection = db.collection(collectionName);

      const result = await collection.updateMany(
        { belongsTo: { $exists: true } },
        [
          {
            $set: {
              category: {
                $ifNull: ['$category', '$belongsTo']
              }
            }
          },
          { $unset: 'belongsTo' }
        ]
      );

      console.log(
        `${collectionName}: ${result.modifiedCount} records migrated`
      );
    }

    // 2. Migrate income and expense records embedded in snapshots
    const snapshots = db.collection('snapshots');

    for (const arrayName of ['Income', 'Expense']) {
      const result = await snapshots.updateMany(
        {
          [`collections.${arrayName}.belongsTo`]: { $exists: true }
        },
        [
          {
            $set: {
              [`collections.${arrayName}`]: {
                $map: {
                  input: {
                    $ifNull: [`$collections.${arrayName}`, []]
                  },
                  as: 'record',
                  in: {
                    $cond: [
                      {
                        $ne: [
                          { $type: '$$record.belongsTo' },
                          'missing'
                        ]
                      },
                      {
                        $mergeObjects: [
                          '$$record',
                          {
                            category: {
                              $ifNull: [
                                '$$record.category',
                                '$$record.belongsTo'
                              ]
                            }
                          }
                        ]
                      },
                      '$$record'
                    ]
                  }
                }
              }
            }
          },
          {
            $unset: [
              `collections.${arrayName}.belongsTo`
            ]
          }
        ]
      );

      console.log(
        `Snapshots - ${arrayName}: ${result.modifiedCount} snapshots updated`
      );
    }

    // 3. Verify remaining legacy fields
    console.log('\n--- Verification ---');

    for (const name of ['estimatedincomes', 'incomes']) {
      const count = await db.collection(name).countDocuments({
        belongsTo: { $exists: true }
      });

      console.log(`${name} remaining belongsTo: ${count}`);
    }

    for (const arrayName of ['Income', 'Expense']) {
      const count = await snapshots.countDocuments({
        [`collections.${arrayName}.belongsTo`]: { $exists: true }
      });

      console.log(
        `Snapshots ${arrayName} remaining belongsTo: ${count}`
      );
    }

    console.log('\nMigration completed.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

migrate();
