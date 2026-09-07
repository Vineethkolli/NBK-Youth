import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { RefreshCcw, FileText, ChevronRight, Home, Database, ArrowLeft, Download, ChevronLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

const BATCH_SIZE = 50;
const DISPLAY_SIZE = 10;
const PAGES_PER_BATCH = BATCH_SIZE / DISPLAY_SIZE;

export default function MongoDBMonitor() {
  const [quota, setQuota] = useState(null);
  const [databases, setDatabases] = useState([]);
  const [collections, setCollections] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDatabase, setSelectedDatabase] =
    useState(null);

  const [selectedCollection, setSelectedCollection] =
    useState(null);

  const [loading, setLoading] = useState(false);
  const [documentsLoading, setDocumentsLoading] =
    useState(false);

  const [downloadLoading, setDownloadLoading] =
    useState(null);

  const [batchNumber, setBatchNumber] = useState(0);
  const [displayPage, setDisplayPage] = useState(0);

  const [pagination, setPagination] = useState({
    batch: 0,
    batchSize: BATCH_SIZE,
    totalDocuments: 0,
    loadedFrom: 0,
    loadedTo: 0,
    hasMore: false,
  });


  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resCluster = await axios.get(
        `${API_URL}/api/monitor/mongodb/cluster`
      );
      setQuota(resCluster.data.quota);
      setDatabases(resCluster.data.databases || []);
      const defaultDb =
        resCluster.data.databases?.[0]?.name;

      if (defaultDb) {
        setSelectedDatabase(defaultDb);
        const resColl = await axios.get(
          `${API_URL}/api/monitor/mongodb/collections?dbName=${encodeURIComponent(
            defaultDb
          )}`
        );

        setCollections(
          resColl.data.collections || []
        );
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch MongoDB data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const fetchCollections = async (dbName) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/monitor/mongodb/collections?dbName=${encodeURIComponent(
          dbName
        )}`
      );

      setCollections(res.data.collections || []);
      setSelectedDatabase(dbName);
      setSelectedCollection(null);
      setDocuments([]);
      setBatchNumber(0);
      setDisplayPage(0);
      setPagination({
        batch: 0,
        batchSize: BATCH_SIZE,
        totalDocuments: 0,
        loadedFrom: 0,
        loadedTo: 0,
        hasMore: false,
      });
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch collections');
    } finally {
      setLoading(false);
    }
  };

  const loadDocumentBatch = async (
    collection,
    batch,
    targetPage = 0
  ) => {
    if (!selectedDatabase) return;
    setDocumentsLoading(true);
    try {
      const res = await axios.get(
        `${API_URL}/api/monitor/mongodb/collection-documents`,
        {
          params: {
            dbName: selectedDatabase,
            collectionName: collection.name,
            batch,
          },
        }
      );

      const newDocuments = res.data.documents || [];
      setDocuments(newDocuments);
      setPagination(
        res.data.pagination || {
          batch,
          batchSize: BATCH_SIZE,
          totalDocuments: 0,
          loadedFrom: 0,
          loadedTo: 0,
          hasMore: false,
        }
      );

      setBatchNumber(batch);
      const availablePages = Math.max(
        Math.ceil(newDocuments.length / DISPLAY_SIZE),
        1
      );

      setDisplayPage(
        Math.min(targetPage, availablePages - 1)
      );
    } catch (err) {
      console.error(err);
      toast.error(
        'Failed to fetch collection documents'
      );
    } finally {
      setDocumentsLoading(false);
    }
  };


  const openCollection = async (collection) => {
    if (!selectedDatabase) return;
    setSelectedCollection(collection);
    setDocuments([]);
    setBatchNumber(0);
    setDisplayPage(0);
    await loadDocumentBatch(collection, 0, 0);
  };


  const goHome = () => {
    setSelectedDatabase(null);
    setSelectedCollection(null);
    setDocuments([]);
    setBatchNumber(0);
    setDisplayPage(0);
    setPagination({
      batch: 0,
      batchSize: BATCH_SIZE,
      totalDocuments: 0,
      loadedFrom: 0,
      loadedTo: 0,
      hasMore: false,
    });
  };


  const goToDatabase = async () => {
    if (!selectedDatabase) return;
    setSelectedCollection(null);
    setDocuments([]);
    setBatchNumber(0);
    setDisplayPage(0);
    await fetchCollections(selectedDatabase);
  };


  const downloadCollection = async (collection) => {
    if (!selectedDatabase) return;
    setDownloadLoading(collection.name);
    try {
      const response = await axios.get(
        `${API_URL}/api/monitor/mongodb/download-collection`,
        {
          params: {
            dbName: selectedDatabase,
            collectionName: collection.name,
          },
          responseType: 'blob',
        }
      );

      const blob = new Blob([response.data], {
        type: 'application/json',
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${collection.name}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success(
        `${collection.name} downloaded`
      );
    } catch (err) {
      console.error(err);
      toast.error(
        'Failed to download collection'
      );
    } finally {
      setDownloadLoading(null);
    }
  };


  const totalPagesInBatch = Math.ceil(
    documents.length / DISPLAY_SIZE
  );

  const startIndex =
    displayPage * DISPLAY_SIZE;
  const endIndex =
    startIndex + DISPLAY_SIZE;
  const visibleDocuments = documents.slice(
    startIndex,
    endIndex
  );
  const globalPageNumber =
    batchNumber * PAGES_PER_BATCH +
    displayPage;
  const totalPages = Math.ceil(
    pagination.totalDocuments / DISPLAY_SIZE
  );


  const showingFrom =
    pagination.totalDocuments === 0
      ? 0
      : batchNumber * BATCH_SIZE +
        displayPage * DISPLAY_SIZE +
        1;
  const showingTo =
    pagination.totalDocuments === 0
      ? 0
      : Math.min(
          showingFrom + visibleDocuments.length - 1,
          pagination.totalDocuments
        );


  const handleNext = async () => {
    if (
      displayPage <
      totalPagesInBatch - 1
    ) {
      setDisplayPage(
        (prev) => prev + 1
      );

      return;
    }

    if (
      pagination.hasMore &&
      selectedCollection
    ) {
      await loadDocumentBatch(
        selectedCollection,
        batchNumber + 1,
        0
      );
    }
  };


  const handlePrevious = async () => {
    if (displayPage > 0) {
      setDisplayPage(
        (prev) => prev - 1
      );

      return;
    }
    if (
      batchNumber > 0 &&
      selectedCollection
    ) {
      const previousBatch =
        batchNumber - 1;
      await loadDocumentBatch(
        selectedCollection,
        previousBatch,
        PAGES_PER_BATCH - 1
      );
    }
  };


  const formatBytes = (bytes) => {
    if (!bytes) return '0 B';
    const units = [
      'B',
      'KB',
      'MB',
      'GB',
    ];

    let i = 0;
    let value = bytes;
    while (
      value >= 1024 &&
      i < units.length - 1
    ) {
      value /= 1024;
      i++;
    }
    return (
      value.toFixed(2) +
      ' ' +
      units[i]
    );
  };


  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-6xl mx-auto space-y-6 font-sans">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900 pb-3">
          MongoDB Monitor
        </h2>
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={goHome}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition ${
              !selectedDatabase
                ? 'text-indigo-600 font-semibold'
                : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            <Home className="w-4 h-4" />
            Home
          </button>

          {selectedDatabase && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />

              <button
                onClick={goToDatabase}
                className={`flex items-center gap-1 px-2 py-1 rounded-md transition ${
                  !selectedCollection
                    ? 'text-indigo-600 font-semibold'
                    : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
                }`}
              >
                <Database className="w-4 h-4" />
                {selectedDatabase}
              </button>
            </>
          )}

          {selectedCollection && (
            <>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="flex items-center gap-1 px-2 py-1 text-indigo-600 font-semibold">
                <FileText className="w-4 h-4" />
                {selectedCollection.name}
              </span>
            </>
          )}
        </div>
      </div>


      {!selectedCollection && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 text-sm w-full">
            <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
              <div className="text-xs font-medium text-indigo-600 uppercase">
                Storage Limit
              </div>
              <div className="font-bold text-gray-900 text-lg">
                {quota
                  ? formatBytes(
                      quota.storageLimit
                    )
                  : '...'}
              </div>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
              <div className="text-xs font-medium text-indigo-600 uppercase">
                Storage Used
              </div>
              <div className="font-bold text-gray-900 text-lg">
                {quota
                  ? formatBytes(
                      quota.storageUsed
                    )
                  : '...'}
              </div>
            </div>

            <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
              <div className="text-xs font-medium text-indigo-600 uppercase">
                Connections
              </div>
              <div className="font-bold text-gray-900 text-lg">
                {quota
                  ? `${quota.connections.active} / ${quota.connections.max}`
                  : '...'}
              </div>
            </div>

            {(databases &&
            databases.length > 0
              ? databases
              : Array.from(
                  { length: 3 },
                  (_, i) => ({
                    name: i,
                    collections: null,
                  })
                )
            ).map((db) => (
              <button
                key={db.name}
                onClick={() => {
                  if (
                    db.collections !==
                    null
                  ) {
                    fetchCollections(
                      db.name
                    );
                  }
                }}
                className={`p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md text-left transition ${
                  db.collections !==
                  null
                    ? 'hover:bg-indigo-100 cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                <div className="text-xs font-medium text-indigo-600 uppercase">
                  Collections
                </div>

                <div className="font-bold text-gray-900 text-lg">
                  {quota &&
                  db.collections !==
                    null
                    ? db.collections
                    : '...'}
                </div>
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {typeof db.name ===
                  'string'
                    ? db.name
                    : ''}
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end mb-2">
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-60"
              disabled={loading}
            >
              <RefreshCcw
                className={`w-4 h-4 ${
                  loading
                    ? 'animate-spin'
                    : ''
                }`}
              />
              {loading
                ? 'Syncing...'
                : 'Sync'}
            </button>
          </div>
        </>
      )}

      {!selectedCollection && (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xl">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                <th className="p-3 text-center font-bold text-gray-700">
                  S.No.
                </th>
                <th className="p-3 text-left font-bold text-gray-700">
                  Collection Name
                </th>
                <th className="p-3 text-center font-bold text-gray-700">
                  Documents
                </th>
                <th className="p-3 text-left font-bold text-gray-700">
                  Storage
                </th>
                <th className="p-3 text-center font-bold text-gray-700">
                  Indexes
                </th>
                <th className="p-3 text-left font-bold text-gray-700">
                  Index Size
                </th>
                <th className="p-3 text-center font-bold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {collections.map(
                (c, idx) => (
                  <tr
                    key={c.name}
                    className="hover:bg-indigo-50 transition"
                  >
                    <td className="p-3 text-gray-600 text-center">
                      {idx + 1}
                    </td>
                    <td
                      className="p-3 text-gray-800 cursor-pointer"
                      onClick={() =>
                        openCollection(c)
                      }
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-500" />
                        <span className="font-medium hover:text-indigo-600">
                          {c.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-center text-gray-600">
                      {c.documents}
                    </td>
                    <td className="p-3 text-left text-gray-600">
                      {formatBytes(
                        c.storage
                      )}
                    </td>
                    <td className="p-3 text-center text-gray-600">
                      {c.indexes}
                    </td>
                    <td className="p-3 text-left text-gray-600">
                      {formatBytes(
                        c.indexSize
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadCollection(
                            c
                          );
                        }}
                        disabled={
                          downloadLoading ===
                          c.name
                        }
                        title="Download entire collection"
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 text-indigo-600  rounded-lg hover:bg-indigo-100 transition disabled:opacity-50"
                      >
                        <Download
                          className={`w-4 h-4 ${
                            downloadLoading ===
                            c.name
                              ? 'animate-pulse'
                              : ''
                          }`}
                        />
                      </button>
                    </td>
                  </tr>
                )
              )}

              {collections.length ===
                0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="p-4 text-center text-gray-500"
                  >
                    {loading
                      ? 'Loading collections...'
                      : 'No collections found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}


      {selectedCollection && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {selectedCollection.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {pagination.totalDocuments}{' '}
                document
                {pagination.totalDocuments !==
                1
                  ? 's'
                  : ''}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  downloadCollection(
                    selectedCollection
                  )
                }
                disabled={
                  downloadLoading ===
                  selectedCollection.name
                }
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition disabled:opacity-60"
              >
                <Download
                  className={`w-4 h-4 ${
                    downloadLoading ===
                    selectedCollection.name
                      ? 'animate-pulse'
                      : ''
                  }`}
                />
              </button>
              <button
                onClick={goToDatabase}
                className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 shadow-xl overflow-hidden">
            {documentsLoading ? (
              <div className="p-10 text-center text-gray-500">
                Loading documents...
              </div>
            ) : documents.length ===
              0 ? (
              <div className="p-10 text-center text-gray-500">
                No documents found in this collection.
              </div>
            ) : (
              <div className="bg-gray-50 p-4 space-y-4">
                {visibleDocuments.map(
                  (doc, index) => {

                    const actualIndex =
                      batchNumber *
                        BATCH_SIZE +
                      displayPage *
                        DISPLAY_SIZE +
                      index +
                      1;
                    return (
                      <div
                        key={
                          doc._id ||
                          actualIndex
                        }
                        className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
                      >

                        <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
                          <span className="text-sm font-semibold text-gray-600">
                            Document{' '}
                            {actualIndex}
                          </span>
                          {doc._id && (
                            <span className="text-xs text-gray-500 font-mono">
                              _id:{' '}
                              {String(
                                doc._id
                              )}
                            </span>
                          )}
                        </div>

                        <pre className="p-5 text-sm text-gray-800 font-mono overflow-x-auto whitespace-pre-wrap break-words">
                          {JSON.stringify(
                            doc,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {pagination.totalDocuments >
            DISPLAY_SIZE && (
            <div className="flex items-center justify-between pt-2">
              <div className="text-sm text-gray-500">
                Showing{' '}
                {showingFrom}
                {' – '}
                {showingTo}
                {' of '}
                {pagination.totalDocuments}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={
                    handlePrevious
                  }
                  disabled={
                    documentsLoading ||
                    (batchNumber === 0 &&
                      displayPage === 0)
                  }
                  className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <div className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg font-medium text-sm">
                  Page{' '}
                  {globalPageNumber +
                    1}{' '}
                  of{' '}
                  {totalPages}
                </div>
                <button
                  onClick={
                    handleNext
                  }
                  disabled={
                    documentsLoading ||
                    (
                      displayPage >=
                        totalPagesInBatch -
                          1 &&
                      !pagination.hasMore
                    )
                  }
                  className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
