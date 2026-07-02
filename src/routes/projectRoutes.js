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

// Crear proyecto: solo Administrador y Líder
router.post(
  '/',
  authMiddleware,
  roleMiddleware(['Administrador', 'Líder']),
  createProject
);

// Consultas: todos los roles autenticados (incluye arreglo completo de tasks)
router.get('/', authMiddleware, getProjects);
router.get('/:id', authMiddleware, getProjectById);

// Actualizar: Colaborador solo modifica estado de tareas; Admin/Líder control total
router.put('/:id', authMiddleware, updateProject);

// Eliminar proyecto: solo Administrador y Líder
router.delete(
  '/:id',
  authMiddleware,
  roleMiddleware(['Administrador', 'Líder']),
  deleteProject
);

module.exports = router;
