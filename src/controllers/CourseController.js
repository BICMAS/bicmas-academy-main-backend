import multer from 'multer';
import { CourseService } from '../services/CourseService.js';
import { ScormService } from '../services/ScormService.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const upload = multer({ dest: 'uploads/' });

export const getCourses = async (req, res) => {
    try {
        const courses = await CourseService.getCourses();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createCourse = async (req, res) => {
    try {
        const result = await CourseService.createCourse(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const createAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await CourseService.createAssignment(id, req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};