require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const connectDb = require("./config/db");
const documentsRouter = require("./routes/documents");
const aiRouter = require("./routes/ai");

const PORT = process.env.PORT || 5000;

const app = express();

app.use(cors({ origin: process.env.FRONTEND }));
app.use(express.json());

app.use("/api/documents", documentsRouter);
app.use("/api/ai", aiRouter);

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
});

connectDb().then(() => {
    const server = app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });

    server.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
            console.error(`Port ${PORT} is already in use — stop whatever else is running on it and restart.`);
        } else {
            console.error("Server failed to start:", err.message);
        }
        process.exit(1);
    });
});

process.on("SIGINT", () => mongoose.connection.close().finally(() => process.exit(0)));
process.on("SIGTERM", () => mongoose.connection.close().finally(() => process.exit(0)));
