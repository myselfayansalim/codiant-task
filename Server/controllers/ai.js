const Documents = require("../models/documents");


exports.askQuestion = async (req, res, next) => {
    try {
        const { documentId, question } = req.body || {};

        if (!documentId || !question || !question.trim()) {
            return res.status(400).json({ message: "documentId and question are required" });
        }

        const doc = await Documents.findById(documentId);
        console.log(doc,"data aa rha h yaa nhi ");
        if (!doc) {
            return res.status(404).json({ message: "Document not found" });
        }

        const aiResponse = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.LLM_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "nvidia/nemotron-3.5-bolt-e4b",
                temperature: 0.2,
                max_tokens: 300,
                messages: [
                    {
                        role: "system",
                        content:
                            'Answer the question using only the information in the document below. If the document does not contain enough information to answer, reply exactly: "The document does not contain enough information to answer this question."',
                    },
                    {
                        role: "user",
                        content: `Document (title: ${doc.title}):\n${doc.content}\n\nQuestion: ${question}`,
                    },
                ],
            }),
        });

        if (!aiResponse.ok) {
            const detail = await aiResponse.text();
            console.error("error:", aiResponse.status, detail);
            return res.status(502).json({ message: "AI service failed to respond" });
        }

        const data = await aiResponse.json();
        const answer = data.choices?.[0]?.message?.content?.trim();
        console.log(answer, "ye final answer aaya ai se");

        res.json({ answer: answer || "The document dont have the info...." });
    } catch (err) {
        next(err);
    }
};
