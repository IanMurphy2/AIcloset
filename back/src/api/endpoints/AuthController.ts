import { Body, Controller, Post, Route, Tags } from "tsoa";
import { IsEmail, IsString, MinLength, validate } from "class-validator";
import { User } from "../../lib/models/User";
import { AppDataSource } from "../../dbConnection";
import { HttpError } from "../../lib/errors/HttpError";
import jwt from "jsonwebtoken";
import config from "../../Config";

class RegisterRequest {
    @IsEmail(undefined, { message: "Invalid email format" })
    email: string;

    @IsString()
    @MinLength(8, { message: "Password must be at least 8 characters" })
    password: string;

    @IsString()
    @MinLength(1, { message: "Name is required" })
    name: string;
}

class LoginRequest {
    @IsEmail(undefined, { message: "Invalid email format" })
    email: string;

    @IsString()
    @MinLength(1, { message: "Password is required" })
    password: string;
}

interface AuthResponse {
    token: string;
    user: { id: string; email: string; name: string };
}

@Route("auth")
@Tags("Auth")
export class AuthController extends Controller {
    @Post("register")
    public async register(@Body() body: RegisterRequest): Promise<AuthResponse> {
        const errors = await validate(Object.assign(new RegisterRequest(), body));
        if (errors.length > 0) {
            const message = errors.map(e => Object.values(e.constraints || {})).flat().join("; ");
            throw new HttpError(400, message);
        }
        const repo = AppDataSource.getRepository(User);
        const existingUser = await repo.findOneBy({ email: body.email });
        if (existingUser) {
            throw new HttpError(409, "User already exists");
        }

        const user = repo.create({ email: body.email, password: body.password, name: body.name });
        await repo.save(user);

        const token = jwt.sign(
            { id: user.id, email: user.email },
            config.get("jwt.secret") as string,
            { expiresIn: config.get("jwt.expiresIn") as jwt.SignOptions["expiresIn"] }
        );

        this.setStatus(201);
        return { token, user: { id: user.id, email: user.email, name: user.name } };
    }

    @Post("login")
    public async login(@Body() body: LoginRequest): Promise<AuthResponse> {
        const errors = await validate(Object.assign(new LoginRequest(), body));
        if (errors.length > 0) {
            const message = errors.map(e => Object.values(e.constraints || {})).flat().join("; ");
            throw new HttpError(400, message);
        }
        const repo = AppDataSource.getRepository(User);
        const user = await repo.findOneBy({ email: body.email });
        if (!user) {
            throw new HttpError(401, "Invalid email or password");
        }

        const isValid = await user.comparePassword(body.password);
        if (!isValid) {
            throw new HttpError(401, "Invalid email or password");
        }

        const token = jwt.sign(
            { id: user.id, email: user.email },
            config.get("jwt.secret") as string,
            { expiresIn: config.get("jwt.expiresIn") as jwt.SignOptions["expiresIn"] }
        );

        return { token, user: { id: user.id, email: user.email, name: user.name } };
    }
}