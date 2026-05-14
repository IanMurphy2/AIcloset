import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { AppDataSource } from "./dbConnection";
import { User } from "./lib/models/User";

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

export default passport;
