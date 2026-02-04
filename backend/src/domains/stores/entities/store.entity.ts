import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  PrimaryGeneratedColumn, 
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('stores')
export class Store {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 50 })
  marketplace!: string;

  @Column({ default: 'active' })
  status!: string;

  @Column({ type: 'int', default: 0 })
  productsCount!: number;

  @Column({ type: 'int', default: 0 })
  ordersCount!: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  revenue!: number;

  @Column({ default: true })
  active!: boolean;

  // Campos de integração com Mercado Livre
  @Column({ type: 'varchar', length: 500, nullable: true })
  mlAccessToken?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  mlRefreshToken?: string;

  @Column({ type: 'bigint', nullable: true })
  mlTokenExpiresAt?: number;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mlUserId?: string;

  // Relacionamentos
  @OneToMany(() => Order, order => order.store)
  orders?: Order[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
