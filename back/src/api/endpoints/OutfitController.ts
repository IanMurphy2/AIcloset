import { Body, Controller, Delete, Get, Path, Post, Put, Request, Route, Security, SuccessResponse, Tags } from "tsoa";
import { In } from "typeorm";
import { AppDataSource } from "../../dbConnection";
import { Outfit } from "../../lib/models/Outfit";
import { Clothing } from "../../lib/models/Clothing";
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

interface OutfitRequest {
    name: string;
    description: string;
    clothingIds: string[];
}

interface ClothingSummary {
    id: string;
    imageUrl: string;
}

interface OutfitResponse {
    id: string;
    name: string;
    description: string;
    clothing: ClothingSummary[];
    createdAt: Date;
    updatedAt: Date;
}

function toOutfitResponse(outfit: Outfit): OutfitResponse {
    return {
        id: outfit.id,
        name: outfit.name,
        description: outfit.description,
        clothing: (outfit.clothing ?? []).map(c => ({ id: c.id, imageUrl: c.imageUrl })),
        createdAt: outfit.createdAt,
        updatedAt: outfit.updatedAt,
    };
}

@Route("outfit")
@Tags("Outfit")
@Security("jwt")
export class OutfitController extends Controller {

    @Get("/")
    public async getOutfits(@Request() request: ExRequest): Promise<OutfitResponse[]> {
        const userId = getUserId(request);
        const repo = AppDataSource.getRepository(Outfit);
        const outfits = await repo.find({ where: { userId }, relations: ["clothing"] });
        return outfits.map(toOutfitResponse);
    }

    @Get("/{id}")
    public async getOutfitById(@Request() request: ExRequest, @Path() id: string): Promise<OutfitResponse> {
        const userId = getUserId(request);
        const repo = AppDataSource.getRepository(Outfit);
        const outfit = await repo.findOne({ where: { id, userId }, relations: ["clothing"] });
        if (!outfit) {
            throw new HttpError(404, "Outfit not found");
        }
        return toOutfitResponse(outfit);
    }

    @Post("/")
    @SuccessResponse("201", "Created")
    public async createOutfit(@Request() request: ExRequest, @Body() body: OutfitRequest): Promise<OutfitResponse> {
        const userId = getUserId(request);
        const outfitRepo = AppDataSource.getRepository(Outfit);
        const clothingRepo = AppDataSource.getRepository(Clothing);

        const clothingItems = await clothingRepo.findBy({ id: In(body.clothingIds), userId });
        if (clothingItems.length !== body.clothingIds.length) {
            throw new HttpError(400, "One or more clothing items not found or do not belong to you");
        }

        const outfit = outfitRepo.create({
            userId,
            name: body.name,
            description: body.description,
            clothing: clothingItems,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        this.setStatus(201);
        const saved = await outfitRepo.save(outfit);
        return toOutfitResponse(saved);
    }

    @Put("/{id}")
    public async updateOutfit(
        @Request() request: ExRequest,
        @Path() id: string,
        @Body() body: OutfitRequest
    ): Promise<OutfitResponse> {
        const userId = getUserId(request);
        const outfitRepo = AppDataSource.getRepository(Outfit);
        const clothingRepo = AppDataSource.getRepository(Clothing);

        const outfit = await outfitRepo.findOne({ where: { id, userId }, relations: ["clothing"] });
        if (!outfit) {
            throw new HttpError(404, "Outfit not found");
        }

        const clothingItems = await clothingRepo.findBy({ id: In(body.clothingIds), userId });
        if (clothingItems.length !== body.clothingIds.length) {
            throw new HttpError(400, "One or more clothing items not found or do not belong to you");
        }

        outfit.name = body.name;
        outfit.description = body.description;
        outfit.clothing = clothingItems;
        outfit.updatedAt = new Date();

        const saved = await outfitRepo.save(outfit);
        return toOutfitResponse(saved);
    }

    @Delete("/{id}")
    @SuccessResponse("204", "Deleted")
    public async deleteOutfit(@Request() request: ExRequest, @Path() id: string): Promise<void> {
        const userId = getUserId(request);
        const repo = AppDataSource.getRepository(Outfit);
        const outfit = await repo.findOneBy({ id, userId });
        if (!outfit) {
            throw new HttpError(404, "Outfit not found");
        }
        await repo.remove(outfit);
        this.setStatus(204);
    }
}