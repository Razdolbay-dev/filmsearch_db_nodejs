import { Router } from 'express';
import * as searchController from '../controllers/searchController.js';

const router = Router();

router.get('/', searchController.searchContent);
router.get('/advanced', searchController.advancedSearch);
router.get('/suggestions', searchController.searchSuggestions);
router.get('/:type/:id', searchController.getContentDetails);

export default router;