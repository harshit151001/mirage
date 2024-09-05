import axios from "axios";
import { PrismaClient } from "@prisma/client";
import { downloadRepositoryAsZip } from "../utils/repositoryParser.js";
import { createAssistant, createVectorStore } from "../utils/llmUtils/openAi.js";

const prisma = new PrismaClient();

const GITHUB_API_BASE_URL = "https://api.github.com";

/**
 * Fetches the user's repositories from GitHub, including both personal and organizational repositories.
 * 
 * @param {string} accessToken - The GitHub access token.
 * @returns {Promise<Object>} - An object containing the status and the list of repositories.
 * @throws {Error} - If there is an error fetching the repositories.
 */
async function getUserRepos(accessToken) {
	try {
		console.log("Fetching user's repositories...");
		const headers = {
			Authorization: `Bearer ${accessToken}`,
			Accept: "application/vnd.github.v3+json",
		};

		const userReposUrl = `${GITHUB_API_BASE_URL}/user/repos?type=all&per_page=100`;
		const userReposResponse = await axios.get(userReposUrl, { headers });
		let allRepos = userReposResponse.data;

		const orgsUrl = `${GITHUB_API_BASE_URL}/user/orgs`;
		const orgsResponse = await axios.get(orgsUrl, { headers });
		const orgs = orgsResponse.data;

		for (const org of orgs) {
			const orgReposUrl = `${GITHUB_API_BASE_URL}/orgs/${org.login}/repos?type=all&per_page=100`;
			const orgReposResponse = await axios.get(orgReposUrl, { headers });
			allRepos = allRepos.concat(orgReposResponse.data);
		}

		return {
			status: 200,
			data: allRepos.map((repo) => ({
				id: repo.id,
				name: repo.name,
				owner: repo.owner,
				createdAt: repo.created_at,
				updatedAt: repo.updated_at,
			})),
		};
	} catch (error) {
		console.error(`Error fetching repositories: ${error.message}`);
		throw error;
	}
}

/**
 * Processes a repository by downloading it, creating a vector store.
 * 
 * @param {string} userId - The ID of the user.
 * @param {string} owner - The owner of the repository.
 * @param {string} repo - The name of the repository.
 * @param {string} [branch="main"] - The branch of the repository to download.
 * @param {string} accessToken - The GitHub access token.
 * @returns {Promise<Object>} - An object containing the status and the repository data.
 * @throws {Error} - If there is an error processing the repository.
 */
async function processRepo(userId, owner, repo, branch = "main", accessToken) {
	console.log(`Starting to process repo: ${owner}/${repo}`);

	try {
		const existingRepo = await prisma.repo.findUnique({
			where: {
				userId_owner_name: {
					userId,
					owner,
					name: repo,
				},
			},
			select: {
				id: true,
				name: true,
				owner: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (existingRepo) {
			return {
				status: 409,
				message: "Repository already exists",
				data: existingRepo,
			};
		}

		const repositoryFolder = await downloadRepositoryAsZip(
			owner,
			repo,
			accessToken
		);

		console.log("Repository downloaded:", repositoryFolder);

		const vectorStoreId = await createVectorStore(repo, repositoryFolder);

		console.log("Vector store created:", vectorStoreId);

		// const assistantId = await createAssistant(repo, vectorStoreId);

		const newRepo = await prisma.repo.create({
			data: {
				name: repo,
				owner: owner,
				userId: userId,
				filesPath: repositoryFolder,
				storeId: vectorStoreId,
				// assistantId: assistantId,
			},
		});

		console.log("New repository created:", newRepo);

		return {
			status: 201,
			data: {
				id: newRepo.id,
				name: newRepo.name,
				owner: newRepo.owner,
				createdAt: newRepo.createdAt,
				updatedAt: newRepo.updatedAt,
			},
		};
	} catch (error) {
		console.error(
			`Error processing repository ${owner}/${repo}:`,
			error.message
		);
		throw error;
	}
}

/**
 * Retrieves the list of processed repositories for a user.
 * 
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Object>} - An object containing the status and the list of processed repositories.
 */
async function getProcessedRepos(userId) {
	const processedRepos = await prisma.repo.findMany({
		where: {
			userId,
			processed: true,
		},
		select: {
			id: true,
			name: true,
			owner: true,
			createdAt: true,
			updatedAt: true,
		},
	});
	return {
		status: 200,
		data: processedRepos,
	};
}

export { getUserRepos, processRepo, getProcessedRepos };
