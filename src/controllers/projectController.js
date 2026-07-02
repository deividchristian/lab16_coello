const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');

const populateProject = (query) =>
  query
    .populate('leader', 'name email role')
    .populate('tasks.assignedTo', 'name email role');

const findValidUser = async (userId) => {
  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }
  return User.findById(userId).select('_id email role');
};

const userHasProjectAccess = (project, userId) => {
  const uid = userId.toString();
  const leaderId = project.leader?._id?.toString() || project.leader?.toString();

  if (leaderId === uid) return true;

  return project.tasks.some((task) => {
    const assignedId = task.assignedTo?._id?.toString() || task.assignedTo?.toString();
    return assignedId === uid;
  });
};

const validateAndNormalizeTasks = async (tasks = []) => {
  const normalized = [];

  for (const task of tasks) {
    if (!task.title || !task.assignedTo) {
      throw new Error('Cada tarea debe incluir título y usuario asignado válido.');
    }

    const assignedUser = await findValidUser(task.assignedTo);
    if (!assignedUser) {
      throw new Error(`El usuario asignado a la tarea "${task.title}" no existe en la base de datos.`);
    }

    normalized.push({
      title: task.title,
      assignedTo: assignedUser._id,
      completed: task.completed ?? false,
    });
  }

  return normalized;
};

const mergeTasks = async (project, incomingTasks) => {
  for (const incoming of incomingTasks) {
    if (incoming._id) {
      const existing = project.tasks.id(incoming._id);

      if (existing) {
        if (incoming.title !== undefined) existing.title = incoming.title;
        if (incoming.completed !== undefined) existing.completed = incoming.completed;

        if (incoming.assignedTo !== undefined) {
          const assignedUser = await findValidUser(incoming.assignedTo);
          if (!assignedUser) {
            throw new Error('El usuario asignado a la tarea no existe en la base de datos.');
          }
          existing.assignedTo = assignedUser._id;
        }
        continue;
      }
    }

    if (incoming.title && incoming.assignedTo) {
      const assignedUser = await findValidUser(incoming.assignedTo);
      if (!assignedUser) {
        throw new Error(`El usuario asignado a la tarea "${incoming.title}" no existe en la base de datos.`);
      }

      project.tasks.push({
        title: incoming.title,
        assignedTo: assignedUser._id,
        completed: incoming.completed ?? false,
      });
    }
  }
};

const mergeTasksColaborador = (project, incomingTasks) => {
  incomingTasks.forEach((incoming) => {
    if (!incoming._id || incoming.completed === undefined) return;

    const existing = project.tasks.id(incoming._id);
    if (existing) {
      existing.completed = incoming.completed;
    }
  });
};

const resolveLeaderData = async (req, leaderId) => {
  const projectLeaderId =
    req.user.role === 'Administrador' && leaderId ? leaderId : req.user.id;

  const leaderUser = await findValidUser(projectLeaderId);
  if (!leaderUser) {
    throw new Error('El líder asignado no existe en la base de datos.');
  }

  return {
    leaderId: leaderUser._id,
    leaderEmail: leaderUser.email,
  };
};

const createProject = async (req, res) => {
  try {
    const { title, description, status, leader, dueDate, tasks } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Título y descripción son obligatorios.' });
    }

    const { leaderId, leaderEmail } = await resolveLeaderData(req, leader);
    const validatedTasks = Array.isArray(tasks) ? await validateAndNormalizeTasks(tasks) : [];

    const project = await Project.create({
      title,
      description,
      status,
      dueDate: dueDate || undefined,
      leader: leaderId,
      leaderEmail,
      tasks: validatedTasks,
    });

    const populatedProject = await populateProject(Project.findById(project._id));

    res.status(201).json({
      message: 'Proyecto creado correctamente.',
      project: populatedProject,
    });
  } catch (error) {
    const status = error.message.includes('no existe') ? 400 : 500;
    res.status(status).json({ message: error.message || 'Error al crear el proyecto.' });
  }
};

const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    let filter = {};

    if (req.user.role === 'Colaborador') {
      filter = {
        $or: [{ leader: userId }, { 'tasks.assignedTo': userId }],
      };
    }

    const projects = await populateProject(Project.find(filter));

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los proyectos.', error: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await populateProject(Project.findById(req.params.id));

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    if (req.user.role === 'Colaborador' && !userHasProjectAccess(project, req.user.id)) {
      return res.status(403).json({ message: 'No tienes permisos para ver este proyecto.' });
    }

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el proyecto.', error: error.message });
  }
};

const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado.' });
    }

    const { title, description, status, leader, dueDate, tasks, replaceTasks } = req.body;

    if (req.user.role === 'Colaborador') {
      if (!userHasProjectAccess(await populateProject(Project.findById(project._id)), req.user.id)) {
        return res.status(403).json({ message: 'No tienes permisos para modificar este proyecto.' });
      }

      if (!tasks || !Array.isArray(tasks)) {
        return res.status(403).json({
          message: 'Los colaboradores solo pueden actualizar el estado de completado de las tareas.',
        });
      }

      mergeTasksColaborador(project, tasks);
      await project.save();

      const updatedProject = await populateProject(Project.findById(project._id));

      return res.json({
        message: 'Estado de tarea actualizado correctamente.',
        project: updatedProject,
      });
    }

    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (dueDate !== undefined) project.dueDate = dueDate || null;

    if (leader && req.user.role === 'Administrador') {
      const leaderUser = await findValidUser(leader);
      if (!leaderUser) {
        return res.status(400).json({ message: 'El líder asignado no existe en la base de datos.' });
      }
      project.leader = leaderUser._id;
      project.leaderEmail = leaderUser.email;
    }

    if (tasks !== undefined && Array.isArray(tasks)) {
      if (replaceTasks) {
        project.tasks = await validateAndNormalizeTasks(tasks);
      } else {
        await mergeTasks(project, tasks);
      }
    }

    await project.save();

    const updatedProject = await populateProject(Project.findById(project._id));

    res.json({
      message: 'Proyecto actualizado correctamente.',
      project: updatedProject,
    });
  } catch (error) {
    const status = error.message.includes('no existe') ? 400 : 500;
    res.status(status).json({ message: error.message || 'Error al actualizar el proyecto.' });
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
