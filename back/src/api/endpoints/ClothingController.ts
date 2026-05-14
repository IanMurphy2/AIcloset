import { Body, Controller, Delete, Get, Path, Post, Put, Query, Request, Route, Security, SuccessResponse, Tags } from "tsoa";
import { Clothing } from "../../lib/models/Clothing";
import { AppDataSource } from "../../dbConnection";
import { HttpError } from "../../lib/errors/HttpError";
import type { Request as ExRequest } from "express";

/** JWT payload attached by auth middleware */
interface AuthUser {
    id: string;
    email: string;
}

function getUserId(request: ExRequest): string {
    return (request.user as AuthUser).id;
}

@Route("clothing")
@Tags("Clothing")
@Security("jwt")
export class ClothingController extends Controller {
    @Get("/")
    public async getClothes(
        @Request() request: ExRequest,
        @Query() category?: string,
        @Query() color?: string
    ): Promise<Clothing[]> {
        const userId = getUserId(request);
        const repo = AppDataSource.getRepository(Clothing);

        const where: Record<string, unknown> = { userId };
        if (category) where.category = category;
        if (color) where.color = color;

        return await repo.find({ where });
    }

    @Get("/{id}")
    public async getClothingById(
        @Request() request: ExRequest,
        @Path() id: string
    ): Promise<Clothing> {
        const userId = getUserId(request);
        const repo = AppDataSource.getRepository(Clothing);
        const item = await repo.findOneBy({ id, userId });

        if (!item) {
            throw new HttpError(404, "Clothing item not found");
        }

        return item;
    }

    @Post("/")
    @SuccessResponse("201", "Created")
    public async createClothing(
        @Request() request: ExRequest,
        @Body() body: Partial<Clothing>
    ): Promise<Clothing> {
        const userId = getUserId(request);
        const repo = AppDataSource.getRepository(Clothing);
        const newItem = repo.create({ ...body, userId });

        this.setStatus(201);
        return await repo.save(newItem);
    }

    @Put("/{id}")
    public async updateClothing(
        @Request() request: ExRequest,
        @Path() id: string,
        @Body() body: Partial<Clothing>
    ): Promise<Clothing> {
        const userId = getUserId(request);
        const repo = AppDataSource.getRepository(Clothing);
        const item = await repo.findOneBy({ id, userId });

        if (!item) {
            throw new HttpError(404, "Clothing item not found");
        }

        repo.merge(item, body);
        return await repo.save(item);
    }

    @SuccessResponse("204", "Deleted")
    @Delete("/{id}")
    public async deleteClothing(
        @Request() request: ExRequest,
        @Path() id: string
    ): Promise<void> {
        const userId = getUserId(request);
        const repo = AppDataSource.getRepository(Clothing);
        const item = await repo.findOneBy({ id, userId });

        if (!item) {
            throw new HttpError(404, "Clothing item not found");
        }

        await repo.remove(item);
        this.setStatus(204);
    }
}