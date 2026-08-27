const prisma = require('../utils/prisma');

const getAllProperties = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const { city, state, type, status, minPrice, maxPrice, bedrooms, bathrooms, search } = req.query;

    const where = {};

    if (city) where.city = city;
    if (state) where.state = state;
    if (type) where.type = type;
    if (status) where.status = status;
    if (bedrooms) where.bedrooms = { gte: parseInt(bedrooms, 10) };
    if (bathrooms) where.bathrooms = { gte: parseFloat(bathrooms) };

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (search) {
      where.title = {
        contains: search,
        mode: 'insensitive'
      };
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        include: {
          agent: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        }
      }),
      prisma.property.count({ where })
    ]);

    res.status(200).json({
      success: true,
      data: properties,
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

const getPropertyById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        agent: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

const createProperty = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const data = { ...req.body, agentId };

    const property = await prisma.property.create({
      data
    });

    res.status(201).json({
      success: true,
      data: property
    });
  } catch (error) {
    next(error);
  }
};

const updateProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const property = await prisma.property.findUnique({ where: { id } });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.agentId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this property' });
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: req.body
    });

    res.status(200).json({
      success: true,
      data: updatedProperty
    });
  } catch (error) {
    next(error);
  }
};

const deleteProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const property = await prisma.property.findUnique({ where: { id } });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.agentId !== userId && userRole !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this property' });
    }

    await prisma.property.delete({ where: { id } });

    res.status(200).json({
      success: true,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllProperties, getPropertyById, createProperty, updateProperty, deleteProperty };
