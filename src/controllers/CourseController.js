import { CourseService } from '../service/CourseService.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

export const getCourses = async (req, res) => {
    try {
        const courses = await CourseService.getCourses();
        res.json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCourseById = async (req, res) => {
    try {
        const { id } = req.params;
        const course = await CourseService.getCourseById(id);
        res.json(course);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

export const createDraft = async (req, res) => {
    try {
        const result = await CourseService.createDraft(req.body, req.user.id);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await CourseService.updateCourse(id, req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const publishCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await CourseService.publishCourse(id, req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await CourseService.deleteCourse(id, req.user);
        res.json(result);
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};

export const deleteModule = async (req, res) => {
    try {
        const { courseId, moduleId } = req.params;
        const result = await CourseService.deleteModule(courseId, moduleId, req.user);
        res.json(result);
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
};
