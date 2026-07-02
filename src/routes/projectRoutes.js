const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const roleMiddleware = require('../middlewares/roleMiddleware');
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

const router = express.Router();

router.post(
  '/',
  authMiddleware,
  roleMiddleware(['Administrador', 'Líder']),
  createProject
);
router.get('/', authMiddleware, getProjects);
router.get('/:id', authMiddleware, getProjectById);
router.put('/:id', authMiddleware, updateProject);
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['Administrador', 'Líder']),
  deleteProject
);

module.exports = router;
