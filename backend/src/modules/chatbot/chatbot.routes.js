const express = require("express");

const router = express.Router();

const { chatWithBot } = require("./chatbot.controller");
const authMiddleware = require("../../middleware/authMiddleware");

// Login ke baad hi chatbot use hoga
router.post("/", authMiddleware, chatWithBot);

module.exports = router;