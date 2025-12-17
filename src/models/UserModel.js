import { prisma } from '../utils/db.js';

export class UserModel {
    static async findByEmail(email) {
        return prisma.user.findUnique({ where: { email } });
    }

    static async findById(id) {
        return prisma.user.findUnique({ where: { id } });
    }

    static async update(id, updates) {
        return prisma.user.update({ where: { id }, data: updates });
    }

    static async findByPhone(phoneNumber) {
        return prisma.user.findUnique({ where: { phoneNumber } });
    }

    static async findMany() {
        return prisma.user.findMany({ select: { id: true, username: true, email: true, fullName: true, userRole: true, status: true } });
    }

    static async create(data) {
        return prisma.user.create({ data });
    }

    static async findMany(requesterRole, requesterOrgId = null) {
        const where = requesterRole === 'SUPER_ADMIN'
            ? {}
            : { orgId: requesterOrgId };
        return prisma.user.findMany({
            where,
            select: { id: true, username: true, email: true, fullName: true, userRole: true, status: true, orgId: true }
        });
    }

    static async findByOrgId(orgId) {
        return prisma.user.findMany({ where: { orgId } });
    }

    static async bulkCreate(csvData) {
        return prisma.user.createMany({ data: csvData, skipDuplicates: true });
    }
}