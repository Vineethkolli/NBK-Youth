import mongoose from 'mongoose';

export const mongodbStorageController = {
  getClusterInfo: async (req, res) => {
    try {
      const conn = mongoose.connection;
      const client = conn.getClient();
      const adminDb = client.db().admin();

      const serverStatus = await adminDb.serverStatus();
      const dbs = await adminDb.listDatabases();

      const connections = serverStatus.connections;
      const maxConnections = 500;

      const userDatabases = dbs.databases.filter(
        (d) => !['admin', 'local'].includes(d.name)
      );

      const databasesInfo = await Promise.all(
        userDatabases.map(async (dbData) => {
          const dbInstance = client.db(dbData.name);

          let collectionsCount = 0;
          let totalSize = 0;

          try {
            const collections = await dbInstance
              .listCollections()
              .toArray();

            collectionsCount = collections.length;

            for (const coll of collections) {
              const stats = await dbInstance.command({
                collStats: coll.name,
              });

              totalSize +=
                (stats.size || 0) +
                (stats.totalIndexSize || 0);
            }
          } catch (e) {
            console.error(
              `Failed to get stats for database ${dbData.name}:`,
              e
            );
          }

          return {
            name: dbData.name,
            collections: collectionsCount,
            storage: totalSize,
          };
        })
      );

      const totalStorageUsed = databasesInfo.reduce(
        (sum, d) => sum + d.storage,
        0
      );

      res.json({
        quota: {
          storageUsed: totalStorageUsed,
          storageLimit: 512 * 1024 * 1024,
          connections: {
            active: connections.current,
            max: maxConnections,
          },
        },
        databases: databasesInfo,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: 'Failed to fetch MongoDB info',
      });
    }
  },


  getCollectionsInfo: async (req, res) => {
    try {
      const dbName =
        req.query.dbName ||
        mongoose.connection.db.databaseName;

      const db = mongoose.connection
        .getClient()
        .db(dbName);

      const collections = await db
        .listCollections()
        .toArray();

      const result = [];

      for (const coll of collections) {
        let stats = {};

        try {
          stats = await db.command({
            collStats: coll.name,
          });
        } catch (e) {
          console.error(
            `Failed to get stats for collection ${coll.name}:`,
            e
          );
        }

        result.push({
          name: coll.name,
          documents: stats.count || 0,
          storage: stats.storageSize || 0,
          indexes: stats.nindexes || 0,
          indexSize: stats.totalIndexSize || 0,
        });
      }

      res.json({
        collections: result,
        database: dbName,
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: 'Failed to fetch collections info',
      });
    }
  },


  getCollectionDocuments: async (req, res) => {
    try {
      const {
        dbName,
        collectionName,
      } = req.query;

      const batchSize = 50;

      const batch = Math.max(
        parseInt(req.query.batch, 10) || 0,
        0
      );

      if (!dbName || !collectionName) {
        return res.status(400).json({
          error:
            'dbName and collectionName are required',
        });
      }

      const db = mongoose.connection
        .getClient()
        .db(dbName);

      const collection = db.collection(collectionName);

      const totalDocuments =
        await collection.countDocuments();

      const skip = batch * batchSize;

      const documents = await collection
        .find({})
        .skip(skip)
        .limit(batchSize)
        .toArray();

      const hasMore = skip + documents.length < totalDocuments;

      res.json({
        database: dbName,
        collection: collectionName,

        documents,

        pagination: {
          batch,
          batchSize,
          totalDocuments,
          loadedFrom: skip + 1,
          loadedTo: skip + documents.length,
          hasMore,
        },
      });
    } catch (err) {
      console.error(err);

      res.status(500).json({
        error: 'Failed to fetch collection documents',
      });
    }
  },


  downloadCollection: async (req, res) => {
    try {
      const {
        dbName,
        collectionName,
      } = req.query;

      if (!dbName || !collectionName) {
        return res.status(400).json({
          error:
            'dbName and collectionName are required',
        });
      }

      const db = mongoose.connection
        .getClient()
        .db(dbName);

      const collection = db.collection(collectionName);

      const totalDocuments =
        await collection.countDocuments();

      const safeFileName = collectionName.replace(
        /[^a-zA-Z0-9_-]/g,
        '_'
      );

      res.setHeader(
        'Content-Type',
        'application/json; charset=utf-8'
      );

      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${safeFileName}.json"`
      );

      res.write('[\n');

      let first = true;

      const cursor = collection.find({});

      for await (const document of cursor) {
        if (!first) {
          res.write(',\n');
        }

        res.write(
          JSON.stringify(document, null, 2)
        );

        first = false;
      }

      res.write('\n]');

      res.end();
    } catch (err) {
      console.error(err);

      if (!res.headersSent) {
        return res.status(500).json({
          error: 'Failed to download collection',
        });
      }

      res.end();
    }
  },
};
