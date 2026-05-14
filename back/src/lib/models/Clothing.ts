import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, BaseEntity, ManyToOne, JoinColumn } from 'typeorm';
import { IsString, IsOptional, IsUrl } from 'class-validator';
import { User } from './User';

@Entity('clothing')
export class Clothing extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

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