const prisma = require("../../prisma/prismaClient");

// =====================================================
// GET AI CONVERSATIONS
// =====================================================
// Returns chat history for the currently logged-in user.
//
// Security:
// - Only current user's conversations are returned.
// - tenantId is taken from JWT.
// - Another user's conversations cannot be accessed.
// =====================================================

async function getConversations(req, res, next) {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const conversations = await prisma.aIConversation.findMany({
      where: {
        userId,
        tenantId,
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

    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    console.error("GET AI CONVERSATIONS ERROR:", error);

    return next(error);
  }
}

// =====================================================
// GET SINGLE AI CONVERSATION
// =====================================================
// Returns one conversation with all its messages.
//
// Security:
// The conversation MUST belong to the logged-in user
// and the logged-in tenant.
// =====================================================

async function getConversation(req, res, next) {
  try {
    const userId = req.user?.userId;
    const tenantId = req.user?.tenantId;

    const conversationId = Number(req.params.id);

    if (!userId || !tenantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid conversation ID",
      });
    }

    const conversation = await prisma.aIConversation.findFirst({
      where: {
        id: conversationId,
        userId,
        tenantId,
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

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    console.error("GET AI CONVERSATION ERROR:", error);

    return next(error);
  }
}

module.exports = {
  getConversations,
  getConversation,
};