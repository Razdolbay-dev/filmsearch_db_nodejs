import {MovieImportController} from '../controllers/movieImportController.js';
import {SeriesImportController} from '../controllers/seriesImportController.js';

const actionMovie = new MovieImportController();
const actionSeries = new SeriesImportController();

import express, { Router } from 'express';
const router = express.Router();

router.post('/movie/:id', actionMovie.postMovieInfo);
// router.get('/movie/:id', actionMovie.getMovieInfo);
router.post('/series/:id', actionSeries.postSeriesInfo);
export default router;