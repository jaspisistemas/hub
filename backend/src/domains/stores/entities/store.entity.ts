import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  PrimaryGeneratedColumn, 
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../auth/entities/user.entity';
import { Company } from '../../companies/entities/company.entity';

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

  @Column({ type: 'varchar', length: 255, nullable: true })
  mlNickname?: string;

  @Column({ type: 'bigint', nullable: true })
  mlLastSyncAt?: number;

  // Chave estrangeira para Company
  @Column({ type: 'uuid' })
  companyId!: string;

  // Chave estrangeira para User (criador da loja, pode ser nulo)
  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  // Relacionamentos
  @ManyToOne(() => Company, company => company.stores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @ManyToOne(() => User, user => user.stores, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @OneToMany(() => Order, order => order.store)
  orders?: Order[];

  @OneToMany(() => Product, product => product.store)
  products?: Product[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
