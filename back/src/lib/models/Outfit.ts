import { BaseEntity, Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Clothing } from "./Clothing";
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

    @ManyToMany(() => Clothing)
    @JoinTable()
    clothing: Clothing[];

    @Column()
    createdAt: Date;

    @Column()
    updatedAt: Date;
}