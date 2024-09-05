import express from "express";
import passport from "passport";
import { ensureAuthenticated } from "../middleware/auth.js";

const router = express.Router();

router.get("/github", passport.authenticate("github", { scope: ["repo"] }));

router.get(
	"/github/callback",
	passport.authenticate("github", { failureRedirect: "/login" }),
	(req, res) => {
		res.redirect("http://localhost:5173");
	}
);

router.get("/status", ensureAuthenticated, (req, res) => {
	res.status(200).json({ status: "Authenticated", user: req.user });
});

router.get("/logout", (req, res, next) => {
	req.logout((err) => {
		if (err) {
			return next(err);
		}
		res.status(200).redirect("/");
	});
});

export default router;