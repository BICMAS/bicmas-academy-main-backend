import { UserModel } from '../models/UserModel.js';
import { OrganizationModel } from '../models/OrganizationModel.js';
import bcrypt from 'bcryptjs';

export class UserService {

    static async getAllUsers(requester) {
        console.log('[SERVICE GET USERS] Role:', requester.userRole, 'OrgId:', requester.orgId);
        if (requester.userRole === 'SUPER_ADMIN') {
            const users = await UserModel.findAll(requester.userRole, requester.orgId);
            console.log('[SERVICE SUPER ADMIN] Returned', users.length, 'users');
            return users;
        } else if (requester.userRole === 'HR_MANAGER') {
            if (!requester.orgId) throw new Error('HR must be in an organization');
            const users = await UserModel.findByOrgId(requester.orgId);
            console.log('[SERVICE HR] Returned', users.length, 'org users');
            return users;
        } else {
            throw new Error('Insufficient role to view users');
        }
    }

    static async getCurrentOrgUsers(requester) {
        const timestamp = new Date().toISOString();
        console.log(`[ORG SVC START] ${timestamp} - Role: ${requester.userRole}, orgId: ${requester.orgId}`);

        if (requester.userRole !== 'HR_MANAGER' && requester.userRole !== 'SUPER_ADMIN') {
            console.log(`[ORG SVC FAIL] ${timestamp} - Insufficient role`);
            throw new Error('Access denied—only HR and super admin can view org users');
        }

        if (!requester.orgId) {
            console.log(`[ORG SVC FAIL] ${timestamp} - No orgId`);
            throw new Error('No organization found for user');
        }

        const users = await UserModel.findByOrgId(requester.orgId);
        console.log(`[ORG SVC END] ${timestamp} - Found ${users.length} users for org ${requester.orgId}`);
        if (users.length === 0) {
            console.log(`[ORG SVC NOTE] ${timestamp} - Empty org, returning []`);
        }
        return users;  // FIXED: Return empty [] if no users (no throw)
    }

    static async getUser(id) {
        const user = await UserModel.findById(id);
        if (!user) throw new Error('User not found');
        return { ...user, password: undefined };  // Strip sensitive
    }

    static async createUser(data, creator) {
        const { fullName, email, phoneNumber, department, userRole, groupId, password, username } = data;  // Include username in destructuring
        if (!fullName || !email || !userRole || !department || !password) {
            throw new Error('Required fields: fullName, email, userRole, department, password');
        }

        let orgId = null;
        if (creator.userRole === 'SUPER_ADMIN') {
            if (userRole === 'HR_MANAGER') {
                const org = await OrganizationModel.create({
                    name: `Org for ${fullName}`,
                    createdBy: creator.id
                });
                orgId = org.id;
            }
        } else if (creator.userRole === 'HR_MANAGER') {
            if (!creator.orgId) throw new Error('HR must be in an organization');
            orgId = creator.orgId;
            if (userRole !== 'LEARNER') throw new Error('HR can only create learners');
        } else {
            throw new Error('Insufficient role to create users');
        }

        // FIXED: Check email only for duplicates (DB handles username unique)
        const existing = await UserModel.findByEmail(email);
        if (existing) throw new Error('Email already exists');

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await UserModel.create({
            fullName,
            email,
            username,  // Include if provided (DB enforces unique)
            phoneNumber: phoneNumber || null,
            department,
            userRole,
            password: hashedPassword,
            orgId,
            status: 'ACTIVE',
            authProvider: 'LOCAL'
        });

        if (groupId) {
            // await GroupMemberModel.create({ groupId, userId: user.id, role: 'MEMBER' });
        }

        return { ...user, password: undefined };
    }
}