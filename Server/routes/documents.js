const express = require("express");
const documentsController = require("../controllers/documents");

const router = express.Router();

router.get("/", documentsController.listDocuments);
router.post("/", documentsController.createDocument);
router.get("/:id", documentsController.getDocument);
router.put("/:id", documentsController.updateDocument);
router.delete("/:id", documentsController.deleteDocument);

module.exports = router;
