import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './entities/company.entity';
import { CompanyMember } from './entities/company-member.entity';
import { User } from '../auth/entities/user.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectRepository(Company)
    private companiesRepository: Repository<Company>,
    @InjectRepository(CompanyMember)
    private membersRepository: Repository<CompanyMember>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // CRUD de Empresa
  async create(data: Partial<Company>, userId: string) {
    const company = this.companiesRepository.create({
      ...data,
    });
    const savedCompany = await this.companiesRepository.save(company);

    // Adicionar o criador como owner
    await this.membersRepository.save({
      companyId: savedCompany.id,
      userId,
      role: 'owner',
      isActive: true,
      acceptedAt: new Date(),
    });

    // Atualizar user com a empresa
    await this.usersRepository.update(userId, { companyId: savedCompany.id });

    return savedCompany;
  }

  async findOne(id: string) {
    return this.companiesRepository.findOne({
      where: { id },
      relations: ['members', 'members.user', 'stores'],
    });
  }

  async findByUser(userId: string) {
    return this.companiesRepository
      .createQueryBuilder('company')
      .leftJoinAndSelect('company.members', 'members')
      .leftJoinAndSelect('members.user', 'user')
      .where('members.userId = :userId', { userId })
      .andWhere('members.isActive = :isActive', { isActive: true })
      .getMany();
  }

  async update(id: string, data: Partial<Company>) {
    await this.companiesRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: string) {
    return this.companiesRepository.delete(id);
  }

  // Gerenciar Colaboradores
  async addMember(companyId: string, email: string, role: string = 'member') {
    // Verificar se usuário existe
    let user = await this.usersRepository.findOne({ where: { email } });

    if (!user) {
      // Criar usuário com senha temporária
      user = this.usersRepository.create({
        email,
        name: email.split('@')[0],
        password: uuid(), // Senha aleatória, será resetada no primeiro login
      });
      user = await this.usersRepository.save(user);
    }

    // Verificar se já é membro
    const existing = await this.membersRepository.findOne({
      where: { companyId, userId: user.id },
    });

    if (existing) {
      throw new HttpException('Usuário já é membro da empresa', HttpStatus.CONFLICT);
    }

    // Criar convite
    const inviteToken = uuid();
    const member = await this.membersRepository.save({
      companyId,
      userId: user.id,
      role,
      isActive: false,
      inviteToken,
      inviteSentAt: new Date(),
    });

    return { member, inviteToken };
  }

  async acceptInvite(inviteToken: string) {
    const member = await this.membersRepository.findOne({
      where: { inviteToken },
      relations: ['user', 'company'],
    });

    if (!member) {
      throw new HttpException('Convite inválido', HttpStatus.NOT_FOUND);
    }

    member.isActive = true;
    member.acceptedAt = new Date();
    member.inviteToken = undefined;

    await this.membersRepository.save(member);

    // Atualizar user com companyId
    await this.usersRepository.update(member.userId, { companyId: member.companyId });

    return member;
  }

  async getMembers(companyId: string) {
    return this.membersRepository.find({
      where: { companyId, isActive: true },
      relations: ['user'],
    });
  }

  async updateMemberRole(memberId: string, role: string) {
    await this.membersRepository.update(memberId, { role });
    return this.membersRepository.findOne({
      where: { id: memberId },
      relations: ['user'],
    });
  }

  async removeMember(memberId: string) {
    return this.membersRepository.delete(memberId);
  }
}
