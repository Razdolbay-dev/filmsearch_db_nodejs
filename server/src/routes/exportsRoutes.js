import tmdbExportLinks from '../controllers/exportsController.js'
import { Router } from 'express';

const router = Router();
router.get('/all', tmdbExportLinks.getAllURLs);
router.get('/movies', tmdbExportLinks.getURLMoviesFile);
router.get('/tvSeries', tmdbExportLinks.getURLTvSeriesFile);
router.get('/collections', tmdbExportLinks.getURLCollectionsFile);


export default router;