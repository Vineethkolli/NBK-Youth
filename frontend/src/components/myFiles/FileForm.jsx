import { useState } from 'react';
import axios from 'axios';
import { Upload, Lock, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';
import { uploadDirectToCloudinary } from '../../utils/cloudinaryUpload';

const FILE_SIZE_LIMITS = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  other: 10 * 1024 * 1024,
};

const getFileSizeLimit = (file) => {
  if (file.type.startsWith('image/')) return FILE_SIZE_LIMITS.image;
  if (file.type.startsWith('video/')) return FILE_SIZE_LIMITS.video;
  return FILE_SIZE_LIMITS.other;
};

const validateFileSize = (file) => {
  const limit = getFileSizeLimit(file);

  if (file.size <= limit) return null;

  const limitInMb = limit / (1024 * 1024);
  const fileType = file.type.startsWith('image/')
    ? 'Image'
    : file.type.startsWith('video/')
      ? 'Video'
      : 'Raw';

  return `${fileType} files must be ${limitInMb} MB or smaller`;
};

export default function FileForm({
  kind,
  file,
  pin,
  onClose,
  onSaved,
}) {
  const [title, setTitle] = useState(
    file?.title || ''
  );

  const [description, setDescription] = useState(
    file?.description || ''
  );

  const [passwordProtected, setPasswordProtected] = useState(
    Boolean(file?.passwordProtected)
  );

  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  const isEditing = Boolean(file);

  const extension =
    selected?.name?.match(/\.[^.]+$/)?.[0] || '';

  const titleWithExtension =
    title.trim().endsWith(extension)
      ? title.trim()
      : `${title.trim()}${extension}`;

  const cloudinaryName =
    titleWithExtension.replace(
      /[^a-zA-Z0-9._-]+/g,
      '_'
    );

  const save = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!isEditing && !selected) {
      toast.error('Please select a file');
      return;
    }

    if (!isEditing) {
      const fileSizeError = validateFileSize(selected);

      if (fileSizeError) {
        toast.error(fileSizeError);
        return;
      }
    }

    setSaving(true);
    setUploadPercent(0);

    try {
      if (isEditing) {
        await axios.put(
          `${API_URL}/api/my-files/files/${file._id}`,
          {
            title: title.trim(),
            description: description.trim(),
            passwordProtected,
          },
          pin
            ? {
                headers: {
                  'X-Universal-Pin': pin,
                },
              }
            : undefined
        );

        toast.success('File updated');
      } else {
        const uploaded =
          await uploadDirectToCloudinary({
            file: selected,
            publicId: cloudinaryName,
            folder:
              kind === 'dump'
                ? 'Dumps'
                : 'Assets',
            resourceType: 'auto',

            onProgress: (percent) => {
              setUploadPercent(percent);
            },
          });

        await axios.post(
          `${API_URL}/api/my-files/files`,
          {
            title: title.trim(),
            description: description.trim(),
            filename: titleWithExtension,
            url: uploaded.url,
            publicId: uploaded.publicId,
            resourceType: uploaded.resourceType,
            kind,
            passwordProtected,
          }
        );

        toast.success('File uploaded');
      }

      await onSaved();
      onClose();
    } catch (error) {
      console.error('Failed to save file:', error);

      toast.error(
        error.response?.data?.message ||
          (isEditing
            ? 'Could not update file'
            : 'Could not upload file')
      );
    } finally {
      setSaving(false);
      setUploadPercent(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={save}
        className="w-full max-w-md rounded-lg bg-white p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit' : 'Add'}{' '}
            {kind === 'dump' ? 'Dump' : 'Asset'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="disabled:opacity-50"
          >
            <X />
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          Title *

          <input
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            required
            disabled={saving}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
          />
        </label>

        {!isEditing && (
          <label className="mt-4 block text-sm font-medium text-gray-700">
            Upload File *

            <input
              type="file"
              onChange={(event) => {
                const nextFile = event.target.files?.[0] || null;

                if (!nextFile) {
                  setSelected(null);
                  return;
                }

                const fileSizeError = validateFileSize(nextFile);

                if (fileSizeError) {
                  toast.error(fileSizeError);
                  event.target.value = '';
                  setSelected(null);
                  return;
                }

                setSelected(nextFile);
              }}
              required
              disabled={saving}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
            />
          </label>
        )}

        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-gray-700">
          <input
            type="checkbox"
            checked={passwordProtected}
            disabled={saving}
            onChange={(event) =>
              setPasswordProtected(
                event.target.checked
              )
            }
            className="rounded border-gray-300 text-indigo-600"
          />

          Password protect this file

          <Lock className="h-4 w-4 text-red-600" />
        </label>

        <label className="mt-4 block text-sm font-medium text-gray-700">
          Description

          <textarea
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            rows="1"
            disabled={saving}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm disabled:bg-gray-100"
          />
        </label>

        <button
          type="submit"
          disabled={saving}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          <Upload
            className={`h-4 w-4 ${
              saving ? 'animate-spin' : ''
            }`}
          />

          {saving
            ? isEditing
              ? 'Updating...'
              : `Uploading... ${uploadPercent}%`
            : isEditing
              ? 'Update'
              : 'Upload'}
        </button>
      </form>
    </div>
  );
}
