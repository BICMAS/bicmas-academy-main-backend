import { prisma } from '../utils/db.js';

export class DashboardModel {
    static async getTotalLearners(orgId) {
        try {
            console.log('[DASHBOARD MODEL] getTotalLearners for orgId:', orgId);
            return await prisma.user.count({
                where: { orgId, userRole: 'LEARNER', status: 'ACTIVE' }
            });
        } catch (error) {
            console.error('[DASHBOARD MODEL ERROR getTotalLearners]', error.message);
            return 0;
        }
    }

    static async getAverageCompletion(orgId) {
        try {
            console.log('[DASHBOARD MODEL] getAverageCompletion for orgId:', orgId);
            const avgResult = await prisma.attempt.aggregate({
                where: { user: { orgId } },
                _avg: { completionPercentage: true }
            });
            return avgResult._avg.completionPercentage || 0;
        } catch (error) {
            console.error('[DASHBOARD MODEL ERROR getAverageCompletion]', error.message);
            return 0;
        }
    }

    static async getOverdueCourses(orgId) {
        try {
            console.log('[DASHBOARD MODEL] getOverdueCourses for orgId:', orgId);
            return await prisma.assignment.count({
                where: {
                    course: { orgId },
                    dueDate: { lt: new Date() },
                    NOT: { attempts: { some: { status: 'COMPLETED' } } }
                }
            });
        } catch (error) {
            console.error('[DASHBOARD MODEL ERROR getOverdueCourses]', error.message);
            return 0;
        }
    }

    static async getActiveAssignments(orgId) {
        try {
            console.log('[DASHBOARD MODEL] getActiveAssignments for orgId:', orgId);
            return await prisma.assignment.count({
                where: {
                    course: { orgId },
                    dueDate: { gte: new Date() },
                    NOT: { attempts: { some: { status: 'COMPLETED' } } }
                }
            });
        } catch (error) {
            console.error('[DASHBOARD MODEL ERROR getActiveAssignments]', error.message);
            return 0;
        }
    }

    static async getTopPerformers(orgId, limit = 5) {
        try {
            console.log('[DASHBOARD MODEL] getTopPerformers for orgId:', orgId);
            const users = await prisma.user.findMany({
                where: { orgId, userRole: 'LEARNER', status: 'ACTIVE' },
                select: { id: true, fullName: true, email: true },
                include: {
                    attempts: {
                        select: { completionPercentage: true },
                        where: { status: 'COMPLETED' }
                    }
                },
                orderBy: {
                    attempts: { _avg: { completionPercentage: 'desc' } }
                },
                take: limit
            });
            return users.map(u => ({
                ...u,
                avgCompletion: Math.round((u.attempts.reduce((sum, a) => sum + (a.completionPercentage || 0), 0) / Math.max(u.attempts.length, 1)) * 100) / 100
            }));
        } catch (error) {
            console.error('[DASHBOARD MODEL ERROR getTopPerformers]', error.message);
            return [];
        }
    }

    static async getCompletionByDepartment(orgId) {
        try {
            console.log('[DASHBOARD MODEL] getCompletionByDepartment for orgId:', orgId);
            const depts = await prisma.department.findMany({
                where: { orgId },
                include: {
                    users: {
                        where: { userRole: 'LEARNER', status: 'ACTIVE' },
                        include: { attempts: true }
                    }
                }
            });
            return depts.map(d => {
                const users = d.users;
                return {
                    department: d.name,
                    totalLearners: users.length,
                    completed: users.filter(u => u.attempts.some(a => a.status === 'COMPLETED')).length,
                    inProgress: users.filter(u => u.attempts.some(a => a.status === 'IN_PROGRESS')).length,
                    notStarted: users.filter(u => u.attempts.length === 0).length,
                    overdue: users.filter(u => u.attempts.some(a => a.dueDate < new Date() && a.status !== 'COMPLETED')).length
                };
            });
        } catch (error) {
            console.error('[DASHBOARD MODEL ERROR getCompletionByDepartment]', error.message);
            return [];
        }
    }

