import { Strategy as GitHubStrategy } from "passport-github2";

const configurePassport = (passport, prisma) => {
	passport.use(
		new GitHubStrategy(
			{
				clientID: process.env.GITHUB_CLIENT_ID,
				clientSecret: process.env.GITHUB_CLIENT_SECRET,
				callbackURL: "http://localhost:8000/auth/github/callback",
			},
			async (accessToken, refreshToken, profile, done) => {
				try {
					let user = await prisma.user.findUnique({
						where: { githubId: profile.id },
					});
					if (!user) {
						user = await prisma.user.create({
							data: {
								githubId: profile.id,
								username: profile.username,
								accessToken: accessToken,
							},
						});
					} else {
						user = await prisma.user.update({
							where: { id: user.id },
							data: { accessToken: accessToken },
						});
					}
					return done(null, user);
				} catch (error) {
					return done(error, null);
				}
			}
		)
	);

	passport.serializeUser((user, done) => {
		done(null, user.id);
	});

	passport.deserializeUser(async (id, done) => {
		try {
			const user = await prisma.user.findUnique({ where: { id } });
			done(null, user);
		} catch (error) {
			done(error, null);
		}
	});
};

export { configurePassport };
