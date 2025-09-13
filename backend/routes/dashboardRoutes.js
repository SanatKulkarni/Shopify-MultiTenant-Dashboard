import express from 'express';
import { 
  getDashboardMetrics, 
  getOrdersByDate, 
  getTopCustomers, 
  getAnalyticsData 
} from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/metrics', getDashboardMetrics);
router.get('/orders-by-date', getOrdersByDate);
router.get('/top-customers', getTopCustomers);
router.get('/analytics', getAnalyticsData);

export default router;