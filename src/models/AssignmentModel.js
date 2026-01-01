import { prisma } from '../utils/db.js';

export class AssignmentModel {
    static async createMany(data) {  // FIXED: Loop with create for include
        const assignments = [];
        for (const assignmentData of data) {
            const assignment = await prisma.assignment.create({
                data: assignmentData,
                include: {
                    course: true,
                    assigner: true,
                    assigneeUser: true
                }
            });
            assignments.push(assignment);
        }
        return assignments;
    }

    static async findByCourseId(courseId) {
        return prisma.assignment.findMany({
            where: { courseId },
            include: {
                assigneeUser: { select: { id: true, fullName: true, email: true } },
                course: true,
                assigner: { select: { id: true, fullName: true } }
            }
        });
    }

    static async findByLearnerId(learnerId) {
        return prisma.assignment.findMany({
            where: { assigneeUserId: learnerId },
            include: { course: true, assigner: { select: { fullName: true } } }
        });
    }
}