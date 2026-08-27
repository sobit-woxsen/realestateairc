const prisma = require('../utils/prisma');

const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
        }
      }),
      prisma.user.count()
    ]);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, phone, role } = req.body;

    const userExists = await prisma.user.findUnique({ where: { id } });
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { firstName, lastName, phone, role },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
      }
    });

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userExists = await prisma.user.findUnique({ where: { id } });
    if (!userExists) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await prisma.user.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getUserById, updateUser, deleteUser };
