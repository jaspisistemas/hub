import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Store } from '../../stores/entities/store.entity';
import { CompanyMember } from '../../companies/entities/company-member.entity';
import { Company } from '../../companies/entities/company.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date;

  @Column({ nullable: true })
  emailVerificationToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationSentAt?: Date;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  role?: string; // Admin, Vendedor, Estoque, etc

  @Column({ nullable: true })
  companyName?: string;

  @Column({ nullable: true })
  cnpj?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ default: 'dark', nullable: true })
  theme?: string; // dark, light, auto

  @Column({ default: 'pt-BR', nullable: true })
  language?: string;

  @Column({ default: 'BRL', nullable: true })
  currency?: string;

  @Column({ default: 30, nullable: true })
  defaultDashboardPeriod?: number; // dias

  @Column({ default: true, nullable: true })
  notificationsEmail?: boolean;

  @Column({ default: true, nullable: true })
  notificationsSystem?: boolean;

  @Column({ nullable: true })
  lastLoginAt?: Date;

  @Column({ nullable: true })
  lastLoginIp?: string;

  @Column({ type: 'simple-json', nullable: true })
  loginHistory?: Array<{ date: Date; ip: string }>;

  // Relacionamentos
  @ManyToOne(() => Company, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company?: Company;

  @Column({ nullable: true })
  companyId?: string;

  @OneToMany(() => Store, store => store.user)
  stores?: Store[];

  @OneToMany(() => CompanyMember, member => member.user)
  companyMembers?: CompanyMember[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
