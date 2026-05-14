import * as express from "express";
import jwt from "jsonwebtoken";
import config from "../../Config";
import { HttpError } from "../../lib/errors/HttpError";

export function expressAuthentication(
    request: express.Request,
    securityName: string,
    _scopes?: string[]
): Promise<any> {
    if (securityName !== "jwt") {
        return Promise.reject(new HttpError(500, "Unknown security strategy"));
    }

    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return Promise.reject(new HttpError(401, "No token provided"));
    }

    const token = authHeader.split(" ")[1];

    return new Promise((resolve, reject) => {
        jwt.verify(token, config.get("jwt.secret") as string, (err, decoded) => {
            if (err) {
                return reject(new HttpError(401, "Invalid or expired token"));
            }
            resolve(decoded);
        });
    });
}
