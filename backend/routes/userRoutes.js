const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');
const paymentController = require('../controllers/paymentController');


// Rutas públicas
router.post('/register', userController.register);
router.post('/login', userController.login);

// Rutas protegidas (requieren token JWT)
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.get('/balance', auth, paymentController.getBalance);
router.post('/recharge', auth, userController.rechargeBalance);



module.exports = router;
