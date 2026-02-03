import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  marketplace!: string;

  @Column()
  status!: string;

  @Column({ type: 'int', default: 0 })
  productsCount!: number;

  @Column({ type: 'int', default: 0 })
  ordersCount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  revenue!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
