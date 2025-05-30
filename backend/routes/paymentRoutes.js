const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middlewares/auth');

// Rutas protegidas (operaciones de pago)
router.post('/request', auth, paymentController.requestPayment);
router.post('/send', auth, paymentController.sendPayment);
router.get('/history', auth, paymentController.getTransactions);
router.get('/requests', auth, paymentController.getPaymentRequests);
router.put('/requests/:requestId/accept', auth, paymentController.acceptPaymentRequest);
router.put('/requests/:requestId/reject', auth, paymentController.rejectPaymentRequest);
router.get('/requests/history', auth, paymentController.getAllPaymentRequests);


module.exports = router;

