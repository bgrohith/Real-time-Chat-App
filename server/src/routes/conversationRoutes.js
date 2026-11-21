const express = require('express');
const router = express.Router();
const {
  getConversations,
  getOrCreateDirectConversation,
  createGroupConversation,
  addGroupMember,
  markAsRead
} = require('../controllers/conversationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', getConversations);
router.post('/direct', getOrCreateDirectConversation);
router.post('/group', createGroupConversation);
router.post('/:id/members', addGroupMember);
router.put('/:id/read', markAsRead);

module.exports = router;
