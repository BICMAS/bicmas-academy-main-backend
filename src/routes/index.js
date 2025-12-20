import { Router } from 'express';
import authRouter from './authRoutes.js';
import userRouter from './userRoutes.js';
import courseRouter from './courseRoutes.js';
import scormRouter from './scormRoutes.js';
import groupRouter from './groupRoutes.js';

const router = Router();

router.use('/auth', authRouter);
router.use('/users', userRouter);
router.use('/groups', groupRouter);
router.use('/courses', courseRouter);
router.use('/scorm-packages', scormRouter)
export default router;