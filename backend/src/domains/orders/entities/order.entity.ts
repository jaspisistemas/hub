import { 
  Column, 
  CreateDateColumn, 
  Entity, 
  PrimaryGeneratedColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Store } from '../../stores/entities/store.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  externalId!: string;

  @Column({ nullable: true })
  externalOrderId?: string;

  @Column({ nullable: true })
  externalShipmentId?: string;

  @Column({ nullable: true })
  externalPackId?: string;

  @Column()
  marketplace!: string;

  @Column({ default: 'pending' })
  status!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total!: number;

  @Column({ type: 'text', nullable: true })
  rawData?: string | null;

  // Dados do cliente embutidos no pedido
  @Column({ length: 255 })
  customerName!: string;

  @Column({ length: 255, nullable: true })
  customerEmail?: string;

  @Column({ nullable: true, length: 20 })
  customerPhone?: string;

  @Column({ nullable: true, length: 100 })
  customerCity?: string;

  @Column({ nullable: true, length: 10 })
  customerState?: string;

  @Column({ nullable: true, type: 'text' })
  customerAddress?: string;

  @Column({ nullable: true, length: 20 })
  customerZipCode?: string;

  // Data de criação do pedido no marketplace (quando o pedido foi realmente feito)
  @Column({ nullable: true, type: 'timestamp' })
  orderCreatedAt?: Date;

  // Relacionamento com loja
  @Column({ nullable: true })
  storeId?: string;

  @ManyToOne(() => Store, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'storeId' })
  store?: Store;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
