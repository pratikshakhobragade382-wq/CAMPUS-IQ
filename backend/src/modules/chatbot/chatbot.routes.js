
const express = require('express');
const router = express.Router();

const { chatWithBot } = require('./chatbot.controller');

router.post('/', chatWithBot);

module.exports = router;