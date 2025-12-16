import { prisma } from '../utils/db.js';

export class CourseModel {
    static async findMany() {
        return prisma.course.findMany({ include: { scormPackage: true } });
    }

    static async create(data) {
        return prisma.course.create({ data });
    }

    static async findById(id, includeAssignments = false) {
        const include = includeAssignments ? { assignments: true } : { scormPackage: true };
        return prisma.course.findUnique({ where: { id }, include });
    }
}