import { useState } from "react";
import { Edit2, Trash2, FileText, ExternalLink, X, Download, Loader2 } from "lucide-react";

function EventRecordsGrid({ records = [], isEditMode, onEdit, onDelete }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState(null);
  const [previewYear, setPreviewYear] = useState(null);
  const [previewFileUrl, setPreviewFileUrl] = useState(null); 
  const [chooserRecord, setChooserRecord] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  // Open PDF Preview 
  const previewFile = (fileUrl, eventName, recordYear) => {
    if (!fileUrl) {
      alert("File URL not available");
      return;
    }
    const googleViewerUrl = `https://docs.google.com/gview?url=${encodeURIComponent(fileUrl)}&embedded=true`;
    setPreviewUrl(googleViewerUrl);
    setPreviewFileUrl(fileUrl); 
    setPreviewName(eventName);
    setPreviewYear(recordYear);
    setLoadingPreview(true);
  };

  // Choose which file to open/download
  const openOrDownloadWithChooser = (record, action) => {
    const eng = record.fileUrlEnglish || record.fileUrl;
    const tel = record.fileUrlTelugu;
    if (!eng && !tel) {
      alert("No file available for this record");
      return;
    }
    if (eng && tel) {
      setChooserRecord({ record, action });
    } else if (eng) {
      action === "open"
        ? previewFile(eng, record.eventName, record.recordYear)
        : downloadFile(eng, record.eventName, record.recordYear, record._id);
    } else if (tel) {
      action === "open"
        ? previewFile(tel, record.eventName, record.recordYear)
        : downloadFile(tel, record.eventName, record.recordYear, record._id);
    }
  };

  // Download PDF safely
  const downloadFile = async (fileUrl, eventName, recordYear, recordId) => {
    try {
      setDownloadingId(recordId);
      const resp = await fetch(fileUrl);
      if (!resp.ok) throw new Error("Failed to download file");

      const blob = await resp.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      const safeEvent = (eventName || "Event").replace(/[/\\?%*:|"<>]/g, "_");
      const filename = `${safeEvent}_Record_${recordYear || "unknown"}.pdf`;
      link.href = blobUrl;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error(err);
      alert("Error downloading file");
    } finally {
      setDownloadingId(null);
    }
  };

  if (!records || records.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No event records found</p>
      </div>
    );
  }

  return (
    <>
      {/* Records Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {records.map((record) => (
          <div
            key={record._id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-red-600 mr-3" />
                  <div>
                    <h3 className="font-semibold text-lg">{record.eventName}</h3>
                    <p className="text-sm text-gray-500">{record.recordYear}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openOrDownloadWithChooser(record, 'download')}
                    className="text-gray-600 hover:text-gray-900"
                    title="Download PDF"
                    disabled={downloadingId === record._id}
                  >
                    {downloadingId === record._id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Download className="h-5 w-5" />
                    )}
                  </button>

                  {isEditMode && (
                    <>
                      <button
                        onClick={() => onEdit(record)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(record._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => openOrDownloadWithChooser(record, 'open')}
                className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                title="Open File (preview)"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Language choose modal */}
      {chooserRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 w-[90%] max-w-xs relative">
            <button
              onClick={() => setChooserRecord(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-semibold mb-3">Choose Language</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select which language file to {chooserRecord.action}
            </p>

            <div className="flex flex-col space-y-3">
              {(chooserRecord.record.fileUrlEnglish || chooserRecord.record.fileUrl) && (
                <button
                  onClick={() => {
                    const url = chooserRecord.record.fileUrlEnglish || chooserRecord.record.fileUrl;
                    if (chooserRecord.action === "open")
                      previewFile(url, chooserRecord.record.eventName, chooserRecord.record.recordYear);
                    else
                      downloadFile(url, chooserRecord.record.eventName, chooserRecord.record.recordYear, chooserRecord.record._id);
                    setChooserRecord(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  English
                </button>
              )}

              {chooserRecord.record.fileUrlTelugu && (
                <button
                  onClick={() => {
                    const url = chooserRecord.record.fileUrlTelugu;
                    if (chooserRecord.action === "open")
                      previewFile(url, chooserRecord.record.eventName, chooserRecord.record.recordYear);
                    else
                      downloadFile(url, chooserRecord.record.eventName, chooserRecord.record.recordYear, chooserRecord.record._id);
                    setChooserRecord(null);
                  }}
                  className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  Telugu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white w-11/12 md:w-3/4 lg:w-2/3 h-5/6 rounded-lg shadow-lg overflow-hidden flex flex-col">
          
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <div>
                <h2 className="font-semibold text-lg">{previewName}</h2>
                <p className="text-sm text-gray-500">{previewYear}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => downloadFile(previewFileUrl, previewName, previewYear, null)}
                  className="text-gray-600 hover:text-gray-900"
                  disabled={downloadingId !== null}
                >
                  {downloadingId !== null ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <Download className="h-6 w-6" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setPreviewName(null);
                    setPreviewYear(null);
                    setPreviewFileUrl(null);
                    setLoadingPreview(false);
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 relative">
              {loadingPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
                  <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
                </div>
              )}
              <iframe
                src={previewUrl}
                title={previewName}
                className="flex-1 w-full h-full"
                allow="autoplay"
                onLoad={() => setLoadingPreview(false)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default EventRecordsGrid;
