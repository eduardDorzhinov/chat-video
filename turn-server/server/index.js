const express = require("express");
const app = express();

const PORT = 8080;

app.get("/", (req, res) => {
	res.send("TURN server is running");
});

app.listen(PORT, () => {
	console.log(`HTTP server listening on port ${PORT}`);
});
