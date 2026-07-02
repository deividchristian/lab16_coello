const mongoose = require('mongoose');

const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'El título de la subtarea es obligatorio'],
      trim: true,
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
    subtasks: {
      type: [subtaskSchema],
      default: [],
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El líder del proyecto es obligatorio'],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
