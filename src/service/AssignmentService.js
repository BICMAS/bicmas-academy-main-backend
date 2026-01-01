import { AssignmentModel } from '../models/AssignmentModel.js';
import { CourseModel } from '../models/CourseModel.js';
import { UserModel } from '../models/UserModel.js';

export class AssignmentService {
    static async createAssignments(data, assigner) {
        const { courseId, learnerIds, dueDate, reminder } = data;

        // Validate required
        if (!courseId) throw new Error('Course ID required');
        if (!learnerIds || !Array.isArray(learnerIds) || learnerIds.length === 0) throw new Error('Learner IDs array required');

        // Validate course
        const course = await CourseModel.findById(courseId);
        if (!course) throw new Error('Course not found');
        if (course.status !== 'PUBLISHED') throw new Error('Only published courses can be assigned');

        // Validate assigner
        if (assigner.userRole !== 'HR_MANAGER' && assigner.userRole !== 'SUPER_ADMIN') {
            throw new Error('Only HR and super admin can assign courses');
        }

        // Validate learners
        const learners = await UserModel.findManyByIds(learnerIds);
        if (learners.length !== learnerIds.length) throw new Error('Some learners not found');
        if (assigner.userRole === 'HR_MANAGER') {
            const invalid = learners.filter(l => l.orgId !== assigner.orgId);
            if (invalid.length > 0) throw new Error('HR can only assign to org learners');
        }

        // Create assignments
        const assignments = await AssignmentModel.createMany(learnerIds.map(learnerId => ({
            courseId,
            assignerId: assigner.id,
            assigneeUserId: learnerId,
            dueDate,
            recurrenceRule: reminder
        })));

        return assignments;
    }
}