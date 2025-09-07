// routes/moments.js
import express from 'express';
import { auth, checkRole } from '../middleware/auth.js';
import { momentController } from '../controllers/momentController.js';
import multer from 'multer';

// Configure multer for file uploads (memory storage for streaming to Google Drive)
const upload = multer({ storage: multer.memoryStorage() });

const router = express.Router();

router.get('/', momentController.getAllMoments);

router.post('/youtube', 
  auth, 
  checkRole(['developer', 'admin', 'financier']), 
  momentController.addYouTubeMoment
);

router.post('/drive', 
  auth, 
  checkRole(['developer', 'admin', 'financier']), 
  momentController.addDriveMoment
);

router.post('/upload',
  auth,
  checkRole(['developer', 'admin', 'financier']),
  upload.array('files', 20), // Support multiple files
  momentController.uploadMediaMoment
);

router.put('/order', 
  auth, 
  checkRole(['developer', 'admin', 'financier']), 
  momentController.updateMomentOrder
);

router.put('/:momentId/media-order', 
  auth, 
  checkRole(['developer', 'admin', 'financier']), 
  momentController.updateMediaOrder
);

router.post('/:momentId/media',
  auth,
  checkRole(['developer', 'admin', 'financier']),
  upload.array('files', 20),
  momentController.addMediaToMoment
);
router.delete('/:id', 
  auth, 
  checkRole(['developer', 'admin', 'financier']), 
  momentController.deleteMoment
);

router.delete('/:momentId/media/:mediaId', 
  auth, 
  checkRole(['developer', 'admin', 'financier']), 
  momentController.deleteMediaFile
);


router.patch('/:id/title', 
  auth, 
  checkRole(['developer', 'admin', 'financier']), 
  momentController.updateTitle
);

export default router;
