import axios from "axios";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import fs from "fs";
import unzipper from "unzipper";
import path from "path";
import { Octokit } from "@octokit/rest";

// Get the filename and directory name for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define the allowed file extensions
const ALLOWED_EXTENSIONS = [
	".c",
	".cs",
	".cpp",
	".doc",
	".docx",
	".html",
	".java",
	".json",
	".md",
	".pdf",
	".php",
	".pptx",
	".py",
	".rb",
	".tex",
	".txt",
	".css",
	".js",
	".sh",
	".ts",
	".jsx",
	".tsx",
];

/**
 * Downloads a GitHub repository as a ZIP file, extracts it, restructures the folder, and deletes the original directories.
 * @param {string} owner - The GitHub username of the repository owner.
 * @param {string} repo - The repository name.
 * @param {string} token - GitHub personal access token for authentication.
 * @returns {Promise<string>} - The path to the repository folder.
 */
async function downloadRepositoryAsZip(owner, repo, token) {
	console.log(`Downloading repository ${owner}/${repo}...`);
	try {
		// Define paths for the repository folder and the ZIP file
		const repositoryFolder = join(__dirname, "../../public", `${owner}_${repo}`);
		const zipPath = join(repositoryFolder, `${repo}.zip`);

		// Ensure the repository folder exists
		createDirectory(repositoryFolder);

		// Download the repository as a ZIP file
		await fetchRepositoryZip(zipPath, owner, repo, token);

		// Extract the ZIP file and restructure the folder
		await handleZipExtraction(zipPath, repositoryFolder);

		return repositoryFolder;
	} catch (error) {
		console.error(`Error in downloadRepositoryAsZip: ${error.message} at ${__filename}: ${error.stack}`);
		throw error;
	}
}

/**
 * Ensures that the directory exists; if not, it creates it.
 * @param {string} dir - The directory to be created.
 */
function createDirectory(dir) {
	try {
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
	} catch (error) {
		console.error(`Error in createDirectory: ${error.message} at ${__filename}: ${error.stack}`);
		throw error;
	}
}

/**
 * Fetches the repository ZIP file from GitHub.
 * @param {string} zipPath - The local path where the ZIP file will be saved.
 * @param {string} owner - The GitHub username of the repository owner.
 * @param {string} repo - The repository name.
 * @param {string} token - GitHub personal access token.
 * @returns {Promise<void>} - A promise that resolves when the ZIP file is fully downloaded.
 */
