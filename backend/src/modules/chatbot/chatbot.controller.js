const { getBotReply } = require("./chatbot.service");

const chatWithBot = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required.",
      });
    }

    // Different auth payload formats support karo
    const user = {
      userId: req.user?.id || req.user?.userId || req.user?.user?.id || null,
      tenantId:
        req.user?.tenantId || req.user?.tenant?.id || null,
      role: req.user?.role || null,
    };

    console.log("CHATBOT USER:", user);

    const reply = await getBotReply(message, user);

    return res.status(200).json({
      success: true,
      reply,
    });
  } catch (error) {
    console.error("Chatbot Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

module.exports = {
  chatWithBot,
};