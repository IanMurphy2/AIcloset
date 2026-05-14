import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { IsString, IsOptional, IsUrl } from 'class-validator';

@Entity('clothing')
export class Clothing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsUrl()
  imageUrl: string;

  @Column()
  @IsString()
  description: string;

  @Column({ nullable: true })
  @IsOptional()
  category?: string; // Ejemplo: 'remeras', 'pantalones'

  @Column({ nullable: true })
  @IsOptional()
  color?: string;

  @CreateDateColumn()
  createdAt: Date;
}