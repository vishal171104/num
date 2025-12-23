import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import tradingRoutes from './routes/trading';

import { rateLimit } from 'express-rate-limit';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Rate Limiter: 100 requests per 15 minutes
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
});

app.use(limiter);
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);
app.use('/api/trading', tradingRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'backend-api-gateway' });
});

app.listen(PORT, () => {
    console.log(`🚀 Backend API Gateway running on port ${PORT}`);
});
