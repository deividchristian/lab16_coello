const User = require('../models/User');

const getUsers = async (req, res) => {
  try {
    const users = await User.find().select('_id email role').sort({ name: 1 });

    res.json({
      users: users.map((user) => ({
        id: user._id,
        email: user.email,
        role: user.role,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener usuarios.', error: error.message });
  }
};

module.exports = { getUsers };
