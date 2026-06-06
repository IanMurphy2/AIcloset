import { BaseEntity, Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { OutfitItem } from "./OutfitItem";
import { User } from "./User";

@Entity('outfit')
export class Outfit extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id' })
    userId: string;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;

    @Column()
    name: string;

    @Column()
    description: string;

    @Column({ default: false })
    isPublic: boolean;

    @OneToMany(() => OutfitItem, item => item.outfit, { cascade: true })
    items: OutfitItem[];

    @Column()
    createdAt: Date;

    @Column()
    updatedAt: Date;
}
