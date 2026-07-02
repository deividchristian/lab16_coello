const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
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
      enum: ['Pendiente', 'En progreso', 'Completada'],
      default: 'Pendiente',
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'El proyecto es obligatorio'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario asignado es obligatorio'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
