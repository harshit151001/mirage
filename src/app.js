import express from "express";
import session from "express-session";
import passport from "passport";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/authRoutes.js";
import repoRoutes from "./routes/repoRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { configurePassport } from "./config/passport.js";
import cors from "cors";

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(
	session({
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day in milliseconds
	})
);

app.use(passport.initialize());
app.use(passport.session());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

configurePassport(passport, prisma);


app.get("/public", (req, res) => {
	if (req.user) {
		res.send(`Hello, ${req.user.username}. This is a public route.`);
	} else {
		res.send("Hello, guest. This is a public route.");
	}
});


app.use("/auth", authRoutes);
app.use("/api", repoRoutes);
app.use("/chat", chatRoutes)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
