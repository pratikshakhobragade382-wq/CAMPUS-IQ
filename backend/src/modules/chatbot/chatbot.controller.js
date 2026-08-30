
const prisma = require('../../prisma/prismaClient');
const { getBotReply } = require('./chatbot.service');

const chatWithBot = async (req, res) => {
  try {
    const { message } = req.body;

    // Check karo message aaya hai ya nahi
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required."
      });
    }

    // Bot ka answer nikalo
    const reply = await getBotReply(message);

    
    return res.status(200).json({
      success: true,
      reply
    });

  } catch (error) {
    console.error("Chatbot Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};

module.exports = {
  chatWithBot
};