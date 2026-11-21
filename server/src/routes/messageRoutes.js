const express = require('express');
const router = express.Router();
const { getMessages, sendMessage } = require('../controllers/messageController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/:conversationId', getMessages);
router.post('/', upload.single('imageFile'), sendMessage);

module.exports = router;
