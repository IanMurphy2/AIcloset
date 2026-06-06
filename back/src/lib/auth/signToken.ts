import jwt from "jsonwebtoken";
import config from "../../Config";
import { User } from "../models/User";

/**
 * Shared JWT signing used by both the local login (AuthController) and the
 * Google OAuth callback so the token payload/options never diverge.
 */
export function signToken(user: Pick<User, "id" | "email">): string {
    return jwt.sign(
        { id: user.id, email: user.email },
        config.get("jwt.secret") as string,
        { expiresIn: config.get("jwt.expiresIn") as jwt.SignOptions["expiresIn"] }
    );
}
