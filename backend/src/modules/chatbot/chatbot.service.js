
const prisma = require('../../prisma/prismaClient');

const getBotReply = async (message) => {
  const text = message.toLowerCase();

  const qaList = await prisma.chatbotQA.findMany();

  for (const qa of qaList) {
    if (!qa.keywords) continue;

    const keywords = qa.keywords
      .split(',')
      .map(k => k.trim().toLowerCase());

    for (const key of keywords) {
      if (text.includes(key)) {
        return qa.answer;
      }
    }
  }

  return "Sorry! couldn't find the answer.";
};

module.exports = {
  getBotReply
};