async function fetchRepositoryZip(zipPath, owner, repo, token) {
	try {
		const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/main`;

		const response = await axios.get(zipUrl, {
			responseType: "stream",
			headers: {
				Authorization: `token ${token}`,
				Accept: "application/vnd.github.v3+json",
			},
		});

		// Save the ZIP file to the specified path
		const writer = fs.createWriteStream(zipPath);
		response.data.pipe(writer);

		// Return a promise that resolves when the ZIP file is fully downloaded
		return new Promise((resolve, reject) => {
			writer.on("finish", resolve);
			writer.on("error", reject);
		});
	} catch (error) {
		console.error(`Error in fetchRepositoryZip: ${error.message} at ${__filename}: ${error.stack}`);
		throw error;
	}
}

async function fetchRepositoryZip2(zipPath, owner, repo, token) {
	const octokit = new Octokit({
		auth: token,
	});


	try {
		const { data: { archive_download_url } } = await octokit.repos.downloadZipballArchive({
			owner,
			repo,
		});

		// Download the zip file using axios
		const response = await axios({
			method: 'get',
			url: archive_download_url,
			responseType: 'stream'
		});

		// Pipe the response data to a file
		const writer = fs.createWriteStream(zipPath);
		response.data.pipe(writer);

		return new Promise((resolve, reject) => {
			writer.on("finish", resolve);
			writer.on("error", reject);
		});
	} catch (error) {
		console.error(`Error in fetchRepositoryZip2: ${error.message} at ${__filename}: ${error.stack}`);
		throw error;
	}
}

/**
 * Extracts the ZIP file, restructures the folders, and deletes the original directories.
 * @param {string} zipPath - The local path of the ZIP file.
 * @param {string} repositoryFolder - The folder where the ZIP contents will be extracted.
 * @returns {Promise<void>} - A promise that resolves when the extraction and restructuring are complete.
 */
async function handleZipExtraction(zipPath, repositoryFolder) {
	try {
		// Extract the ZIP file contents
		await fs
			.createReadStream(zipPath)
			.pipe(unzipper.Extract({ path: repositoryFolder }))
			.promise();

		// Remove the ZIP file after extraction
		fs.unlinkSync(zipPath);

		// Restructure the folders and delete original directories
		await restructureFolders(repositoryFolder, repositoryFolder);
	} catch (error) {
		console.error(`Error in handleZipExtraction: ${error.message} at ${__filename}: ${error.stack}`);
		throw error;
	}
}

/**
 * Flattens the directory structure, filters files by allowed extensions, and deletes directories inside the input directory.
 * @param {string} inputDir - The root directory of the original structure.
 * @param {string} outputDir - The root directory of the new structure.
 * @returns {Promise<void>} - A promise that resolves when the restructuring is complete.
 */
async function restructureFolders(inputDir, outputDir) {
	try {
		console.log("Restructuring folders...");
		console.log(`Input directory: ${inputDir}`);
		console.log(`Output directory: ${outputDir}`);

		// Ensure the output directory exists
		await fs.promises.mkdir(outputDir, { recursive: true });

		// Process and restructure the directory
		await processDirectory(inputDir, inputDir);

		// Delete all directories inside the input directory
		await deleteDirectories(inputDir);
	} catch (error) {
		console.error(`Error in restructureFolders: ${error.message} at ${__filename}: ${error.stack}`);
		throw error;
	}
}

/**
 * Recursively processes the directory structure.
 * @param {string} dir - The current directory being processed.
 * @param {string} base - The base path to be removed in the new structure.
 * @returns {Promise<void>} - A promise that resolves when the processing is complete.
 */
async function processDirectory(dir, base) {
	try {
		const entries = await fs.promises.readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				// Recursively process subdirectories
				await processDirectory(fullPath, base);
			} else {
				// Filter and copy files based on allowed extensions
				await handleFile(fullPath, base);
			}
		}
	} catch (error) {
		console.error(`Error in processDirectory: ${error.message} at ${__filename}: ${error.stack}`);
		throw error;
	}
}

/**
 * Handles individual files: renames them based on their relative path and copies them if they have an allowed extension.
 * @param {string} fullPath - The full path of the file.
 * @param {string} base - The base path to be removed in the new structure.
 * @returns {Promise<void>} - A promise that resolves when the file handling is complete.
 */
async function handleFile(fullPath, base) {
	try {
		const ext = path.extname(fullPath).toLowerCase();
		if (ALLOWED_EXTENSIONS.includes(ext)) {
			let relativePath = path.relative(base, fullPath).replace(/[\\/]/g, "_");

			console.log(`base ${base}`);

			// Change .jsx extension to .js
			if (ext === ".jsx") {
				relativePath = relativePath.replace(/\.jsx$/, ".js");
			} else if (ext === ".tsx") {
				relativePath = relativePath.replace(/\.tsx$/, ".ts");
			}

			const newFileName = `${relativePath}`;

			const outputPath = path.join(base, newFileName);

			// Copy the file to the new location
			await fs.promises.copyFile(fullPath, outputPath);
			console.log(`Copied: ${fullPath} -> ${outputPath}`);
		} else {
			console.log(`Skipped (disallowed extension): ${fullPath}`);
		}
	} catch (error) {
		console.error(`Error in handleFile: ${error.message} at ${__filename}: ${error.stack}`);
		throw error;
	}
}

/**
 * Deletes all directories inside the input directory.
 * @param {string} dir - The root directory where directories should be deleted.
 * @returns {Promise<void>} - A promise that resolves when the directories are deleted.
 */
async function deleteDirectories(dir) {
	try {
		const entries = await fs.promises.readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				// Recursively delete directories
				await fs.promises.rm(fullPath, { recursive: true, force: true });
				console.log(`Deleted directory: ${fullPath}`);
			}
		}
	} catch (error) {
		console.error(`Error in deleteDirectories: ${error.message} at ${__filename}: ${error.stack}`);
		throw error;
	}
}

export { downloadRepositoryAsZip };