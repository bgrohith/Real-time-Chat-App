const express = require('express');
const router = express.Router();
const { getUsers, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getUsers);
router.put('/profile', updateProfile);

module.exports = router;
