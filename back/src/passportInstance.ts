import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { AppDataSource } from "./dbConnection";
import { User } from "./lib/models/User";
import config from "./Config";
import { findOrCreateGoogleUser } from "./lib/auth/googleUser";

passport.use(
    new LocalStrategy(
        { usernameField: "email", passwordField: "password" },
        async (email, password, done) => {
            try {
                const repo = AppDataSource.getRepository(User);
                const user = await repo.findOneBy({ email });

                if (!user) {
                    return done(null, false, { message: "Invalid email or password" });
                }

                const isValid = await user.comparePassword(password);
                if (!isValid) {
                    return done(null, false, { message: "Invalid email or password" });
                }

                return done(null, user);
            } catch (err) {
                return done(err);
            }
        }
    )
);

// Register the Google strategy only when credentials are configured, so the
// app can still boot in dev/test environments without OAuth credentials.
const googleClientId = config.get("google.clientId") as string;
const googleClientSecret = config.get("google.clientSecret") as string;

if (googleClientId && googleClientSecret) {
    passport.use(
        new GoogleStrategy(
            {
                clientID: googleClientId,
                clientSecret: googleClientSecret,
                callbackURL: config.get("google.callbackUrl") as string,
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const user = await findOrCreateGoogleUser(profile);
                    return done(null, user);
                } catch (err) {
                    return done(err as Error);
                }
            }
        )
    );
}

export default passport;
