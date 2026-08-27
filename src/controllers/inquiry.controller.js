const prisma = require('../utils/prisma');

exports.createInquiry = async (req, res, next) => {
    try {
        const { propertyId, message } = req.body;
        const clientId = req.user.id;

        const property = await prisma.property.findUnique({
            where: { id: propertyId }
        });

        if (!property) {
            return res.status(404).json({ success: false, message: 'Property not found' });
        }

        const inquiry = await prisma.inquiry.create({
            data: {
                message,
                status: 'NEW',
                clientId,
                propertyId,
                agentId: property.agentId || null
            }
        });

        res.status(201).json({ success: true, data: inquiry });
    } catch (error) {
        next(error);
    }
};

exports.getAllInquiries = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        const where = {};
        if (status) {
            where.status = status;
        }

        const inquiries = await prisma.inquiry.findMany({
            where,
            skip,
            take: limit,
            include: {
                client: { select: { id: true, firstName: true, lastName: true, email: true } },
                property: { select: { id: true, title: true, address: true, city: true } },
                agent: { select: { id: true, firstName: true, lastName: true, email: true } }
            }
        });

        const total = await prisma.inquiry.count({ where });
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: inquiries,
            pagination: { page, limit, total, pages }
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyInquiries = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const clientId = req.user.id;

        const inquiries = await prisma.inquiry.findMany({
            where: { clientId },
            skip,
            take: limit,
            include: {
                property: true,
                agent: true
            }
        });

        const total = await prisma.inquiry.count({ where: { clientId } });
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: inquiries,
            pagination: { page, limit, total, pages }
        });
    } catch (error) {
        next(error);
    }
};

exports.getInquiryById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const inquiry = await prisma.inquiry.findUnique({
            where: { id },
            include: {
                client: true,
                property: true,
                agent: true
            }
        });

        if (!inquiry) {
            return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }

        const userId = req.user.id;
        const role = req.user.role;

        if (role === 'CLIENT' && inquiry.clientId !== userId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }
        if (role === 'AGENT' && inquiry.agentId !== userId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        res.json({ success: true, data: inquiry });
    } catch (error) {
        next(error);
    }
};

exports.assignInquiry = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { agentId } = req.body;

        const targetUser = await prisma.user.findUnique({
            where: { id: agentId }
        });

        if (!targetUser || targetUser.role !== 'AGENT') {
            return res.status(400).json({ success: false, message: 'User is not an agent' });
        }

        const inquiry = await prisma.inquiry.findUnique({ where: { id } });
        if (!inquiry) {
            return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }

        const updatedInquiry = await prisma.inquiry.update({
            where: { id },
            data: { agentId }
        });

        res.json({ success: true, data: updatedInquiry });
    } catch (error) {
        next(error);
    }
};

exports.updateInquiryStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        
        const inquiry = await prisma.inquiry.findUnique({ where: { id } });
        if (!inquiry) {
            return res.status(404).json({ success: false, message: 'Inquiry not found' });
        }

        const userId = req.user.id;
        const role = req.user.role;

        if (role === 'AGENT' && inquiry.agentId !== userId) {
            return res.status(403).json({ success: false, message: 'Forbidden' });
        }

        const updatedInquiry = await prisma.inquiry.update({
            where: { id },
            data: { status }
        });

        res.json({ success: true, data: updatedInquiry });
    } catch (error) {
        next(error);
    }
};
