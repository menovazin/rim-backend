import { Column, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class SeedVersion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  version: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
