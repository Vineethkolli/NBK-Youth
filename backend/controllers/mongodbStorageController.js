import mongoose from 'mongoose';

export const mongodbStorageController = {
  getClusterInfo: async (req, res) => {
    try {
      const conn = mongoose.connection;
      const client = conn.getClient();
      const adminDb = client.db().admin();

      const serverStatus = await adminDb.serverStatus();
      const dbs = await adminDb.listDatabases();

      // Connections info (limit max for Free Tier)
      const connections = serverStatus.connections;
      const maxConnections = 100; // Free-tier limit

      // Prepare databases info
      const databasesInfo = await Promise.all(
        dbs.databases.map(async (dbData) => {
          const dbInstance = client.db(dbData.name);
          let collectionsCount = 0;
          try {
            collectionsCount = (await dbInstance.listCollections().toArray()).length;
          } catch {}
          return {
            name: dbData.name,
            collections: collectionsCount,
            storage: dbData.sizeOnDisk,
          };
        })
      );

      res.json({
        cluster: {
          name: conn.name,
          state: conn.readyState === 1 ? 'running' : 'idle',
        },
        quota: {
          storageUsed: dbs.databases.reduce((sum, d) => sum + d.sizeOnDisk, 0),
          storageLimit: 512 * 1024 * 1024, // Free-tier 512MB
          connections: {
            active: connections.current,
            max: maxConnections,
          },
        },
        databases: databasesInfo,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch cluster info' });
    }
  },


  // Collections info for a specific database (default DB)
  getCollectionsInfo: async (req, res) => {
    try {
      const dbName = req.query.dbName || mongoose.connection.db.databaseName;
      const db = mongoose.connection.getClient().db(dbName);

      const collections = await db.listCollections().toArray();
      const result = [];

      for (const coll of collections) {
        let stats = {};
        try {
          stats = await db.command({ collStats: coll.name });
        } catch (e) {
          console.warn(`Cannot get stats for collection ${coll.name}:`, e.message);
        }

        result.push({
          name: coll.name,
          documents: stats.count || 0,
          storage: stats.size || 0,
          indexSize: stats.totalIndexSize || 0,
        });
      }

      res.json({ collections: result, database: dbName });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch collections info' });
    }
  },
};
