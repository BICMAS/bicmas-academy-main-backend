import { UserModel } from '../models/UserModel.js';
import bcrypt from 'bcryptjs';

export class UserService {
    static async getUser(id) {
        const user = await UserModel.findById(id);
        if (!user) throw new Error('User not found');
        return { ...user, password: undefined };  // Strip sensitive
    }

    static async createUser(data) {
        const { password, ...userData } = data;
        if (!password) throw new Error('Password required');
        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await UserModel.create({ ...userData, password: hashedPassword });
        return { ...user, password: undefined };
    }

    static async updateUser(id, data) {
        if (data.password) {
            data.password = await bcrypt.hash(data.password, 12);
        }
        const user = await UserModel.update(id, data);
        return { ...user, password: undefined };
    }

    static async bulkUpload(csvData) {
        // Validate CSV rows (e.g., required fields)
        const validData = csvData.filter(row => row.email && row.username);
        if (validData.length === 0) throw new Error('No valid users in CSV');
        const result = await UserModel.bulkCreate(validData);
        return { created: result.count, skipped: csvData.length - result.count };
    }
}