import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { Product } from '../../products/entities/product.entity';

export enum SupportOrigin {
  MERCADO_LIVRE = 'mercado_livre',
  SHOPEE = 'shopee',
  AMAZON = 'amazon',
  OUTROS = 'outros'
}

export enum SupportType {
  PERGUNTA = 'pergunta',
  AVALIACAO = 'avaliacao'
}

export enum SupportStatus {
  NAO_RESPONDIDO = 'nao_respondido',
  RESPONDIDO = 'respondido',
  FECHADO = 'fechado'
}

@Entity('supports')
export class Support {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: SupportOrigin,
    default: SupportOrigin.MERCADO_LIVRE
  })
  origin: SupportOrigin;

  @Column({
    type: 'enum',
    enum: SupportType,
    default: SupportType.PERGUNTA
  })
  type: SupportType;

  @Column({
    type: 'enum',
    enum: SupportStatus,
    default: SupportStatus.NAO_RESPONDIDO
  })
  status: SupportStatus;

  @Column({ nullable: true })
  externalId: string; // ID do atendimento no marketplace

  @Column({ nullable: true })
  productExternalId: string; // ID do produto no marketplace

  @Column({ nullable: true })
  productTitle: string; // Título do produto/anúncio

  @Column({ nullable: true })
  customerName: string; // Nome do cliente

  @Column({ nullable: true })
  customerExternalId: string; // ID do cliente no marketplace

  @Column('text')
  question: string; // Pergunta ou comentário

  @Column('text', { nullable: true })
  answer: string; // Resposta

  @Column({ type: 'timestamp', nullable: true })
  questionDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  answerDate: Date;

  @Column({ default: true })
  canAnswer: boolean; // Se ainda pode responder

  @Column('jsonb', { nullable: true })
  metadata: any; // Dados extras do marketplace

  @ManyToOne(() => Store, { nullable: true })
  @JoinColumn({ name: 'storeId' })
  store: Store;

  @Column({ nullable: true })
  storeId: string;

  @ManyToOne(() => Product, { nullable: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ nullable: true })
  productId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
