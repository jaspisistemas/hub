import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from '../../orders/entities/order.entity';

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  orderId!: string;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order!: Order;

  @Column({ type: 'varchar', length: 50, nullable: true })
  number?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  series?: string;

  @Column({ type: 'varchar', length: 44, nullable: true, unique: true })
  accessKey?: string;

  @Column({ type: 'text', nullable: true })
  xmlContent?: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  pdfUrl?: string;

  @Column({ type: 'timestamp', nullable: true })
  issueDate?: Date;

  @Column({ type: 'varchar', length: 50, default: 'pending' })
  status!: string; // pending, generated, sent, failed

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @Column({ type: 'boolean', default: false })
  sentToMarketplace!: boolean;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
