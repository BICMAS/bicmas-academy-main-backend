import { CourseModel } from '../models/CourseModel.js';
import { ScormPackageModel } from '../models/ScormPackageModel.js';

export class CourseService {
    static async getCourses() {
        return await CourseModel.findMany();
    }

    static async createCourse(data) {
        if (!data.title) throw new Error('Course title required');
        return await CourseModel.create(data);
    }

    static async createAssignment(courseId, data) {
        const course = await CourseModel.findById(courseId);
        if (!course) throw new Error('Course not found');
        return prisma.assignment.create({ data: { courseId, ...data } });
    }
}