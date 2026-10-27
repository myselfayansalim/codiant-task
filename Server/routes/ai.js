const express = require("express");
const { askQuestion } = require("../controllers/ai");

const router = express.Router();

router.post("/ask", askQuestion);

module.exports = router;
