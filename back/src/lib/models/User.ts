import { BaseEntity, BeforeInsert, Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { IsEmail, IsString } from "class-validator";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

@Entity('user')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    @IsEmail()
    email: string;

    @Column()
    password: string;

    @Column()
    @IsString()
    name: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @BeforeInsert()
    async hashPassword() {
        this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    }

    async comparePassword(plaintext: string): Promise<boolean> {
        return bcrypt.compare(plaintext, this.password);
    }
}