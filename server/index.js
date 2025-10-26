import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import crypto from "crypto";

const app = express();

const TURN_SECRET = process.env.TURN_SERVER_SECRET || ""; // тот же, что в turnserver.conf
const TURN_REALM = process.env.TURN_REALM || "";
const TURN_TTL = 3600; // время жизни кредов (сек)

const allowedOrigins = [
	process.env.CLIENT_URL,
	"http://localhost:3000",
	"http://127.0.0.1:3000",
].filter(Boolean);

app.use(
	cors({
		origin: allowedOrigins,
		credentials: true,
	})
);

/** ============== TURN ============== */
app.get("/turn-credentials", (req, res) => {
	const timestamp = Math.floor(Date.now() / 1000) + TURN_TTL;
	const username = `${timestamp}`;
	const password = crypto
		.createHmac("sha1", TURN_SECRET)
		.update(username)
		.digest("base64");

	const iceServers = [
		{ urls: "stun:stun.l.google.com:19302" },
		{
			urls: [
				`turn:${TURN_REALM}:3478?transport=udp`,
				`turn:${TURN_REALM}:3478?transport=tcp`,
				`turns:${TURN_REALM}:5349?transport=tcp`,
			],
			username,
			credential: password,
		},
	];

	res.json({ username, credential: password, ttl: TURN_TTL, iceServers });
});

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
		socket.broadcast.emit("peer-left");
	});
});

const PORT = process.env.SERVER_PORT || 5001;
server.listen(PORT, () => {
	console.log(`🚀 Signaling сервер запущен на порту ${PORT}`)
	console.log(`🌍 TURN realm: ${TURN_REALM}`);
});
