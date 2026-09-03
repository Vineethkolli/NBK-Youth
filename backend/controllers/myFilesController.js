import bcrypt from 'bcrypt';
import FileAsset from '../models/FileAsset.js';
import Note from '../models/Note.js';
import cloudinary from '../config/cloudinary.js';
import { logActivity } from '../middleware/activityLogger.js';

const getPin = async (req) => {
  const { default: UniversalPin } = await import('../models/UniversalPin.js');
  const setting = await UniversalPin.findOne({ key: 'default' });
  return setting && await bcrypt.compare(String(req.headers['x-universal-pin'] || ''), setting.pinHash);
};

const pinError = (req) => ({
  status: 403,
  message: req.headers['x-universal-pin'] ? 'Wrong PIN' : 'PIN required',
  pinRequired: true,
});

const fileFields = 'title description filename resourceType kind passwordProtected createdBy createdAt updatedAt';

const getFileExtension = (filename = '') => filename.match(/\.[^.]+$/)?.[0] || '';

export const myFilesController = {
  listFiles: async (req, res) => {
    const kind = req.query.kind === 'dump' ? 'dump' : 'asset';
    const files = await FileAsset.find({ kind }).select(fileFields).sort('-createdAt').lean();
    res.json(files);
  },

  createFile: async (req, res) => {
    const { title, description, filename, url, publicId, resourceType, kind, passwordProtected } = req.body || {};
    if (!title?.trim() || !filename?.trim() || !url || !publicId || !['asset', 'dump'].includes(kind)) {
      return res.status(400).json({ message: 'Title, file, and valid file details are required' });
    }
    const file = await FileAsset.create({
      title: title.trim(), description: description?.trim() || '',
      filename: `${title.trim()}${getFileExtension(filename)}`,
      url, publicId, resourceType: resourceType || 'auto', kind,
      passwordProtected: Boolean(passwordProtected), createdBy: req.user.registerId
    });
    await logActivity(req, 'CREATE', 'FileAsset', file._id.toString(), { before: null, after: file.toObject() }, `File "${file.filename}" uploaded`);
    res.status(201).json(file);
  },

  updateFile: async (req, res) => {
    const existing = await FileAsset.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'File not found' });
    if (existing.passwordProtected && !(await getPin(req))) {
      const error = pinError(req);
      return res.status(error.status).json(error);
    }
    const file = await FileAsset.findByIdAndUpdate(
      req.params.id,
      { $set: {
        title: req.body.title?.trim(),
        description: req.body.description?.trim() || '',
        filename: `${req.body.title?.trim()}${getFileExtension(existing.filename)}`,
        passwordProtected: Boolean(req.body.passwordProtected),
      } },
      { new: true, runValidators: true }
    );
    if (!file) return res.status(404).json({ message: 'File not found' });
    await logActivity(req, 'UPDATE', 'FileAsset', file._id.toString(), { before: null, after: file.toObject() }, `File "${file.filename}" updated`);
    res.json(file);
  },

  deleteFile: async (req, res) => {
    const existing = await FileAsset.findById(req.params.id).select('passwordProtected');
    if (!existing) return res.status(404).json({ message: 'File not found' });
    if (existing.passwordProtected && !(await getPin(req))) {
      const error = pinError(req);
      return res.status(error.status).json(error);
    }
    const file = await FileAsset.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    try {
      await cloudinary.uploader.destroy(file.publicId, { resource_type: file.resourceType === 'auto' ? 'raw' : file.resourceType });
    } catch (error) {
      console.warn('Cloudinary file deletion failed:', error.message);
    }
    await logActivity(req, 'DELETE', 'FileAsset', file._id.toString(), { before: file.toObject(), after: null }, `File "${file.filename}" deleted`);
    res.json({ message: 'File deleted' });
  },

  getFile: async (req, res) => {
    const file = await FileAsset.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.passwordProtected && !(await getPin(req))) {
      const error = pinError(req);
      return res.status(error.status).json(error);
    }
    res.json(file);
  },

  downloadFile: async (req, res) => {
    const file = await FileAsset.findById(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    if (file.passwordProtected && !(await getPin(req))) {
      const error = pinError(req);
      return res.status(error.status).json(error);
    }
    const response = await (await import('axios')).default.get(file.url, { responseType: 'stream' });
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    if (response.headers['content-type']) res.setHeader('Content-Type', response.headers['content-type']);
    response.data.pipe(res);
  },

  listNotes: async (req, res) => {
    const notes = await Note.find().select('title passwordProtected createdAt updatedAt').sort('-updatedAt').lean();
    res.json(notes);
  },

  getNote: async (req, res) => {
    const note = await Note.findById(req.params.id).select('+content');
    if (!note) return res.status(404).json({ message: 'Note not found' });
    if (note.passwordProtected && !(await getPin(req))) {
      const error = pinError(req);
      return res.status(error.status).json(error);
    }
    await logActivity(req, 'VERIFY', 'Note', note._id.toString(), { before: null, after: { title: note.title } }, `Note "${note.title}" opened`);
    res.json(note);
  },

  createNote: async (req, res) => {
    const { title, content, passwordProtected } = req.body || {};
    if (!title?.trim()) return res.status(400).json({ message: 'Title is required' });
    const note = await Note.create({ title: title.trim(), content: content || '', passwordProtected: Boolean(passwordProtected), createdBy: req.user.registerId });
    await logActivity(req, 'CREATE', 'Note', note._id.toString(), { before: null, after: { ...note.toObject(), content: undefined } }, `Note "${note.title}" created`);
    res.status(201).json(note);
  },

  updateNote: async (req, res) => {
    const { title, content, passwordProtected } = req.body || {};
    const existing = await Note.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Note not found' });
    if (existing.passwordProtected && !(await getPin(req))) { const error = pinError(req); return res.status(error.status).json(error); }
    const note = await Note.findByIdAndUpdate(req.params.id, {
      $set: { title: title?.trim(), content: content || '', passwordProtected: Boolean(passwordProtected) }
    }, { new: true, runValidators: true });
    if (!note) return res.status(404).json({ message: 'Note not found' });
    await logActivity(req, 'UPDATE', 'Note', note._id.toString(), { before: { title: existing.title, passwordProtected: existing.passwordProtected }, after: { title: note.title, passwordProtected: note.passwordProtected } }, `Note "${note.title}" updated`);
    res.json(note);
  },

  deleteNote: async (req, res) => {
    const existing = await Note.findById(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Note not found' });
    if (existing.passwordProtected && !(await getPin(req))) { const error = pinError(req); return res.status(error.status).json(error); }
    const note = await Note.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    await logActivity(req, 'DELETE', 'Note', note._id.toString(), { before: { title: note.title, passwordProtected: note.passwordProtected }, after: null }, `Note "${note.title}" deleted`);
    res.json({ message: 'Note deleted' });
  },

};
