import { Edit2, Trash2, FileText, ExternalLink } from 'lucide-react';

function EventRecordsGrid({ records, isEditMode, onEdit, onDelete }) {
  const openFile = (fileUrl) => {
    window.open(fileUrl, '_blank', 'noopener,noreferrer');
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {records.map((record) => (
        <div key={record._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
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
              onClick={() => openFile(record.fileUrl)}
              className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open File
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default EventRecordsGrid;