import { Router } from 'express';
import { faceController } from './controller/face.controller';

const router = Router();

// Face recognition routes
router.post('/face/embed', faceController.embedFace);
router.post('/face/search', faceController.searchFace);
router.get('/face/:id', faceController.getFaceById);
router.delete('/face/:id', faceController.deleteFace);

export default router;
