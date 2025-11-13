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

      // Prepare databases info with storage
      const databasesInfo = await Promise.all(
        userDatabases.map(async (dbData) => {
          const dbInstance = client.db(dbData.name);
          let collectionsCount = 0;
          let totalSize = 0;
          try {
            const collections = await dbInstance.listCollections().toArray();
            collectionsCount = collections.length;
            for (const coll of collections) {
              const stats = await dbInstance.command({ collStats: coll.name });
              totalSize += (stats.size || 0) + (stats.totalIndexSize || 0);
            }
          } catch {}
          return {
            name: dbData.name,
            collections: collectionsCount,
            storage: totalSize,
          };
        })
      );

      // Total storage used - sum of user databases
      const totalStorageUsed = databasesInfo.reduce((sum, d) => sum + d.storage, 0);

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
      res.status(500).json({ error: 'Failed to fetch MongoDB info' });
    }
  },


  // Collections info for a specific database
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
        } catch (e) {}
        result.push({
          name: coll.name,
          documents: stats.count || 0,
          storage: stats.storageSize || 0,
          indexes: stats.nindexes || 0, 
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
