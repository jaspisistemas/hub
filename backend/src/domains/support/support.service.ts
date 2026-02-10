import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Support, SupportStatus } from './entities/support.entity';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { FilterSupportDto } from './dto/filter-support.dto';
import { AnswerSupportDto } from './dto/answer-support.dto';
import { MarketplaceService } from '../../integrations/marketplace/marketplace.service';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(Support)
    private supportRepository: Repository<Support>,
    private marketplaceService: MarketplaceService,
  ) {}

  async create(createSupportDto: CreateSupportDto): Promise<Support> {
    const support = this.supportRepository.create(createSupportDto);
    return this.supportRepository.save(support);
  }

  async findAll(filters: FilterSupportDto): Promise<Support[]> {
    const where: any = {};

    if (filters.origin) {
      where.origin = filters.origin;
    }

    if (filters.type) {
      where.type = filters.type;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.storeId) {
      where.storeId = filters.storeId;
    }

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.search) {
      where.question = Like(`%${filters.search}%`);
    }

    return this.supportRepository.find({
      where,
      relations: ['store', 'product'],
      order: { questionDate: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Support> {
    const support = await this.supportRepository.findOne({
      where: { id },
      relations: ['store', 'product'],
    });

    if (!support) {
      throw new NotFoundException(`Support with ID ${id} not found`);
    }

    return support;
  }

  async update(id: string, updateSupportDto: UpdateSupportDto): Promise<Support> {
    const support = await this.findOne(id);
    Object.assign(support, updateSupportDto);
    return this.supportRepository.save(support);
  }

  async answer(id: string, answerDto: AnswerSupportDto, userId: string): Promise<Support> {
    const support = await this.findOne(id);

    if (!support.canAnswer) {
      throw new BadRequestException('Não é mais possível responder este atendimento');
    }

    // Enviar resposta para o marketplace
    try {
      if (support.type === SupportType.MENSAGEM_VENDA && support.packId) {
        // Enviar mensagem de venda
        await this.marketplaceService.sendOrderMessage(
          support.storeId,
          support.packId,
          answerDto.answer,
        );
      } else {
        // Enviar resposta de pergunta
        await this.marketplaceService.answerQuestion(
          support.storeId,
          support.externalId,
          answerDto.answer,
        );
      }

      support.answer = answerDto.answer;
      support.answerDate = new Date();
      support.status = SupportStatus.RESPONDIDO;

      return this.supportRepository.save(support);
    } catch (error) {
      throw new BadRequestException('Erro ao enviar resposta para o marketplace: ' + error.message);
    }
  }

  async syncFromMarketplace(storeId: string): Promise<{ imported: number; updated: number }> {
    console.log(`\n🔄 Iniciando sincronização para loja: ${storeId}`);
    
    // Buscar perguntas do marketplace
    const questions = await this.marketplaceService.getQuestions(storeId);
    console.log(`📝 Perguntas encontradas: ${questions?.length || 0}`);
    
    // Buscar mensagens de vendas do marketplace
    console.log(`⏳ Buscando mensagens de pós-venda...`);
    let messages = [];
    try {
      messages = await this.marketplaceService.getOrderMessages(storeId);
      console.log(`💬 Mensagens de pós-venda encontradas: ${messages?.length || 0}`);
      if (messages?.length > 0) {
        console.log(`📋 Primeiras mensagens:`, JSON.stringify(messages.slice(0, 2), null, 2));
      }
    } catch (error) {
      console.error(`❌ Erro ao buscar mensagens de pós-venda:`, error.message);
      messages = [];
    }
    
    let imported = 0;
    let updated = 0;

    // Processar perguntas
    for (const question of questions) {
      const existing = await this.supportRepository.findOne({
        where: { externalId: question.id },
      });

      if (existing) {
        // Atualizar se houver mudanças
        if (question.answer && !existing.answer) {
          existing.answer = question.answer.text;
          existing.answerDate = new Date(question.answer.date_created);
          existing.status = SupportStatus.RESPONDIDO;
          await this.supportRepository.save(existing);
          updated++;
        }
      } else {
        // Criar novo
        const support = this.supportRepository.create({
          origin: question.origin,
          type: question.type,
          externalId: question.id,
          productExternalId: question.item_id,
          productTitle: question.item_title,
          customerName: question.from?.nickname || 'Anônimo',
          customerExternalId: question.from?.id?.toString(),
          question: question.text,
          questionDate: new Date(question.date_created),
          canAnswer: question.status === 'UNANSWERED',
          status: question.answer ? SupportStatus.RESPONDIDO : SupportStatus.NAO_RESPONDIDO,
          answer: question.answer?.text,
          answerDate: question.answer ? new Date(question.answer.date_created) : null,
          storeId,
          metadata: question,
        });

        await this.supportRepository.save(support);
        imported++;
      }
    }

    // Processar mensagens de vendas
    console.log(`\n📨 Processando ${messages.length} mensagens de pós-venda...`);
    for (const message of messages) {
      console.log(`  Verificando mensagem: packId=${message.packId}, cliente=${message.customerName}`);
      
      const existing = await this.supportRepository.findOne({
        where: { packId: message.packId },
      });

      if (existing) {
        console.log(`    ✏️ Mensagem já existe (ID: ${existing.id})`);
        // Atualizar última mensagem se houver nova
        if (message.lastMessage && message.lastMessage !== existing.question) {
          existing.question = message.lastMessage;
          existing.questionDate = new Date(message.lastMessageDate);
          await this.supportRepository.save(existing);
          updated++;
          console.log(`    ✅ Mensagem atualizada`);
        }
      } else {
        console.log(`    🆕 Criando nova mensagem de pós-venda`);
        // Criar novo
        const support = this.supportRepository.create({
          origin: message.origin,
          type: SupportType.MENSAGEM_VENDA,
          externalId: message.packId,
          packId: message.packId,
          orderExternalId: message.orderId,
          productTitle: message.orderTitle || 'Pedido',
          customerName: message.customerName || 'Cliente',
          customerExternalId: message.customerId,
          question: message.lastMessage,
          questionDate: new Date(message.lastMessageDate),
          canAnswer: true,
          status: SupportStatus.NAO_RESPONDIDO,
          storeId,
          metadata: message,
        });

        const saved = await this.supportRepository.save(support);
        imported++;
        console.log(`    ✅ Mensagem criada (ID: ${saved.id})`);
      }
    }

    console.log(`\n✨ Sincronização concluída! Importadas: ${imported}, Atualizadas: ${updated}\n`);
    return { imported, updated };
  }

  async remove(id: string): Promise<void> {
    const support = await this.findOne(id);
    await this.supportRepository.remove(support);
  }
}
