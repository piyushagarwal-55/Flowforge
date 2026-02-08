import { Server } from "socket.io";

let io: Server | null = null;

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "https://your-frontend-domain.vercel.app",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    socket.on("join-execution", (executionId) => {
      socket.join(executionId);
      console.log("📡 Joined execution:", executionId);
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error("Socket not initialized");
  return io;
}
