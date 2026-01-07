import { Router } from 'express';
import { getCourses, createDraft, updateCourse, publishCourse, getCourseById, deleteCourse, deleteModule } from '../controllers/CourseController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const courseRouter = Router();

courseRouter.get('/', getCourses);
courseRouter.post('/draft', authenticateToken, requireRole(['HR_MANAGER', 'SUPER_ADMIN']), createDraft);
courseRouter.patch('/:id', authenticateToken, requireRole(['HR_MANAGER', 'SUPER_ADMIN']), updateCourse);
courseRouter.patch('/:id/publish', authenticateToken, requireRole(['HR_MANAGER', 'SUPER_ADMIN']), publishCourse);
courseRouter.get('/:id', getCourseById);
courseRouter.delete('/:id', authenticateToken, requireRole(['HR_MANAGER', 'SUPER_ADMIN']), deleteCourse);
courseRouter.delete('/:courseId/modules/:moduleId', authenticateToken, requireRole(['HR_MANAGER', 'SUPER_ADMIN']), deleteModule);


export default courseRouter;