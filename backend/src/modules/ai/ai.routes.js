const express = require("express");
const multer = require("multer");

const { chat } = require("./ai.controller");
const {
  getConversations,
  getConversation,
} = require("./ai.history.controller");

const authMiddleware = require("../../middleware/authMiddleware");

const router = express.Router();

// =====================================================
// MULTER CONFIGURATION
// =====================================================

// Store uploaded images temporarily in memory.
// Images are sent directly to Ollama and are not
// permanently stored by this upload middleware.

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPG, JPEG, PNG, WEBP and GIF images are allowed."
        )
      );
    }
  },
});

// =====================================================
// AI CHAT HISTORY
// =====================================================

// Get all conversations belonging to the logged-in user.
//
// GET /api/v1/ai/conversations

router.get(
  "/conversations",
  authMiddleware,
  getConversations
);

// =====================================================
// GET SINGLE CONVERSATION
// =====================================================

// Get one conversation and all of its messages.
//
// GET /api/v1/ai/conversations/:id

router.get(
  "/conversations/:id",
  authMiddleware,
  getConversation
);

// =====================================================
// AI CHAT
// =====================================================

// Supports:
// - Text only
// - Text + one image
// - Existing conversation using conversationId

router.post(
  "/chat",
  authMiddleware,
  upload.single("image"),
  chat
);

module.exports = router;