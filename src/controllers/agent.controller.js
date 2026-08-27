const prisma = require('../utils/prisma');

exports.getDashboard = async (req, res, next) => {
    try {
        const agentId = req.user.id;

        const totalListings = await prisma.property.count({
            where: { agentId }
        });

        const totalLeads = await prisma.inquiry.count({
            where: { agentId }
        });

        const newLeads = await prisma.inquiry.count({
            where: { agentId, status: 'NEW' }
        });

        const activeListings = await prisma.property.count({
            where: { agentId, status: 'AVAILABLE' }
        });

        res.json({
            success: true,
            data: {
                totalListings,
                totalLeads,
                newLeads,
                activeListings
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyListings = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const agentId = req.user.id;

        const listings = await prisma.property.findMany({
            where: { agentId },
            skip,
            take: limit,
            include: {
                _count: {
                    select: { inquiries: true, favorites: true }
                }
            }
        });

        const total = await prisma.property.count({ where: { agentId } });
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: listings,
            pagination: { page, limit, total, pages }
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyLeads = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const agentId = req.user.id;

        const leads = await prisma.inquiry.findMany({
            where: { agentId },
            skip,
            take: limit,
            include: {
                client: {
                    select: { id: true, firstName: true, lastName: true, email: true, phone: true }
                },
                property: {
                    select: { id: true, title: true, address: true, city: true }
                }
            }
        });

        const total = await prisma.inquiry.count({ where: { agentId } });
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: leads,
            pagination: { page, limit, total, pages }
        });
    } catch (error) {
        next(error);
    }
};
