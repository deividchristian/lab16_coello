const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  createTask,
  getTasksByProject,
  updateTaskStatus,
  deleteTask,
} = require('../controllers/taskController');

const router = express.Router();

router.post('/', authMiddleware, createTask);
router.get('/project/:projectId', authMiddleware, getTasksByProject);
router.patch('/:id/status', authMiddleware, updateTaskStatus);
router.delete('/:id', authMiddleware, deleteTask);

module.exports = router;
