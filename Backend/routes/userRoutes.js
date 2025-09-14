const express = require('express');
const router = express.Router();
const { registerUser, loginUser, changePassword } = require('../controllers/userController');
const { validateRegister, validateLogin, validateChangePassword } = require('../validator');
const validate = require('../middlewares/validate');

router.post('/register', validateRegister, validate, registerUser);
router.post('/login', validateLogin, validate, loginUser);
router.post('/change-password', validateChangePassword, validate, changePassword);

module.exports = router;
