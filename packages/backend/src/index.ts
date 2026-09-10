import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { auth } from './firebase-admin';
import themesRouter from './routes/themes';
import roomsRouter from './routes/rooms';
import sessionsRouter from './routes/sessions';
import llmRouter from './routes/llm';
import { registerRoomHandlers, recoverActiveRooms } from './socket/roomManager';

const app = express();
const httpServer = createServer(app);

const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(',');

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) cb(null, true);
      else cb(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/themes', themesRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api/generate-theme', llmRouter);

app.get('/health', (_req, res) => res.json({ ok: true }));

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) return next(new Error('Missing auth token'));
  try {
    const decoded = await auth.verifyIdToken(token);
    socket.data.uid = decoded.uid;
    socket.data.email = decoded.email;
    socket.data.displayName = decoded.name ?? decoded.email ?? 'Player';
    socket.data.photoURL = decoded.picture ?? '';
    next();
  } catch {
    next(new Error('Invalid auth token'));
  }
});

io.on('connection', (socket) => {
  registerRoomHandlers(io, socket);
});

const PORT = parseInt(process.env.PORT ?? '3001', 10);

httpServer.listen(PORT, async () => {
  console.log(`Server listening on port ${PORT}`);
  await recoverActiveRooms();
});