    static async getCourseStatus(orgId) {
        try {
            console.log('[DASHBOARD MODEL] getCourseStatus for orgId:', orgId);
            const [completed, inProgress, notStarted, overdue] = await Promise.all([
                prisma.certificate.count({ where: { user: { orgId } } }),
                prisma.attempt.count({ where: { user: { orgId }, status: 'IN_PROGRESS' } }),
                prisma.assignment.count({ where: { course: { orgId }, attempts: { none: {} } } }),
                prisma.assignment.count({ where: { course: { orgId }, dueDate: { lt: new Date() }, attempts: { none: { status: 'COMPLETED' } } } })
            ]);
            return { completed, inProgress, notStarted, overdue };
        } catch (error) {
            console.error('[DASHBOARD MODEL ERROR getCourseStatus]', error.message);
            return { completed: 0, inProgress: 0, notStarted: 0, overdue: 0 };
        }
    }

    static async getActiveLearners() {
        return prisma.user.count({
            where: { userRole: 'LEARNER', status: 'ACTIVE' }
        });
    }

    static async getCompletionRate() {
        const avgResult = await prisma.attempt.aggregate({
            where: { status: 'COMPLETED' },
            _avg: { completionPercentage: true }
        });
        return avgResult._avg.completionPercentage || 0;
    }

    // static async getAverageSession() {
    //     const avgResult = await prisma.attempt.aggregate({
    //         _avg: { sessionDuration: true }  // Assume Attempt has sessionDuration in minutes
    //     });
    //     return Math.round(avgResult._avg.sessionDuration || 0);
    // }

    static async getSystemLoad() {
        return prisma.attempt.count({
            where: { status: 'IN_PROGRESS' }
        });
    }

    static async getRecentActivities(limit = 10) {
        console.log('[DASHBOARD MODEL] getRecentActivities');
        return prisma.auditLog.findMany({
            where: { eventType: { in: ['LOGIN', 'COURSE_START', 'COURSE_COMPLETE'] } },  // FIXED: Use eventType instead of actionType
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { actor: { select: { id: true, fullName: true } } }
        });
    }

    static async getLearningActivityGraph(days = 30) {
        console.log('[DASHBOARD MODEL] getLearningActivityGraph');
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const dailyData = await prisma.$queryRaw`
        SELECT DATE("createdAt") as date, COUNT(*) as newAttempts, SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) as completions
        FROM "attempts"
        WHERE "createdAt" >= ${startDate.toISOString()}
        GROUP BY DATE("createdAt")
        ORDER BY date
      `;
            return dailyData.map(row => ({
                date: row.date,
                newAttempts: Number(row.newattempts || 0),
                completions: Number(row.completions || 0)
            }));
        } catch (error) {
            console.error('[DASHBOARD MODEL ERROR getLearningActivityGraph]', error.message);
            return [];  // Fallback empty array
        }
    }

    static async getRecentActivity(limit = 5) {
        console.log('[DASHBOARD MODEL] getRecentActivity');
        return prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: { actor: { select: { fullName: true } } }  // FIXED: Remove target: true
        });
    }

    // static async getCriticalAlerts(threshold = 50) {  // Courses with <50% completion
    //     console.log('[DASHBOARD MODEL] getCriticalAlerts');
    //     const courses = await prisma.course.findMany({
    //         where: {
    //             assignments: {
    //                 some: {
    //                     attempts: {
    //                         none: { status: 'COMPLETED' }  // FIXED: Assignments with incomplete attempts
    //                     }
    //                 }
    //             }
    //         },
    //         include: {
    //             assignments: {
    //                 include: {
    //                     attempts: {
    //                         select: { completionPercentage: true, status: true }
    //                     }
    //                 }
    //             }
    //         }
    //     });
    //     const alerts = courses.map(c => {
    //         const allAttempts = c.assignments.flatMap(a => a.attempts);
    //         const completedAttempts = allAttempts.filter(a => a.status === 'COMPLETED');
    //         const avgCompletion = completedAttempts.length > 0 ? completedAttempts.reduce((sum, a) => sum + (a.completionPercentage || 0), 0) / completedAttempts.length : 0;
    //         const failureRate = 100 - (avgCompletion * 100);
    //         return {
    //             id: c.id,
    //             title: c.title,
    //             failureRate: Math.round(failureRate * 100) / 100
    //         };
    //     }).filter(c => c.failureRate > threshold);
    //     return alerts.sort((a, b) => b.failureRate - a.failureRate);
    // }
}