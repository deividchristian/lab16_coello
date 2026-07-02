const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

const createTask = async (req, res) => {
  try {
    const { title, description, status, project, assignedTo } = req.body;

    if (!title || !description || !project || !assignedTo) {
      return res.status(400).json({
        message: 'Título, descripción, proyecto y usuario asignado son obligatorios.',
      });
    }

    const existingProject = await Project.findById(project);
    if (!existingProject) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    const existingUser = await User.findById(assignedTo);
    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario asignado no encontrado.' });
    }

    const task = await Task.create({
      title,
      description,
      status,
      project,
      assignedTo,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('project', 'title status')
      .populate('assignedTo', 'name email role');

    res.status(201).json({
      message: 'Tarea creada correctamente.',
      task: populatedTask,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la tarea.', error: error.message });
  }
};

const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    const tasks = await Task.find({ project: projectId })
      .populate('assignedTo', 'name email role')
      .populate('project', 'title status');

    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las tareas.', error: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'El estado es obligatorio.' });
    }

    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    task.status = status;
    await task.save();

    const updatedTask = await Task.findById(task._id)
      .populate('project', 'title status')
      .populate('assignedTo', 'name email role');

    res.json({
      message: 'Estado de la tarea actualizado correctamente.',
      task: updatedTask,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar la tarea.', error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Tarea no encontrada.' });
    }

    res.json({ message: 'Tarea eliminada correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la tarea.', error: error.message });
  }
};

module.exports = {
  createTask,
  getTasksByProject,
  updateTaskStatus,
  deleteTask,
};
