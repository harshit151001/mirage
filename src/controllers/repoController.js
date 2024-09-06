import * as repoService from "../services/repoService.js";

async function getUserRepos(req, res) {
    try {
        const result = await repoService.getUserRepos(req.user.accessToken);
        res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching repositories:", error.message);
        res.status(500).json({ error: "Failed to fetch repositories", });
    }
}

async function processRepo(req, res) {
    try {
        const { owner, repo } = req.params;

        const result = await repoService.processRepo(
            req.user.id,
            owner,
            repo,
            "main",
            req.user.accessToken
        );
        res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error processing repository:", error.message);
        res.status(500).json({ error: "Failed to process repository" });
    }
}

async function getProcessedRepos(req, res) {
    try {
        const result = await repoService.getProcessedRepos(req.user.id);
        res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching processed repositories:", error.message);
        res.status(500).json({ error: "Failed to fetch processed repositories" });
    }
}

async function getProcessedRepo(req, res) {
    try {
        const { repoId } = req.params;
        const result = await repoService.getProcessedRepo(req.user.id, repoId);
        res.status(result.status).json(result.data);
    } catch (error) {
        console.error("Error fetching processed repository:", error.message);
        res.status(500).json({ error: "Failed to fetch processed repository" });
    }
}

export { getUserRepos, processRepo, getProcessedRepos, getProcessedRepo };
