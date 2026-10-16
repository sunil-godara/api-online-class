const Router = require('koa-router');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireUser } = require('../middlewares/roleMiddleware');
const {
  createJournalEntry,
  listJournalEntries,
  getJournalEntry,
  editJournalEntry,
  deleteJournalEntry
} = require('../controllers/journalController');

const router = new Router();

// User routes (require authentication and user role)
router.post('/journal/create', verifyToken, requireUser, createJournalEntry);
router.get('/journal/list', verifyToken, requireUser, listJournalEntries);
router.post('/journal/detail', verifyToken, requireUser, getJournalEntry);
router.post('/journal/edit', verifyToken, requireUser, editJournalEntry);
router.post('/journal/delete', verifyToken, requireUser, deleteJournalEntry);

module.exports = router;
