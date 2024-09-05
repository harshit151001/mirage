import * as chatService from "../services/chatService.js";
import { streamResponse } from "../utils/llmUtils/openAi.js";


async function handleQuery(req, res) {
    let headersSent = false;
    try {
        const { chatId, repoId, message, parentId } = req.body;
        const userId = '60372839-8ead-4ac8-ac8d-bcbf7fa87fb9';

        if (!chatId || !repoId || !message) throw new Error('Missing required fields');

        const result = await chatService.query(userId, chatId, repoId, message, parentId);

        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        });

        headersSent = true;

        for await (const event of streamResponse(result.stream)) {
            if (event.status === 'in_progress') {
                res.write(`data: ${JSON.stringify(event)}\n\n`);
            }
            if (event.status === 'completed') {
                res.write(`data: ${JSON.stringify(event)}\n\n`);
                if (event?.content) {
                    const text = JSON.stringify(event.content[0].text);
                    const userMessage = await chatService.createUserMessage(result.chatId, message, parentId)
                    chatService.createAssistantMessage(result.chatId, text, userMessage.id);
                }
            }
        }

        res.end();
    } catch (error) {
        handleError(res, error, headersSent);
    }
}

async function getChatsHistory(req, res) {
    try {
        const userId = req.user.id;
        const chats = await chatService.getChatsHistory(userId);
        res.status(200).json(chats);
    } catch (error) {
        console.error('Error fetching chat history:', error.message);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
}

async function getChatHistory(req, res) {
    try {
        const userId = req.user.id;
        const chatId = req.params.chatId;
        const chat = await chatService.getChatHistory(userId, chatId);
        res.status(200).json(chat);
    } catch (error) {
        console.error('Error fetching chat history:', error.message);
        if (error.message === 'Not found') {
            res.status(404).json({ error: 'No such resource found' });
            return;
        }
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
}

function handleError(res, error, headersSent) {
    console.error('Error handling chat:', error);
    if (headersSent) {
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
        return;
    }
    switch (error.message) {
        case 'Missing required fields':
            res.status(400).json({ error: 'Missing required fields' });
            break;
        case 'Unauthorized access':
            res.status(404).json({ error: 'No such resource found' });
            break;
        default:
            res.status(500).json({ error: 'Failed to query chat' });
    }

}

export { handleQuery, getChatsHistory, getChatHistory };