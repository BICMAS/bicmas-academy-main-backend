import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seed() {
    try {

        const customPassword = 'AdminPassword123!';
        const hashedPassword = await bcrypt.hash(customPassword, 12);

        await prisma.user.upsert({
            where: { email: 'folaremidixon@gmail.com' },
            update: {
                userRole: 'SUPER_ADMIN',
                status: 'ACTIVE',
                authProvider: 'LOCAL',
                password: hashedPassword  // NEW: Update with hash if user exists
            },
            create: {
                username: 'fola',
                email: 'folaremidixon@gmail.com',
                fullName: 'Folaremi Dixon',
                password: hashedPassword,  // NEW: Create with hash
                userRole: 'SUPER_ADMIN',
                status: 'ACTIVE',
                authProvider: 'LOCAL',
            },
        });
        console.log(`Super Admin created with password: ${customPassword} (hashed securely)!`);
        console.log('Seeding completed!');
    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seed();