import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const server = createServer(app);
const io = new Server(server, {
	cors: { origin: "*" },
});

io.on("connection", (socket) => {
	console.log("🔌 Пользователь подключился:", socket.id);

	socket.on("join", (roomId) => {
		socket.join(roomId);
		console.log(`➡️ ${socket.id} вошёл в комнату ${roomId}`);

		const clients = io.sockets.adapter.rooms.get(roomId);
		if (clients.size === 2) {
			io.to(roomId).emit("ready");
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

const PORT = 5000;
server.listen(PORT, () => console.log(`🚀 Signaling сервер запущен на порту ${PORT}`));
