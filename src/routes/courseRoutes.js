import { Router } from 'express';
import { getCourses, createDraft, updateCourse, publishCourse, getCourseById } from '../controllers/CourseController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const courseRouter = Router();

courseRouter.get('/', getCourses);
courseRouter.post('/draft', authenticateToken, requireRole(['HR_MANAGER', 'SUPER_ADMIN']), createDraft);
courseRouter.patch('/:id', authenticateToken, requireRole(['HR_MANAGER', 'SUPER_ADMIN']), updateCourse);
courseRouter.patch('/:id/publish', authenticateToken, requireRole(['HR_MANAGER', 'SUPER_ADMIN']), publishCourse);
courseRouter.get('/:id', getCourseById);
export default courseRouter;