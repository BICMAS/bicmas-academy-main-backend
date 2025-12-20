import { CourseModel } from '../models/CourseModel.js';

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
        if (course.status !== 'DRAFT') throw new Error('Only drafts can be updated');

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

        // Prepare data for model
        const updateData = {
            title: data.title,
            description: data.description || null,
            tags: data.tags || null,
            visibility: data.visibility || null,
            version: data.version || null,
            scormPackageId: data.scormPackageId || null
        };

        // Pass modules as-is (array)
        if (data.modules !== undefined) {
            updateData.modules = data.modules;
        }

        return await CourseModel.updateNested(id, updateData);
    }

    static async publishCourse(id, data) {
        const course = await CourseModel.findById(id);
        if (!course) throw new Error('Course not found');
        if (course.status !== 'DRAFT') throw new Error('Only drafts can be published');
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
}