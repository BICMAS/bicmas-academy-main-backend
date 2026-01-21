import { AttemptService } from '../service/AttemptService.js';

export const updateProgress = async (req, res) => {
    try {
        const { courseId } = req.params;
        const { completionPercentage, status, notes } = req.body;
        const result = await AttemptService.updateProgress(courseId, { completionPercentage, status, notes }, req.user);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};