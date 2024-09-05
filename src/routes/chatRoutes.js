import express from "express";
import { ensureAuthenticated } from "../middleware/auth.js";
import * as chatController from "../controllers/chatController.js";

const router = express.Router();

router.post("/query", chatController.handleQuery);

router.get("/history", ensureAuthenticated, chatController.getChatsHistory);

router.get("/:chatId/history", ensureAuthenticated, chatController.getChatHistory);

// router.post("/edit", ensureAuthenticated, chatController.edit);


export default router;
