import { prisma } from '../utils/db.js';

export class LearningPathModel {
    static async create(data) {
        return prisma.learningPath.create({
            data,
            include: { creator: true }
        });
    }

    static async findMany(where = {}) {
        console.log('[LEARNING PATH MODEL] findMany where:', where);
        const paths = await prisma.learningPath.findMany({
            where,
            include: { creator: true },
            orderBy: { createdAt: 'desc' }
        });
        console.log('[LEARNING PATH MODEL] Returned', paths.length, 'paths');
        return paths;
    }

    static async findById(id) {
        return prisma.learningPath.findUnique({
            where: { id },
            include: { creator: true, enrolments: { include: { user: true } } }
        });
    }

    static async update(id, data) {
        return prisma.learningPath.update({
            where: { id },
            data,
            include: { creator: true }
        });
    }

    static async enrolUser(learningPathId, userId) {
        return prisma.learningPathEnrolment.create({
            data: { learningPathId, userId },
            include: { learningPath: true, user: true }
        });
    }


}