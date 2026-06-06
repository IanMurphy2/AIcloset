import { Body, Controller, Delete, Get, Path, Post, Put, Request, Route, Security, SuccessResponse, Tags } from "tsoa";
import { In } from "typeorm";
import { AppDataSource } from "../../dbConnection";
import { Outfit } from "../../lib/models/Outfit";
import { OutfitItem } from "../../lib/models/OutfitItem";
import { Clothing } from "../../lib/models/Clothing";
import { HttpError } from "../../lib/errors/HttpError";
import { isValidSlot } from "../../lib/constants/outfitSlots";
import type { Request as ExRequest } from "express";

/** JWT payload attached by auth middleware */
interface AuthUser {
    id: string;
    email: string;
}

function getUserId(request: ExRequest): string {
    return (request.user as AuthUser).id;
}

interface OutfitItemInput {
    clothingId: string;
    category: string;
}

interface OutfitRequest {
    name: string;
    description: string;
    isPublic?: boolean;
    items: OutfitItemInput[];
}

interface OutfitItemResponse {
    clothingId: string;
    imageUrl: string;
    category: string;
    position: number;
}

interface OutfitResponse {
    id: string;
    name: string;
    description: string;
    isPublic: boolean;
    items: OutfitItemResponse[];
    createdAt: Date;
    updatedAt: Date;
}

function toOutfitResponse(outfit: Outfit): OutfitResponse {
    const items = (outfit.items ?? [])
        .slice()
        .sort((a, b) => a.position - b.position)
        .map(item => ({
            clothingId: item.clothingId,
            imageUrl: item.clothing?.imageUrl,
            category: item.category,
            position: item.position,
        }));

    return {
        id: outfit.id,
        name: outfit.name,
        description: outfit.description,
        isPublic: outfit.isPublic,
        items,
        createdAt: outfit.createdAt,
        updatedAt: outfit.updatedAt,
    };
}

/**
 * Validates the request items and loads the corresponding clothing for the user.
 * Throws HttpError(400) on invalid slot, duplicate slot, or missing/foreign clothing.
 */
async function validateItems(items: OutfitItemInput[], userId: string): Promise<void> {
    const seenSlots = new Set<string>();
    for (const item of items) {
        if (!isValidSlot(item.category)) {
            throw new HttpError(400, `Invalid category slot: ${item.category}`);
        }
        if (seenSlots.has(item.category)) {
            throw new HttpError(400, `Duplicate category slot: ${item.category}. Only one item per category is allowed`);
        }
        seenSlots.add(item.category);
    }

    const clothingIds = items.map(i => i.clothingId);
    if (clothingIds.length > 0) {
        const clothingRepo = AppDataSource.getRepository(Clothing);
        const clothingItems = await clothingRepo.findBy({ id: In(clothingIds), userId });
        const foundIds = new Set(clothingItems.map(c => c.id));
        const uniqueRequestedIds = new Set(clothingIds);
        if (foundIds.size !== uniqueRequestedIds.size) {
            throw new HttpError(400, "One or more clothing items not found or do not belong to you");
        }
    }
}

function buildOutfitItems(items: OutfitItemInput[]): OutfitItem[] {
    const itemRepo = AppDataSource.getRepository(OutfitItem);
    return items.map((item, index) =>
        itemRepo.create({
            clothingId: item.clothingId,
            category: item.category,
            position: index,
        })
    );
}

@Route("outfit")
@Tags("Outfit")
@Security("jwt")
export class OutfitController extends Controller {

    @Get("/")
    public async getOutfits(@Request() request: ExRequest): Promise<OutfitResponse[]> {
        const userId = getUserId(request);
        const repo = AppDataSource.getRepository(Outfit);
        const outfits = await repo.find({ where: { userId }, relations: ["items", "items.clothing"] });
        return outfits.map(toOutfitResponse);
    }

    @Get("/{id}")
    public async getOutfitById(@Request() request: ExRequest, @Path() id: string): Promise<OutfitResponse> {
        const userId = getUserId(request);
        const repo = AppDataSource.getRepository(Outfit);
        const outfit = await repo.findOne({ where: { id, userId }, relations: ["items", "items.clothing"] });
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

        await validateItems(body.items, userId);

        const outfit = outfitRepo.create({
            userId,
            name: body.name,
            description: body.description,
            isPublic: body.isPublic ?? false,
            items: buildOutfitItems(body.items),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        this.setStatus(201);
        const saved = await outfitRepo.save(outfit);
        const reloaded = await outfitRepo.findOne({
            where: { id: saved.id, userId },
            relations: ["items", "items.clothing"],
        });
        return toOutfitResponse(reloaded ?? saved);
    }

    @Put("/{id}")
    public async updateOutfit(
        @Request() request: ExRequest,
        @Path() id: string,
        @Body() body: OutfitRequest
    ): Promise<OutfitResponse> {
        const userId = getUserId(request);
        const outfitRepo = AppDataSource.getRepository(Outfit);
        const itemRepo = AppDataSource.getRepository(OutfitItem);

        const outfit = await outfitRepo.findOne({ where: { id, userId }, relations: ["items"] });
        if (!outfit) {
            throw new HttpError(404, "Outfit not found");
        }

        await validateItems(body.items, userId);

        // Replace the items: remove the old ones and assign the new ones with position = index.
        if (outfit.items && outfit.items.length > 0) {
            await itemRepo.remove(outfit.items);
        }

        outfit.name = body.name;
        outfit.description = body.description;
        if (body.isPublic !== undefined) {
            outfit.isPublic = body.isPublic;
        }
        outfit.items = buildOutfitItems(body.items);
        outfit.updatedAt = new Date();

        await outfitRepo.save(outfit);
        const reloaded = await outfitRepo.findOne({
            where: { id, userId },
            relations: ["items", "items.clothing"],
        });
        return toOutfitResponse(reloaded ?? outfit);
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
