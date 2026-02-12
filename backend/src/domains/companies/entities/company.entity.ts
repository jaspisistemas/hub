import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CompanyMember } from './company-member.entity';
import { Store } from '../../stores/entities/store.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  cnpj?: string;

  @Column({ nullable: true })
  logoUrl?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  state?: string;

  @Column({ nullable: true })
  zipCode?: string;

  @Column({ default: 'active' })
  status!: string; // active, inactive, suspended

  @Column({ type: 'simple-json', nullable: true })
  settings?: Record<string, any>;

  @OneToMany(() => CompanyMember, member => member.company, { cascade: true })
  members!: CompanyMember[];

  @OneToMany(() => Store, store => store.company)
  stores!: Store[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
