import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './entities/product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { WebsocketGateway } from '../../infra/websocket/websocket.gateway';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    private readonly websocketGateway: WebsocketGateway,
  ) {}

  async create(dto: CreateProductDto, userId: string, companyId?: string) {
    // Se temos companyId, buscar primeira loja da empresa
    // Senão, buscar primeira loja do usuário
    let store: any;
    
    if (companyId) {
      store = await this.productsRepository.manager.findOne('stores', {
        where: { companyId },
      } as any);
    } else {
      store = await this.productsRepository.manager.findOne('stores', {
        where: { userId },
      } as any);
    }
    
    const storeId: string = store?.id;
    
    const product = this.productsRepository.create({
      ...dto,
      storeId,
    });
    const saved = await this.productsRepository.save(product);
    
    // Emitir evento via WebSocket
    this.websocketGateway.emitProductCreated(saved);
    
    return saved;
  }

  async findAll() {
    return this.productsRepository.find();
  }

  async findAllByUser(userId: string) {
    return this.productsRepository
      .createQueryBuilder('product')
      .leftJoin('product.store', 'store')
      .where('store.userId = :userId', { userId })
      .orderBy('product.createdAt', 'DESC')
      .getMany();
  }

  async findAllByCompany(companyId: string) {
    return this.productsRepository
      .createQueryBuilder('product')
      .leftJoin('product.store', 'store')
      .where('store.companyId = :companyId', { companyId })
      .orderBy('product.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: string) {
    try {
      const product = await this.productsRepository.findOne({ where: { id } });
      if (!product) {
        throw new NotFoundException(`Produto com ID ${id} não encontrado`);
      }
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Erro ao buscar produto:', error);
      throw new NotFoundException(`Erro ao buscar produto com ID ${id}`);
    }
  }

  async update(id: string, dto: UpdateProductDto) {
    const result = await this.productsRepository.update({ id }, dto);
    if (!result.affected) {
      throw new NotFoundException('Produto não encontrado');
    }
    const updated = await this.findOne(id);
    
    // Emitir evento via WebSocket
    this.websocketGateway.emitProductUpdated(updated);
    
    return updated;
  }

  async remove(id: string) {
    const result = await this.productsRepository.delete({ id });
    if (!result.affected) {
      throw new NotFoundException('Produto não encontrado');
    }
    
    // Emitir evento via WebSocket
    this.websocketGateway.emitProductDeleted({ id });
    
    return { deleted: true };
  }

  async getInfoPage() {
    return {
      hero: {
        title: 'Gerencie seus pedidos em um só lugar',
        subtitle: 'Simplifique sua operação com uma plataforma completa de gestão de vendas para Mercado Livre, Shopee e sua loja própria',
        cta: 'Começar agora',
      },
      problems: [
        { description: 'Pedidos espalhados em diferentes plataformas e é difícil acompanhá-los' },
        { description: 'Falta de controle sobre estoque, vendas e finanças em tempo real' },
        { description: 'Muito tempo gasto em tarefas repetitivas e administrativas' },
      ],
      solutions: [
        { title: 'Gestão de Pedidos', description: 'Centralize todos os seus pedidos do Mercado Livre, Shopee e outras plataformas em um único dashboard' },
        { title: 'Dashboard Financeiro', description: 'Visualize sua receita, custos e lucro em tempo real com gráficos e relatórios detalhados' },
        { title: 'Integrações Automáticas', description: 'Sincronize automaticamente seus pedidos, estoque e produtos com suas plataformas de venda' },
        { title: 'Atendimento Centralizado', description: 'Gerencie comunicação com clientes de todos os canais em um único lugar' },
      ],
      benefits: [
        { title: 'Mais Controle', description: 'Tenha visibilidade completa do seu negócio e tome decisões baseadas em dados reais' },
        { title: 'Menos Erros', description: 'Automação reduz erros manuais e aumenta a consistência dos dados' },
        { title: 'Economia de Tempo', description: 'Trabalhe mais eficientemente e foque no crescimento do seu negócio' },
        { title: 'Visão Real da Receita', description: 'Entenda exatamente quanto você está ganhando em cada canal de vendas' },
      ],
      targetAudience: 'Vendedores do Mercado Livre e lojas que querem escalar',
      howItWorks: [
        { step: 1, title: 'Conecte', description: 'Conecte suas contas do Mercado Livre, Shopee e outras plataformas em poucos cliques' },
        { step: 2, title: 'Sincronize', description: 'Seus pedidos e estoque são sincronizados automaticamente em tempo real' },
        { step: 3, title: 'Gerencie', description: 'Gerencie tudo de um só lugar: pedidos, finanças, estoque e atendimento' },
      ],
      socialProof: [
        { metric: 'Pedidos Gerenciados', value: '1000+' },
        { metric: 'Receita Controlada', value: 'R$ 5M' },
        { metric: 'Horas Economizadas', value: '5000+' },
      ],
      cta: {
        title: 'Pronto para profissionalizar sua operação?',
        subtitle: 'Junte-se a centenas de vendedores que já estão crescendo com nossa plataforma',
        buttonText: 'Começar Agora',
      },
    };
  }

  async findBySku(sku: string) {
    return this.productsRepository.findOne({ where: { sku } });
  }
}
