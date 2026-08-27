const prisma = require('../utils/prisma');

exports.getFavorites = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const userId = req.user.id;

        const favorites = await prisma.favorite.findMany({
            where: { userId },
            skip,
            take: limit,
            include: {
                property: {
                    include: {
                        agent: {
                            select: { id: true, firstName: true, lastName: true }
                        }
                    }
                }
            }
        });

        const total = await prisma.favorite.count({ where: { userId } });
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: favorites,
            pagination: { page, limit, total, pages }
        });
    } catch (error) {
        next(error);
    }
};

exports.addFavorite = async (req, res, next) => {
    try {
        const { propertyId } = req.body;
        const userId = req.user.id;

        const existing = await prisma.favorite.findUnique({
            where: {
                userId_propertyId: {
                    userId,
                    propertyId
                }
            }
        });

        if (existing) {
            return res.status(409).json({ success: false, message: 'Already in favorites' });
        }

        const favorite = await prisma.favorite.create({
            data: {
                userId,
                propertyId
            }
        });

        res.status(201).json({ success: true, data: favorite });
    } catch (error) {
        next(error);
    }
};

exports.removeFavorite = async (req, res, next) => {
    try {
        const { propertyId } = req.params;
        const userId = req.user.id;

        const existing = await prisma.favorite.findUnique({
            where: {
                userId_propertyId: {
                    userId,
                    propertyId
                }
            }
        });

        if (!existing) {
            return res.status(404).json({ success: false, message: 'Favorite not found' });
        }

        await prisma.favorite.delete({
            where: {
                userId_propertyId: {
                    userId,
                    propertyId
                }
            }
        });

        res.json({ success: true, data: null });
    } catch (error) {
        next(error);
    }
};
