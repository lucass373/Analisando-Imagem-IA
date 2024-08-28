import express from 'express';
import { uploadMeasure, confirmMeasure, listMeasures } from '../controllers/measureController';

const router = express.Router();

router.post('/upload', uploadMeasure);

// Outras rotas
router.post('/confirm', confirmMeasure);
router.get('/measures/:customer_code', listMeasures);

export default router;
