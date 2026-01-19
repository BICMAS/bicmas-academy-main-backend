import { prisma } from '../utils/db.js';

export class CourseModel {
    static async findMany() {
        return prisma.course.findMany({
            where: { status: 'PUBLISHED' },
            include: { modules: { include: { lessons: { include: { scormPackage: true } } } } }
        });
    }

    static async create(data) {
        return prisma.course.create({
            data,
            include: { modules: true }
        });
    }

    static async findManyByIds(ids) {
        if (!Array.isArray(ids) || ids.length === 0) return [];
        return prisma.course.findMany({
            where: { id: { in: ids } },
            select: { id: true, title: true, status: true }
        });
    }

    static async findById(id) {
        return prisma.course.findUnique({
            where: { id },
            include: {
                modules: {
                    include: {
                        lessons: {
                            include: {
                                scormPackage: true
                            }
                        }
                    }
                },
                scormPackage: true,
                creator: {
                    select: { id: true, fullName: true, email: true }
                }
            }
        });
    }

    static async delete(id) {
        console.log('[COURSE MODEL] Deleting ID:', id);
        return prisma.course.delete({
            where: { id }
        });
    }

    static async updateNested(id, data) {
        console.log('🔄 Updating course with modules...');

        const updateData = {
            title: data.title,
            description: data.description || null,
            tags: data.tags || null,
            visibility: data.visibility || null,
            version: data.version || null,
            scormPackageId: data.scormPackageId || null,
            status: data.status || 'PUBLISHED',
            updatedAt: new Date()
        };


        if (data.modules && Array.isArray(data.modules)) {
            if (data.modules.length === 0) {

                updateData.modules = {
                    deleteMany: {}
                };
            } else {

                updateData.modules = {
                    create: data.modules.map(module => ({
                        name: module.name,
                        lessons: {
                            create: (module.lessons || []).map(lesson => ({
                                title: lesson.title,
                                description: lesson.description || null,
                                scormPackageId: lesson.scormPackageId || null
                            }))
                        }
                    }))
                };
            }
        }

        console.log('📦 Update data:', JSON.stringify(updateData, null, 2));

        return await prisma.course.update({
            where: { id },
            data: updateData,
            include: {
                modules: {
                    include: {
                        lessons: {
                            include: {
                                scormPackage: true
                            }
                        }
                    }
                }
            }
        });
    }


    static async publish(id) {
        return prisma.course.update({
            where: { id },
            data: { status: 'PUBLISHED' },
            include: { modules: { include: { lessons: true } } }
        });
    }


}