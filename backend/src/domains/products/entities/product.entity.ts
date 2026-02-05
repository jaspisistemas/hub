import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ unique: true, length: 100 })
  sku!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'int', default: 0 })
  quantity!: number;

  @Column({ nullable: true, length: 100 })
  category?: string;

  @Column({ nullable: true, length: 100 })
  brand?: string;

  @Column({ nullable: true, length: 100 })
  model?: string;

  @Column({ default: true })
  active!: boolean;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'simple-array', nullable: true })
  imageUrls?: string[];

  @Column({ nullable: true, length: 500 })
  imageUrl?: string;

  @Column({ nullable: true, length: 100 })
  externalId?: string;

  @Column({ nullable: true, length: 50 })
  marketplace?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
