import { AttemptModel } from '../models/AttemptModel.js';
import { LearningPathEnrolmentModel } from '../models/LearningPathEnrolmentModel.js';

export class AttemptService {
    static async updateProgress(courseId, data, user) {
        if (user.userRole !== 'LEARNER') throw new Error('Only learners can update progress');
        if (data.completionPercentage < 0 || data.completionPercentage > 100) throw new Error('Completion percentage must be 0-100');

        const attempt = await AttemptModel.upsert(user.id, courseId, data);

        // Update LearningPath enrolments if enrolled in paths with this course
        const enrolments = await LearningPathEnrolmentModel.findByUserAndCourse(user.id, courseId);
        for (const enrolment of enrolments) {
            await LearningPathEnrolmentModel.updateProgress(enrolment.id, data.completionPercentage);
        }

        return attempt;
    }
}