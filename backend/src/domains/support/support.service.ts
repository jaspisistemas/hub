import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, MoreThanOrEqual } from 'typeorm';
import { Support, SupportStatus, SupportType, SupportOrigin } from './entities/support.entity';
import { CreateSupportDto } from './dto/create-support.dto';
import { UpdateSupportDto } from './dto/update-support.dto';
import { FilterSupportDto } from './dto/filter-support.dto';
import { AnswerSupportDto } from './dto/answer-support.dto';
import { MarketplaceService } from '../../integrations/marketplace/marketplace.service';
import { StoresService } from '../stores/stores.service';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(Support)
    private supportRepository: Repository<Support>,
    private marketplaceService: MarketplaceService,
    @Inject(forwardRef(() => StoresService))
    private storesService: StoresService,
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

    if (filters.storeId && filters.storeId !== '0') {
      where.storeId = filters.storeId;
    }

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.search) {
      where.question = Like(`%${filters.search}%`);
    }

    // Log para debug
    console.log(`\n[FINDALL] Filtros recebidos:`, filters);
    console.log(`[FINDALL] daysRange value:`, filters.daysRange, `type:`, typeof filters.daysRange);

    // Filtrar por período - padrão é 30 dias se não especificado
    const daysRange = filters.daysRange ?? 30; // Se for 0, significa "Todos"
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - daysRange);

    console.log(`\n🔍 Buscando atendimentos com filtros:`, {
      storeId: filters.storeId || 'todos',
      type: filters.type || 'todos',
      status: filters.status || 'todos',
      daysRange: daysRange === 0 ? 'TODOS OS TEMPOS' : `${daysRange} dias`,
      dataMinima: daysRange === 0 ? 'nenhuma' : dateLimit.toISOString(),
    });

    const whereCondition = daysRange === 0 
      ? where 
      : {
          ...where,
          questionDate: MoreThanOrEqual(dateLimit),
        };

    const results = await this.supportRepository.find({
      where: whereCondition,
      relations: ['store', 'product'],
      order: { questionDate: 'DESC' },
    });

    console.log(`📊 Resultados encontrados: ${results.length}`);
    results.forEach((r, idx) => {
      console.log(`  ${idx + 1}. ID: ${r.id}, Tipo: ${r.type}, Loja: ${r.storeId}, Data: ${r.questionDate}`);
    });

    return results;
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
    } catch (error: any) {
      throw new BadRequestException('Erro ao enviar resposta para o marketplace: ' + (error?.message || String(error)));
    }
  }

  async syncFromMarketplace(storeId: string): Promise<{ imported: number; updated: number }> {
    console.log(`\n🔄 Iniciando sincronização para loja: ${storeId}`);
    
    // Limpar perguntas antigas (mais de 30 dias)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const deletedCount = await this.supportRepository
      .createQueryBuilder()
      .delete()
      .from(Support)
      .where('storeId = :storeId', { storeId })
      .andWhere('questionDate < :thirtyDaysAgo', { thirtyDaysAgo })
      .execute();
    
    if (deletedCount?.affected && deletedCount.affected > 0) {
      console.log(`🗑️  ${deletedCount.affected} pergunta(s) antiga(s) removida(s)`);
    }
    
    // Buscar perguntas do marketplace
    const questions = await this.marketplaceService.getQuestions(storeId);
    console.log(`📝 Perguntas encontradas: ${questions?.length || 0}`);
    questions?.forEach((q, idx) => {
      console.log(`  ${idx + 1}. ID: ${q.id}, Cliente: ${q.from?.nickname}, Data: ${q.date_created}`);
    });
    
    // ⚠️ IMPORTANTE: Mensagens de pós-venda NÃO podem ser buscadas via API REST
    // Elas só chegam via WEBHOOK quando o cliente envia uma mensagem
    // O webhook já está configurado em marketplace.controller.ts
    console.log(`\n💡 Mensagens de pós-venda: Disponíveis apenas via WEBHOOK`);
    console.log(`   Configure webhooks no ML para receber mensagens em tempo real`);
    console.log(`   URL: https://seu-dominio.com/marketplace/mercadolivre/webhook`);
    console.log(`   Tópico: "messages"\n`);
    
    const messages: any[] = []; // Não buscar mais, só via webhook
    
    let imported = 0;
    let updated = 0;

    // Processar perguntas
    for (const question of questions) {
      const existing = await this.supportRepository.findOne({
        where: { externalId: question.id },
      });

      if (existing) {
        // Atualizar se houver mudanças
        let hasChanges = false;
        
        if (question.answer && !existing.answer) {
          existing.answer = question.answer.text;
          existing.answerDate = new Date(question.answer.date_created);
          existing.status = SupportStatus.RESPONDIDO;
          hasChanges = true;
        }
        
        // Atualizar canAnswer baseado no status atual
        const newCanAnswer = question.status !== 'CLOSED' && question.status !== 'CLOSED_UNANSWERED';
        if (existing.canAnswer !== newCanAnswer) {
          existing.canAnswer = newCanAnswer;
          hasChanges = true;
        }
        
        if (hasChanges) {
          await this.supportRepository.save(existing);
          updated++;
        }
      } else {
        // Criar novo
        console.log(`[SYNC] Nova pergunta - ID: ${question.id}`);
        console.log(`       Estrutura de 'from':`, JSON.stringify(question.from, null, 2));
        
        // Tentar obter nome real do cliente - de múltiplos campos, com fallback
        let customerName = question.from?.nickname || 
                          question.from?.name || 
                          question.from?.display_name;
        
        // Se nada encontrou, tenta buscar da API do ML usando o ID
        if (!customerName && question.from?.id) {
          try {
            console.log(`       Buscando nome real do cliente na API do ML userID: ${question.from.id}`);
            const store = await this.storesService.findOne(storeId);
            
            if (store?.mlAccessToken) {
              const realName = await this.marketplaceService.getCustomerRealName(
                question.from.id,
                store.mlAccessToken
              );
              if (realName) {
                customerName = realName;
                console.log(`       ✅ Nome encontrado na API: ${customerName}`);
              }
            }
          } catch (error: any) {
            console.warn(`       ⚠️ Erro ao buscar nome na API:`, error?.message || String(error));
          }
        }
        
        // Fallback final se ainda não temos nome
        if (!customerName) {
          customerName = `Cliente #${question.from?.id || Math.random().toString(36).substring(7)}`;
        }
        
        console.log(`       Resultado final: customerName = "${customerName}"`);
        
        const support = this.supportRepository.create({
          origin: question.origin,
          type: question.type,
          externalId: question.id,
          productExternalId: question.item_id,
          productTitle: question.item_title,
          customerName,
          customerExternalId: question.from?.id?.toString(),
          question: question.text,
          questionDate: new Date(question.date_created),
          canAnswer: question.status !== 'CLOSED' && question.status !== 'CLOSED_UNANSWERED',
          status: question.answer ? SupportStatus.RESPONDIDO : SupportStatus.NAO_RESPONDIDO,
          answer: question.answer?.text || '',
          answerDate: question.answer ? new Date(question.answer.date_created) : undefined,
          storeId,
          metadata: question,
        } as any);

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
    
    // Log de verificação final
    const totalInDb = await this.supportRepository.count({
      where: { storeId },
    });
    console.log(`📊 Total de atendimentos na loja após sync: ${totalInDb}`);
    
    return { imported, updated };
  }

  /**
   * Processa uma mensagem individual recebida via webhook
   * Usado quando o ML envia notificação de nova mensagem
   */
  async processMessageFromWebhook(storeId: string, packId: string): Promise<Support | null> {
    console.log(`\n🔔 Processando mensagem via webhook - Store: ${storeId}, Pack: ${packId}`);

    try {
      // Buscar detalhes do pack via API (tentar múltiplos endpoints)
      const packDetails = await this.marketplaceService.getPackDetails(storeId, packId);
      
      if (!packDetails) {
        console.log(`❌ Não foi possível buscar detalhes do pack ${packId}`);
        return null;
      }

      console.log(`📦 Pack encontrado:`, packDetails);

      // Verificar se já existe
      const existing = await this.supportRepository.findOne({
        where: { packId: packId },
      });

      if (existing) {
        console.log(`✏️ Atualizando mensagem existente (ID: ${existing.id})`);
        
        // Atualizar com os novos dados
        existing.question = packDetails.lastMessage || existing.question;
        existing.questionDate = packDetails.lastMessageDate ? new Date(packDetails.lastMessageDate) : existing.questionDate;
        existing.status = SupportStatus.NAO_RESPONDIDO; // Nova mensagem = não respondido
        
        const updated = await this.supportRepository.save(existing);
        console.log(`✅ Mensagem atualizada com sucesso`);
        return updated;
      } else {
        console.log(`🆕 Criando nova mensagem de pós-venda`);
        
        // Criar novo registro
        const support = this.supportRepository.create({
          origin: packDetails.origin,
          type: SupportType.MENSAGEM_VENDA,
          externalId: packId,
          packId: packId,
          orderExternalId: packDetails.orderId,
          productTitle: packDetails.orderTitle || 'Pedido',
          customerName: packDetails.customerName || 'Cliente',
          customerExternalId: packDetails.customerId,
          question: packDetails.lastMessage,
          questionDate: new Date(packDetails.lastMessageDate),
          canAnswer: true,
          status: SupportStatus.NAO_RESPONDIDO,
          storeId,
          metadata: packDetails,
        });

        const saved = await this.supportRepository.save(support);
        console.log(`✅ Mensagem criada (ID: ${saved.id})`);
        return saved;
      }
    } catch (error) {
      console.error(`❌ Erro ao processar mensagem via webhook:`, error);
      return null;
    }
  }

  async findByPackId(packId: string): Promise<Support | null> {
    return this.supportRepository.findOne({
      where: { packId },
    });
  }

  async saveDirect(support: Support): Promise<Support> {
    return this.supportRepository.save(support);
  }

  async createTestMessage(
    storeId: string,
    data: { packId: string; customerName: string; message: string }
  ): Promise<Support> {
    const support = this.supportRepository.create({
      origin: SupportOrigin.MERCADO_LIVRE,
      type: SupportType.MENSAGEM_VENDA,
      externalId: data.packId,
      packId: data.packId,
      productTitle: 'Pedido de Teste',
      customerName: data.customerName,
      customerExternalId: 'test-customer',
      question: data.message,
      questionDate: new Date(),
      canAnswer: true,
      status: SupportStatus.NAO_RESPONDIDO,
      storeId,
      metadata: { isTestMessage: true },
    } as any);

    return await this.supportRepository.save(support) as unknown as Support;
  }

  async remove(id: string): Promise<void> {
    const support = await this.findOne(id);
    await this.supportRepository.remove(support);
  }
}
