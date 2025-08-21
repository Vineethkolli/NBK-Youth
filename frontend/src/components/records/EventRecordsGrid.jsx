import { useState } from "react";
import { Edit2, Trash2, FileText, ExternalLink, X, Download, Loader2 } from "lucide-react";

function EventRecordsGrid({ records, isEditMode, onEdit, onDelete }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState(null);
  const [previewYear, setPreviewYear] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Open PDF Preview
  const previewFile = (fileUrl, eventName, recordYear) => {
    const match = fileUrl.match(/[-\w]{25,}/); // extract Drive file ID
    if (!match) {
      alert("Invalid file link");
      return;
    }

    const previewLink = `https://drive.google.com/file/d/${match[0]}/preview`;
    setPreviewUrl(previewLink);
    setPreviewName(eventName);
    setPreviewYear(recordYear);
    setLoadingPreview(true); // start loader until iframe loads
  };

  // Download PDF (direct link)
  const downloadFile = (fileUrl, eventName, recordYear) => {
    try {
      setDownloading(true);

      const match = fileUrl.match(/[-\w]{25,}/);
      if (!match) throw new Error("Invalid file link");

      // Direct download link
      const downloadUrl = `https://drive.google.com/uc?export=download&id=${match[0]}`;

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${eventName}_${recordYear}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Simulate loader until browser takes over download
      setTimeout(() => {
        setDownloading(false);
      }, 3000); 
    } catch (error) {
      alert("Error downloading file");
      setDownloading(false);
    }
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No event records found</p>
        <p className="text-sm text-gray-400">Upload PDF files to manage event records</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid of Records */}
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
                {isEditMode && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(record)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDelete(record._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => previewFile(record.fileUrl, record.eventName, record.recordYear)}
                className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open File
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* PDF Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white w-11/12 md:w-3/4 lg:w-2/3 h-5/6 rounded-lg shadow-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b">
              <div>
                <h2 className="font-semibold text-lg">{previewName}</h2>
                <p className="text-sm text-gray-500">{previewYear}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => downloadFile(previewUrl, previewName, previewYear)}
                  className="text-gray-600 hover:text-gray-900"
                  disabled={downloading}
                >
                  {downloading ? (
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
                    setLoadingPreview(false);
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* PDF Viewer */}
            <div className="flex-1 relative">
              {loadingPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-white">
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
