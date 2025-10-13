import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

// TODO change hardcode
const allowedOrigins = [
	"http://localhost:3000",
	"http://127.0.0.1:3000",
];

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: {
		origin: allowedOrigins,
		methods: ["GET", "POST"],
	},
});

io.on("connection", (socket) => {
	socket.on("join", (roomId) => {
		socket.join(roomId);
		const clients = io.sockets.adapter.rooms.get(roomId);
		console.log(`➡️ ${socket.id} вошёл в комнату ${roomId}, участников: ${clients?.size}`);

		// когда в комнате двое — уведомляем первого
		if (clients && clients.size === 2) {
			socket.to(roomId).emit("ready");
		}
	});

	socket.on("offer", (payload) => {
		socket.to(payload.roomId).emit("offer", payload);
	});

	socket.on("answer", (payload) => {
		socket.to(payload.roomId).emit("answer", payload);
	});

	socket.on("ice-candidate", (payload) => {
		socket.to(payload.roomId).emit("ice-candidate", payload);
	});

	socket.on("disconnect", () => {
		console.log("❌ Пользователь отключился:", socket.id);
	});
});

const PORT = 5001;
server.listen(PORT, () => console.log(`🚀 Signaling сервер запущен на порту ${PORT}`));
