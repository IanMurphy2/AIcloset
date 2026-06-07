import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Clothing } from "./Clothing";
import { Outfit } from "./Outfit";

@Entity('outfit_item')
export class OutfitItem extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'outfit_id' })
    outfitId: string;

    @ManyToOne(() => Outfit, outfit => outfit.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'outfit_id' })
    outfit: Outfit;

    @Column({ name: 'clothing_id' })
    clothingId: string;

    @ManyToOne(() => Clothing, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'clothing_id' })
    clothing: Clothing;

    @Column()
    category: string;

    @Column({ type: 'int' })
    position: number;
}
