import { Router } from 'express';
import { getCourses, createCourse, createAssignment } from '../controllers/CourseController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const courseRouter = Router();

courseRouter.get('/', getCourses);
courseRouter.post('/', authenticateToken, requireRole('SUPER_ADMIN', "HR_MANAGER"), createCourse);
courseRouter.post('/:id/assignments', authenticateToken, requireRole('HR_MANAGER', "SUPER_ADMIN"), createAssignment);
export default courseRouter;