import { CourseModel } from '../models/CourseModel.js';
import { ModuleModel } from '../models/ModuleModel.js';

export class CourseService {
    static async createDraft(data, creatorId) {
        if (!data.title) throw new Error('Course title required');
        const courseData = {
            ...data,
            status: 'DRAFT',
            tags: data.tags || null,
            visibility: data.visibility || null,
            version: data.version || null,
            createdBy: creatorId
        };
        return await CourseModel.create(courseData);
    }

    static async updateCourse(id, data) {
        const course = await CourseModel.findById(id);
        if (!course) throw new Error('Course not found');

        // Validate modules if provided
        if (data.modules !== undefined) {
            if (!Array.isArray(data.modules)) {
                throw new Error('Modules must be an array');
            }

            // Validate each module
            data.modules.forEach((module, index) => {
                if (!module.name) {
                    throw new Error(`Module ${index + 1} name is required`);
                }

                // Validate lessons if provided
                if (module.lessons && Array.isArray(module.lessons)) {
                    module.lessons.forEach((lesson, lessonIndex) => {
                        if (!lesson.title) {
                            throw new Error(`Lesson ${lessonIndex + 1} in module "${module.name}" title is required`);
                        }
                    });
                }
            });
        }


        const updateData = {
            title: data.title,
            description: data.description || null,
            tags: data.tags || null,
            visibility: data.visibility || null,
            version: data.version || null,
            scormPackageId: data.scormPackageId || null,
            status: data.status || 'PUBLISHED'
        };


        if (data.modules !== undefined) {
            updateData.modules = data.modules;
        }

        console.log('[COURSE SERVICE] Updating with status:', updateData.status);

        return await CourseModel.updateNested(id, updateData);
    }

    static async publishCourse(id, data) {
        const course = await CourseModel.findById(id);
        if (!course) throw new Error('Course not found');
        if (!data.modules || data.modules.length === 0) throw new Error('Course must have at least one module');

        return await CourseModel.publish(id);
    }

    static async getCourses() {
        return await CourseModel.findMany();
    }
    static async getCourseById(id) {
        const course = await CourseModel.findById(id);
        if (!course) throw new Error('Course not found');
        return course;
    }

    static async deleteCourse(id, requester) {
        // FIXED: Validate course exists
        const course = await CourseModel.findById(id);
        if (!course) throw new Error('Course not found');
        if (course.createdBy !== requester.id && requester.userRole !== 'SUPER_ADMIN') {
            throw new Error('Only creator or super admin can delete');
        }

        console.log('[COURSE SERVICE] Deleting course ID:', id);  // FIXED: Log for trace
        await CourseModel.delete(id);  // FIXED: Cascades to modules/lessons/assignments
        return { message: 'Course deleted successfully' };
    }

    static async deleteModule(courseId, moduleId, requester) {
        // FIXED: Validate course exists
        const course = await CourseModel.findById(courseId);
        if (!course) throw new Error('Course not found');
        if (course.createdBy !== requester.id && requester.userRole !== 'SUPER_ADMIN') {
            throw new Error('Only creator or super admin can delete');
        }

        // FIXED: Validate module exists and belongs to course
        const module = await ModuleModel.findById(moduleId);
        if (!module) throw new Error('Module not found');
        if (module.courseId !== courseId) throw new Error('Module not in course');

        console.log('[COURSE SERVICE] Deleting module ID:', moduleId, 'from course:', courseId);  // FIXED: Log for debug
        await ModuleModel.delete(moduleId);  // Cascades lessons
        return { message: 'Module deleted successfully' };
    }
}