import { AssignmentService } from '../service/AssignmentService.js';

export const createAssignments = async (req, res) => {
    try {
        const result = await AssignmentService.createAssignments(req.body, req.user);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};