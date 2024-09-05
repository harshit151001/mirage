import OpenAI from "openai";
import fs from "fs/promises";
import { createReadStream, stat } from 'fs';
import path from "path";
import { assistantPrompt } from "./prompts.js";
// @ts-ignore
const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
	organizationId: process.env.OPENAI_ORGANIZATION_ID,
	project: process.env.OPENAI_PROJECT_ID,
});

/**
 * Creates a vector store for a given repository.
 * 
 * @param {string} repoName - The name of the repository.
 * @param {string} repositoryFolder - The folder path of the repository.
 * @returns {Promise<string>} - The ID of the created vector store.
 */
const createVectorStore = async (repoName, repositoryFolder) => {
	try {
		// Read all files in the repository folder
		const files = await fs.readdir(repositoryFolder);
		const fileStreams = await Promise.all(
			files.map(async (file) => {
				const filePath = path.join(repositoryFolder, file);
				const stats = await fs.stat(filePath);
				if (stats.isFile() && stats.size > 0) {
					console.log(`Reading file: ${filePath}`);
					return createReadStream(filePath);
				}
				return null;
			})
		);

		// Filter out null streams
		const validFileStreams = fileStreams.filter((stream) => stream !== null);

		console.log(`Starting to create vector store for repository: ${repoName}`);

		// Create a new vector store
		const vectorStore = await openai.beta.vectorStores.create({
			name: repoName,
		});

		console.log(`Created vector store with ID: ${vectorStore.id}`);

		// Upload files to the vector store
		await openai.beta.vectorStores.fileBatches.uploadAndPoll(
			vectorStore.id,
			{
				files: validFileStreams,
			}
		);

		console.log(`Uploaded files to vector store with ID: ${vectorStore.id}`);

		return vectorStore.id;
	} catch (error) {
		console.error("Error creating vector store:", error);
		throw error;
	}
};

/**
 * Creates an assistant for a given repository using a vector store ID.
 * 
 * @param {string} repoName - The name of the repository.
 * @param {string} vectorStoreId - The ID of the vector store.
 * @returns {Promise<string>} - The ID of the created assistant.
 */
const createAssistant = async (repoName, vectorStoreId) => {
	try {
		console.log(`Starting to create assistant for repository: ${repoName} with vector store ID: ${vectorStoreId}`);

		// Create a new assistant
		const assistant = await openai.beta.assistants.create({
			name: `Code Assistant for ${repoName}`,
			instructions: assistantPrompt(repoName),
			model: "gpt-4o",
			tools: [{ type: "file_search" }],
			tool_resources: {
				file_search: {
					vector_store_ids: [vectorStoreId],
				},
			},
		});
		console.log(`Created assistant with ID: ${assistant.id}`);

		return assistant.id;
	} catch (error) {
		console.error(`Error creating assistant: ${error.message}`);
		throw error;
	}
};

/**
 * Creates a new thread.
 * 
 * @returns {Promise<Object>} - The created thread object.
 */
async function createThread() {
	return await openai.beta.threads.create();
}

/**
 * Creates a new message in a given thread.
 * 
 * @param {string} threadId - The ID of the thread.
 * @param {string} message - The message content.
 * @returns {Promise<Object>} - The created message object.
 */
async function createMessage(threadId, message) {
	return await openai.beta.threads.messages.create(threadId, {
		role: 'user',
		content: message,
	});
}

/**
 * Creates a stream for a given thread and assistant.
 * 
 * @param {string} threadId - The ID of the thread.
 * @param {string} assistantId - The ID of the assistant.
 * @returns {Promise<AsyncIterable>} - The stream of events.
 */
async function createStream(threadId, assistantId) {
	const stream = openai.beta.threads.runs.stream(threadId, {
		assistant_id: assistantId,
	});
	return stream;
}

/**
 * Processes the stream of events and yields responses.
 * 
 * @param {AsyncIterable} stream - The stream of events.
 * @returns {AsyncGenerator<Object>} - The generator yielding response objects.
 */
async function* streamResponse(stream) {
	for await (const event of stream) {
		switch (event.event) {
			case "thread.message.delta":
				yield {
					status: "in_progress",
					delta: event.data.delta.content,
					content: null,
				};
				break;
			case "thread.message.completed":
				yield {
					status: "completed",
					delta: null,
					content: event.data.content,
				};
				break;
			default:
				// do nothing
				break;
		}
	}
}




export { createVectorStore, createAssistant, createThread, createMessage, createStream, streamResponse };

