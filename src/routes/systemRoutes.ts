import { Router } from 'express';
import { getContainers, streamContainerStats, streamContainerLogs, streamHostStats } from '../controllers/systemController';

const router = Router();

// Endpoint for host overall stats
router.get('/host-stats', streamHostStats);

// Endpoint for listing containers
router.get('/containers', getContainers);

// Endpoints for Server-Sent Events (SSE)
router.get('/containers/:id/stats', streamContainerStats);
router.get('/containers/:id/logs', streamContainerLogs);

export default router;
