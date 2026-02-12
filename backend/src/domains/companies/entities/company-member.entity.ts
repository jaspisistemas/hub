import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from './company.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('company_members')
export class CompanyMember {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  companyId!: string;

  @Column()
  userId!: string;

  @Column({ default: 'member' })
  role!: string; // owner, admin, manager, member

  @Column({ type: 'text', nullable: true })
  permissions?: string; // JSON string com permissões customizadas

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  inviteToken?: string; // Token para convite pendente

  @Column({ nullable: true })
  inviteSentAt?: Date;

  @Column({ nullable: true })
  acceptedAt?: Date;

  @ManyToOne(() => Company, company => company.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
