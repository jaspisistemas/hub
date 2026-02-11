export class InvoiceDataDto {
  // Dados do pedido
  orderId!: string;
  orderNumber!: string;
  orderDate!: Date;
  totalAmount!: number;

  // Dados do cliente
  customerName!: string;
  customerEmail!: string;
  customerPhone?: string;
  customerCpfCnpj?: string;
  customerInscricaoEstadual?: string;

  // Endereço de entrega
  shippingAddress!: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };

  // Dados de faturamento (se diferente do endereço de entrega)
  billingAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };

  // Produtos
  items!: {
    productId?: string;
    title: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    sku?: string;
    ncm?: string;
    cfop?: string;
  }[];

  // Valores
  subtotal!: number;
  shippingCost!: number;
  discount!: number;
  total!: number;

  // Impostos e taxas
  taxes?: {
    marketplaceFee?: number;
    shippingFee?: number;
    icms?: number;
    ipi?: number;
    pis?: number;
    cofins?: number;
  };

  // Dados da loja emissora
  store?: {
    id: string;
    name: string;
    cnpj?: string;
    inscricaoEstadual?: string;
  };

  // Dados brutos do marketplace (para referência)
  rawData?: any;
}
