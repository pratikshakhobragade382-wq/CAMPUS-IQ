const { chatWithAI } = require("./ai.service");
const prisma = require("../../prisma/prismaClient");

// =====================================================
// AI CHAT CONTROLLER
// =====================================================

async function chat(req, res, next) {
  try {
    const { message, conversationId } = req.body;

    // Image is optional.
    const image = req.file;

    // ---------------------------------------------------
    // AUTHENTICATED USER
    // ---------------------------------------------------

    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ---------------------------------------------------
    // VALIDATE REQUEST
    // ---------------------------------------------------

    if ((!message || !message.trim()) && !image) {
      return res.status(400).json({
        success: false,
        message: "Message or image is required",
      });
    }

    // ---------------------------------------------------
    // FIND OR CREATE CONVERSATION
    // ---------------------------------------------------

    let conversation;

    if (conversationId) {
      const parsedConversationId = Number(conversationId);

      if (!Number.isInteger(parsedConversationId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid conversationId",
        });
      }

      // IMPORTANT:
      // A teacher can only access conversations belonging
      // to their own userId and tenantId.

      conversation = await prisma.aIConversation.findFirst({
        where: {
          id: parsedConversationId,
          tenantId,
          userId,
        },
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          message: "Conversation not found",
        });
      }
    } else {
  // -------------------------------------------------
  // CREATE NEW CONVERSATION
  // -------------------------------------------------

  const conversationTitle =
    message && message.trim()
      ? message.trim().slice(0, 80)
      : image
      ? "Image Analysis"
      : "New Chat";

  conversation = await prisma.aIConversation.create({
    data: {
      title: conversationTitle,
      tenant: {
        connect: { id: tenantId },
      },
      user: {
        connect: { id: userId },
      },
    },
  });
}

    // ---------------------------------------------------
    // SEND MESSAGE TO LOCAL AI
    // ---------------------------------------------------

    const reply = await chatWithAI(
      message || "",
      image || null,
      conversation.id,
      tenantId,
      userId
    );

    // ---------------------------------------------------
    // SAVE USER MESSAGE
    // ---------------------------------------------------

    await prisma.aIMessage.create({
      data: {
        tenantId,
        userId,
        conversationId: conversation.id,
        role: "user",
        content:
          message?.trim() ||
          "Please analyze this image.",

        // Image storage will be added later.
        // For now the image is processed by Ollama
        // but not permanently stored.
        imageUrl: null,
      },
    });

    // ---------------------------------------------------
    // SAVE AI RESPONSE
    // ---------------------------------------------------

    await prisma.aIMessage.create({
      data: {
        tenantId,
        userId,
        conversationId: conversation.id,
        role: "assistant",
        content: reply,
        imageUrl: null,
      },
    });

    // ---------------------------------------------------
    // UPDATE CONVERSATION
    // ---------------------------------------------------

    await prisma.aIConversation.update({
      where: {
        id: conversation.id,
      },
      data: {
        updatedAt: new Date(),
      },
    });

    // ---------------------------------------------------
    // RETURN RESPONSE
    // ---------------------------------------------------

    return res.status(200).json({
      success: true,

      data: {
        conversationId: conversation.id,
        reply,
      },
    });
  } catch (error) {
    console.error("AI CHAT ERROR:", error);

    return next(error);
  }
}

// =====================================================
// GET AI CONVERSATIONS
// =====================================================
//
// Returns the logged-in teacher's conversation list.
//
// GET:
// /api/v1/ai/conversations
//
// Security:
// tenantId + userId are ALWAYS taken from JWT.
//
// The client cannot request another user's history.
//

async function getConversations(req, res, next) {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    // ---------------------------------------------------
    // AUTHENTICATION
    // ---------------------------------------------------

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ---------------------------------------------------
    // FETCH CONVERSATIONS
    // ---------------------------------------------------

    const conversations =
      await prisma.aIConversation.findMany({
        where: {
          tenantId,
          userId,
        },

        orderBy: {
          updatedAt: "desc",
        },

        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,

          _count: {
            select: {
              messages: true,
            },
          },
        },
      });

    // ---------------------------------------------------
    // FORMAT RESPONSE
    // ---------------------------------------------------

    const data = conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messageCount: conversation._count.messages,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(
      "AI CONVERSATIONS ERROR:",
      error
    );

    return next(error);
  }
}

// =====================================================
// GET SINGLE AI CONVERSATION
// =====================================================
//
// Returns one conversation and all its messages.
//
// GET:
// /api/v1/ai/conversations/:conversationId
//
// Security:
// tenantId + userId are checked against the JWT.
//

async function getConversation(req, res, next) {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    const conversationId = Number(
      req.params.conversationId
    );

    // ---------------------------------------------------
    // AUTHENTICATION
    // ---------------------------------------------------

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // ---------------------------------------------------
    // VALIDATE ID
    // ---------------------------------------------------

    if (!Number.isInteger(conversationId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversationId",
      });
    }

    // ---------------------------------------------------
    // FETCH CONVERSATION
    // ---------------------------------------------------

    const conversation =
      await prisma.aIConversation.findFirst({
        where: {
          id: conversationId,
          tenantId,
          userId,
        },

        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,

          messages: {
            orderBy: {
              createdAt: "asc",
            },

            select: {
              id: true,
              role: true,
              content: true,
              imageUrl: true,
              createdAt: true,
            },
          },
        },
      });

    // ---------------------------------------------------
    // NOT FOUND
    // ---------------------------------------------------

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    // ---------------------------------------------------
    // RETURN CONVERSATION
    // ---------------------------------------------------

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error(
      "AI CONVERSATION ERROR:",
      error
    );

    return next(error);
  }
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  chat,
  getConversations,
  getConversation,
};