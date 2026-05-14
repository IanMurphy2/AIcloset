import { Body, Controller, Delete, Get, Path, Post, Put, Query, Route, SuccessResponse, Tags } from "tsoa";
import { Clothing } from "../../lib/models/Clothing";
import { AppDataSource } from "../../dbConnection";

@Route("clothing")
@Tags("Clothing")
export class ClothingController extends Controller {
    @Get("/")
    public async getClothes(
        @Query() category?: string,
        @Query() color?: string
    ): Promise<Clothing[]> {
        const repo = AppDataSource.getRepository(Clothing);

        const query: any = {};
        if (category) query.category = category;
        if (color) query.color = color;

        return await repo.find({ where: query });
    }

    @Get("/{id}")
    public async getClothingById(
        @Path() id: string
    ): Promise<Clothing> {
        const repo = AppDataSource.getRepository(Clothing);
        const item = await repo.findOneBy({ id });

        if (!item) {
            this.setStatus(404);
            throw new Error("Clothing item not found");
        }

        return item;
    }

    @SuccessResponse("201", "Created")
    @Post("/")
    public async createClothing(
        @Body() body: Partial<Clothing>
    ): Promise<Clothing> {
        const repo = AppDataSource.getRepository(Clothing);
        const newItem = repo.create(body);

        this.setStatus(201);
        return await repo.save(newItem);
    }

    @Put("/{id}")
    public async updateClothing(
        @Path() id: string,
        @Body() body: Partial<Clothing>
    ): Promise<Clothing> {
        const repo = AppDataSource.getRepository(Clothing);
        const item = await repo.findOneBy({ id });

        if (!item) {
            this.setStatus(404);
            throw new Error("Clothing item not found");
        }

        repo.merge(item, body);
        return await repo.save(item);
    }

    @SuccessResponse("204", "Deleted")
    @Delete("/{id}")
    public async deleteClothing(
        @Path() id: string
    ): Promise<void> {
        const repo = AppDataSource.getRepository(Clothing);
        const item = await repo.findOneBy({ id });

        if (!item) {
            this.setStatus(404);
            throw new Error("Clothing item not found");
        }

        await repo.remove(item);
        this.setStatus(204);
    }
}