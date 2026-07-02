const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El nombre de la tarea es obligatorio'],
      trim: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario asignado es obligatorio'],
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pendiente', 'En progreso', 'Completado'],
      default: 'Pendiente',
    },
    dueDate: {
      type: Date,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El líder del proyecto es obligatorio'],
    },
    leaderEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    tasks: {
      type: [taskSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
