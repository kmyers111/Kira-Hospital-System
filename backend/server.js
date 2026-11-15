import express from 'express';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './auth/auth.routes.js';
import userRoutes from './users/user.routes.js';
import patientRoutes from './patients/patient.routes.js';
import staffRoutes from './staff/staff.routes.js';
import { config } from './config.js';
import dotenv from 'dotenv';
dotenv.config();

import dns from 'node:dns'; 
//i was having an error with mongodb connection so i had to hard code this
if (dns.setServers) {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
}

const app = express();

app.use(cors({
  origin: config.frontendOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});
app.use('/api/auth', authRoutes);
app.use('/api', userRoutes);
app.use('/api', patientRoutes);
app.use('/api', staffRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

async function startServer() {
  await mongoose.connect(config.mongoUri, { family: 4 });
  app.listen(config.port, () => {
    console.log(`Server is running on port ${config.port}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start server:', error.message);
  process.exitCode = 1;
});
