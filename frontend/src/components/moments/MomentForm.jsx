import { X, Youtube, Upload, FolderOpen } from 'lucide-react';
import YoutubeUploadForm from './YoutubeUploadForm';
import DriveUploadForm from './DriveUploadForm';
import CopyToServiceDriveForm from './CopyToServiceDriveForm';
import MediaUploadForm from './MediaUploadForm';

function MomentForm({ type, onClose, onSubmit }) {
  const getFormTitle = () => {
    switch (type) {
      case 'youtube':
        return 'Add YouTube Video';
      case 'drive':
        return 'Add Drive Link';
      case 'copy-service-drive':
        return 'Add Drive Media';
      case 'upload':
        return 'Upload Media';
      default:
        return 'Add Media';
    }
  };

  const getFormIcon = () => {
    switch (type) {
      case 'youtube':
        return <Youtube className="h-5 w-5 mr-2" />;
      case 'drive':
      case 'copy-service-drive':
        return <FolderOpen className="h-5 w-5 mr-2" />;
      case 'upload':
      default:
        return <Upload className="h-5 w-5 mr-2" />;
    }
  };

  const renderForm = () => {
    switch (type) {
      case 'youtube':
        return <YoutubeUploadForm onSubmit={onSubmit} onClose={onClose} />;
      case 'drive':
        return <DriveUploadForm onSubmit={onSubmit} onClose={onClose} />;
      case 'copy-service-drive':
        return <CopyToServiceDriveForm onSubmit={onSubmit} onClose={onClose} />;
      case 'upload':
        return <MediaUploadForm onSubmit={onSubmit} onClose={onClose} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            {getFormIcon()}
            <h2 className="text-xl font-semibold">{getFormTitle()}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        {renderForm()}
      </div>
    </div>
  );
}

export default MomentForm;
