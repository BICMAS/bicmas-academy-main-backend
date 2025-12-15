import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import router from './routes/index.js';

dotenv.config();  // Load env early

const app = express();
const port = process.env.PORT || 5000;

// Prisma client with adapter (Rust-free mode for Prisma 7 compatibility)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Redis client (connect for caching)
// const redis = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
// redis.connect().catch(console.error);

app.use(express.json());

// Health route
app.get('/', (req, res) => {
    res.json({ message: 'Hello World! This is the LLM project 🚀', timestamp: new Date().toISOString() });
});

app.use('/api/v1', router);

// Prompts route (example—paginate if large)
app.get('/prompts', async (req, res) => {
    try {
        const prompts = await prisma.prompt.findMany({
            take: 20,  // Limit for perf
            orderBy: { createdAt: 'desc' }
        });
        res.json(prompts);
    } catch (error) {
        console.error('Prompts query error:', error);
        res.status(500).json({ error: 'Failed to fetch prompts' });
    }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    // await redis.quit().catch(console.error);  // Uncomment if using Redis
    process.exit(0);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});