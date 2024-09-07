import { PrismaClient } from "@prisma/client";
import { createThread, createMessage, createStream, createAssistant } from "../utils/llmUtils/openAi.js";
import { console } from "inspector";

const prisma = new PrismaClient();

/**
 * Queries the chat service with a user message.
 * 
 * @param {string} userId - The ID of the user.
 * @param {string} chatId - The ID of the chat.
 * @param {string} repoId - The ID of the repository.
 * @param {string} message - The user message content.
 * @returns {Promise<Object>} - The stream and chat ID.
 */
async function query(userId, chatId, repoId, message) {
    try {
        const repo = await getAndValidateRepo(userId, repoId);
        const chat = await getOrCreateChat(userId, chatId, repo);

        const assistantId = chat.assistantId;
        const threadId = await getOrCreateThreadId(chat);

        await createMessage(threadId, message);
        const stream = await createStream(threadId, assistantId);

        return {
            stream: stream,
            chatId: chat.id,
        }
    } catch (error) {
        console.error("Error querying chat:", error);
        throw error;
    }
}

/**
 * Retrieves the chat history for a user.
 * 
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array>} - The list of chats with their history.
 * @throws {Error} - If there's an error fetching the chat history.
 */
async function getChatsHistory(userId) {
    try {
        const history = await prisma.chat.findMany({
            where: { userId },
            select: {
                id: true,
                repoId: true,
                messages: true,
                repo: {
                    select: {
                        id: true,
                        name: true,
                        owner: true,
                    }
                },
                createdAt: true,
            }
        });

        console.log("history", history);

        return history;

    } catch (error) {
        console.error(`Error fetching chat history for user ${userId}:`, error);
        throw new Error('Failed to fetch chat history');
    }
}

/**
 * Retrieves the chat history for a specific chat.
 * 
 * @param {string} userId - The ID of the user.
 * @param {string} chatId - The ID of the chat.
 * @returns {Promise<Object>} - The chat history.
 * @throws {Error} - If there's an error fetching the chat history or if the chat is not found.
 */
async function getChatHistory(userId, chatId) {
    try {
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            select: {
                id: true,
                title: true,
                userId: true,
                repoId: true,
                createdAt: true,
                updatedAt: true,
                repo: {
                    select: {
                        id: true,
                        name: true,
                        owner: true,
                    }
                },
                messages: {
                    select: {
                        id: true,
                        content: true,
                        senderType: true,
                        parentId: true,
                        createdAt: true,
                    },
                },
            },
        });

        if (!chat || chat.userId !== userId) {
            throw new Error('Not found');
        }

        return chat;
    } catch (error) {
        console.error(`Error fetching chat history for chat ${chatId}:`, error);
        throw error;
    }
}

/**
 * Creates a user message in the chat.
 * 
 * @param {string} chatId - The ID of the chat.
 * @param {string} content - The content of the user message.
 * @param {string} parentMessageId - The ID of the parent message.
 * @returns {Promise<Object>} - The created user message.
 */
async function createUserMessage(chatId, content, parentMessageId) {
    return await prisma.message.create({
        data: {
            chatId,
            parentId: parentMessageId,
            senderType: 'USER',
            content,
        },
    });
}

/**
 * Creates an assistant message in the chat.
 * 
 * @param {string} chatId - The ID of the chat.
 * @param {string} content - The content of the assistant message.
 * @param {string} parentMessageId - The ID of the parent message.
 * @returns {Promise<Object>} - The created assistant message.
 */
async function createAssistantMessage(chatId, content, parentMessageId) {
    return await prisma.message.create({
        data: {
            chatId,
            parentId: parentMessageId,
            senderType: 'ASSISTANT',
            content,
        },
    });
}

/**
 * Helper function to get and validate a repository.
 * 
 * @param {string} userId - The ID of the user.
 * @param {string} repoId - The ID of the repository.
 * @returns {Promise<Object>} - The repository object.
 * @throws {Error} - If the repository is not found or unauthorized.
 */
async function getAndValidateRepo(userId, repoId) {
    const repo = await prisma.repo.findUnique({
        where: { id: repoId },
    });

    if (!repo || repo.userId !== userId) {
        throw new Error('Unauthorized access');
    }

    return repo;
}

/**
 * Helper function to get or create a chat.
 * 
 * @param {string} userId - The ID of the user.
 * @param {string} chatId - The ID of the chat.
 * @param {Object} repo - The repository object.
 * @returns {Promise<Object>} - The chat object.
 * @throws {Error} - If the chat is not found or unauthorized.
 */
async function getOrCreateChat(userId, chatId, repo) {
    let chat = await prisma.chat.findUnique({
        where: { id: chatId },
        include: { messages: true, repo: true },
    });

    if (!chat) {
        const assistantId = await createAssistant(repo.name, repo.storeId);
        chat = await prisma.chat.create({
            data: {
                id: chatId,
                repoId: repo.id,
                assistantId,
                userId,
            },
            include: { messages: true, repo: true },
        });
    } else if (chat.userId !== userId || chat.repoId !== repo.id) {
        throw new Error('Unauthorized access');
    }

    return chat;
}

/**
 * Helper function to get or create a thread ID.
 * 
 * @param {Object} chat - The chat object.
 * @returns {Promise<string>} - The thread ID.
 */
async function getOrCreateThreadId(chat) {
    if (!chat.threadId) {
        const thread = await createThread();
        chat = await prisma.chat.update({
            where: { id: chat.id },
            data: { threadId: thread.id },
        });
    }
    return chat.threadId;
}

export { query, getChatsHistory, getChatHistory, createAssistantMessage, createUserMessage };





