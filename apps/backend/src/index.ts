import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import tradingRoutes from './routes/trading';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

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
