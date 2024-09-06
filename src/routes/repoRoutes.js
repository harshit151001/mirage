import express from "express";
import { ensureAuthenticated } from "../middleware/auth.js";
import * as repoController from "../controllers/repoController.js";

const router = express.Router();

router.get("/repos", ensureAuthenticated, repoController.getUserRepos);

router.get(
  "/repos/:owner/:repo",
  ensureAuthenticated,
  repoController.processRepo
);

router.get(
  "/processed-repos",
  ensureAuthenticated,
  repoController.getProcessedRepos
);

router.get(
  "/processed-repos/:repoId",
  ensureAuthenticated,
  repoController.getProcessedRepo
);

export default router;
