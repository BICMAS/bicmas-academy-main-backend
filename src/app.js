import express from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createClient } from 'redis';
import { Pool } from 'pg';


const app = express();
const port = process.env.PORT || 5000;
const prisma = new PrismaClient();
dotenv.config();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World! this is an LLM project');
});

app.get('/prompts', async (req, res) => {
    const prompts = await prisma.prompt.findMany();
    res.json(prompts);
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
