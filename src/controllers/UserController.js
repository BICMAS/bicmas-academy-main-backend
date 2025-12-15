import { UserService } from '../services/UserService.js';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const upload = multer({ dest: 'uploads/' });

export const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserService.getUser(id);
        res.json(user);
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
};

export const createUser = async (req, res) => {
    try {
        const result = await UserService.createUser(req.body);
        res.status(201).json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await UserService.updateUser(id, req.body);
        res.json(result);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

export const bulkUpload = (req, res) => {
    upload.single('csv')(req, res, async (err) => {
        if (err) return res.status(400).json({ error: 'File upload failed' });
        const results = [];
        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                fs.unlinkSync(req.file.path);  // Clean up
                try {
                    const result = await UserService.bulkUpload(results);
                    res.json(result);
                } catch (error) {
                    res.status(400).json({ error: error.message });
                }
            });
    });
};