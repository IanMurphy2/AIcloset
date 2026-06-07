import { randomBytes } from "crypto";
import type { Profile } from "passport-google-oauth20";
import { AppDataSource } from "../../dbConnection";
import { User } from "../models/User";

/**
 * Find an existing user by the email in a Google profile, or create one.
 *
 * `User.password` is NOT NULL and hashed in a @BeforeInsert hook, so for
 * Google-created accounts we assign a cryptographically random password.
 * This keeps the schema unchanged and effectively disables local login for
 * the account (no one knows the random value), while satisfying the NOT NULL
 * constraint and the hashing hook.
 */
export async function findOrCreateGoogleUser(profile: Profile): Promise<User> {
    const email = profile.emails?.[0]?.value;
    if (!email) {
        throw new Error("Google profile did not include an email address");
    }

    const repo = AppDataSource.getRepository(User);

    const existing = await repo.findOneBy({ email });
    if (existing) {
        return existing;
    }

    const user = repo.create({
        email,
        name: profile.displayName || email,
        password: randomBytes(32).toString("hex"),
    });
    await repo.save(user);

    return user;
}
