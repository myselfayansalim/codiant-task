const Documents = require("../models/documents");

function asyncHandler(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
}

exports.listDocuments = asyncHandler(async (req, res) => {
    const { search, category } = req.query;
    const query = {};

    if (category) {
        query.category = category;
    }

    if (search) {
        const regex = new RegExp(search, "i");
        query.$or = [{ title: regex }, { content: regex }];
    }

    const docs = await Documents.find(query).sort({ updatedAt: -1 });
    console.log(docs.length, "documents mile list me");
    res.json(docs);
});

exports.getDocument = asyncHandler(async (req, res) => {
    const doc = await Documents.findById(req.params.id);
    if (!doc) {
        return res.status(404).json({ message: "Document not found" });
    }
    res.json(doc);
});

exports.createDocument = asyncHandler(async (req, res) => {
    const { title, content, category } = req.body || {};
    console.log(req.body, "create wala data ye aaya h");

    try {
        const doc = await Documents.create({ title, content, category });
        console.log(doc._id, "naya document ban gya");
        res.status(201).json(doc);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        throw err;
    }
});

exports.updateDocument = asyncHandler(async (req, res) => {
    const { title, content, category } = req.body || {};
    console.log(req.params.id, "ye id update ho rhi h");

    try {
        const doc = await Documents.findByIdAndUpdate(
            req.params.id,
            { title, content, category },
            { new: true, runValidators: true }
        );
        if (!doc) {
            return res.status(404).json({ message: "Document not found" });
        }
        res.json(doc);
    } catch (err) {
        if (err.name === "ValidationError") {
            return res.status(400).json({ message: err.message });
        }
        throw err;
    }
});

exports.deleteDocument = asyncHandler(async (req, res) => {
    console.log(req.params.id, "isko delete krna h");
    const doc = await Documents.findByIdAndDelete(req.params.id);
    if (!doc) {
        return res.status(404).json({ message: "Document not found" });
    }
    res.status(204).send();
});
