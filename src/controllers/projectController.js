const Project = require('../models/Project');

const createProject = async (req, res) => {
  try {
    const { title, description, status, leader } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Título y descripción son obligatorios.' });
    }

    const projectLeader =
      req.user.role === 'Administrador' && leader ? leader : req.user.id;

    const project = await Project.create({
      title,
      description,
      status,
      leader: projectLeader,
    });

    const populatedProject = await Project.findById(project._id).populate('leader', 'name email role');

    res.status(201).json({
      message: 'Proyecto creado correctamente.',
      project: populatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el proyecto.', error: error.message });
  }
};

const getProjects = async (req, res) => {
  try {
    const projects = await Project.find().populate('leader', 'name email role');

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los proyectos.', error: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('leader', 'name email role');

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el proyecto.', error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const { title, description, status, leader } = req.body;

    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    if (title) project.title = title;
    if (description) project.description = description;
    if (status) project.status = status;
    if (leader && req.user.role === 'Administrador') project.leader = leader;

    await project.save();

    const updatedProject = await Project.findById(project._id).populate('leader', 'name email role');

    res.json({
      message: 'Proyecto actualizado correctamente.',
      project: updatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el proyecto.', error: error.message });
  }
};

const deleteProject = async (req, res) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    res.json({ message: 'Proyecto eliminado correctamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el proyecto.', error: error.message });
  }
};

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
