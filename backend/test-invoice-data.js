/**
 * Script para testar API de dados fiscais do pedido
 * 
 * Este endpoint retorna todos os dados necessários para o ERP emitir nota fiscal
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

async function testInvoiceData() {
  try {
    console.log('🔍 Teste - Buscar Dados Fiscais do Pedido\n');
    console.log('='.repeat(60));

    // 1. Login
    console.log('\n1️⃣ Fazendo login...');
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        email: 'admin@jaspi.com',
        password: 'admin123',
        name: 'Admin',
      });
    } catch {}

    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@jaspi.com',
      password: 'admin123',
    });

    const token = loginRes.data.accessToken;
    const headers = { Authorization: `Bearer ${token}` };
    console.log('✅ Login OK');

    // 2. Buscar pedidos
    console.log('\n2️⃣ Buscando pedidos...');
    const ordersRes = await axios.get(`${API_BASE_URL}/orders`, { headers });
    
    if (ordersRes.data.length === 0) {
      console.log('ℹ️  Criando pedido de teste...');
      const testOrder = {
        externalId: 'ML-' + Date.now(),
        marketplace: 'mercado_livre',
        total: 299.90,
        customerName: 'João da Silva',
        customerEmail: 'joao@exemplo.com',
        customerPhone: '11987654321',
        customerCity: 'São Paulo',
        customerState: 'SP',
        customerAddress: 'Rua Exemplo, 123',
        customerZipCode: '01234-567',
        raw: JSON.stringify({
          buyer: {
            billing_info: {
              doc_number: '12345678900',
              doc_type: 'CPF',
            },
          },
          shipping: {
            receiver_address: {
              street_name: 'Rua Exemplo',
              street_number: '123',
              neighborhood: 'Centro',
              city: { name: 'São Paulo' },
              state: { id: 'SP' },
              zip_code: '01234-567',
              country: { id: 'BR' },
            },
            cost: 15.90,
          },
          order_items: [
            {
              item: {
                id: 'MLB123',
                title: 'Produto Teste',
                seller_sku: 'SKU-001',
              },
              quantity: 2,
              unit_price: 142.00,
              full_unit_price: 284.00,
              sale_fee: 28.40,
            }
          ],
        }),
      };
      
      const createRes = await axios.post(
        `${API_BASE_URL}/orders`,
        testOrder,
        { headers }
      );
      
      ordersRes.data = [createRes.data];
      console.log('✅ Pedido criado');
    }

    const order = ordersRes.data[0];
    console.log(`✅ Pedido encontrado: ${order.externalId || order.id}`);

    // 3. Buscar dados fiscais
    console.log('\n3️⃣ Buscando dados fiscais do pedido...');
    const invoiceDataRes = await axios.get(
      `${API_BASE_URL}/invoices/order/${order.id}/invoice-data`,
      { headers }
    );

    const data = invoiceDataRes.data;
    console.log('\n📋 DADOS FISCAIS PARA O ERP:\n');
    console.log('='.repeat(60));
    
    console.log('\n📦 PEDIDO:');
    console.log(`  ID: ${data.orderId}`);
    console.log(`  Número: ${data.orderNumber}`);
    console.log(`  Data: ${new Date(data.orderDate).toLocaleString('pt-BR')}`);
    console.log(`  Total: R$ ${data.totalAmount.toFixed(2)}`);

    console.log('\n👤 CLIENTE:');
    console.log(`  Nome: ${data.customerName}`);
    console.log(`  Email: ${data.customerEmail}`);
    console.log(`  Telefone: ${data.customerPhone || 'N/A'}`);
    console.log(`  CPF/CNPJ: ${data.customerCpfCnpj || 'N/A'}`);
    console.log(`  Inscrição Estadual: ${data.customerInscricaoEstadual || 'N/A'}`);

    console.log('\n📍 ENDEREÇO DE ENTREGA:');
    console.log(`  ${data.shippingAddress.street}, ${data.shippingAddress.number}`);
    if (data.shippingAddress.complement) {
      console.log(`  ${data.shippingAddress.complement}`);
    }
    console.log(`  ${data.shippingAddress.neighborhood}`);
    console.log(`  ${data.shippingAddress.city} - ${data.shippingAddress.state}`);
    console.log(`  CEP: ${data.shippingAddress.zipCode}`);

    if (data.billingAddress) {
      console.log('\n💳 ENDEREÇO DE FATURAMENTO:');
      console.log(`  ${data.billingAddress.street}, ${data.billingAddress.number}`);
      console.log(`  ${data.billingAddress.city} - ${data.billingAddress.state}`);
      console.log(`  CEP: ${data.billingAddress.zipCode}`);
    }

    console.log('\n🛍️  PRODUTOS:');
    data.items.forEach((item, idx) => {
      console.log(`\n  ${idx + 1}. ${item.title}`);
      console.log(`     Quantidade: ${item.quantity}`);
      console.log(`     Preço Unit.: R$ ${item.unitPrice.toFixed(2)}`);
      console.log(`     Total: R$ ${item.totalPrice.toFixed(2)}`);
      if (item.sku) console.log(`     SKU: ${item.sku}`);
      if (item.ncm) console.log(`     NCM: ${item.ncm}`);
      if (item.cfop) console.log(`     CFOP: ${item.cfop}`);
    });

    console.log('\n💰 VALORES:');
    console.log(`  Subtotal: R$ ${data.subtotal.toFixed(2)}`);
    console.log(`  Frete: R$ ${data.shippingCost.toFixed(2)}`);
    console.log(`  Desconto: R$ ${data.discount.toFixed(2)}`);
    console.log(`  TOTAL: R$ ${data.total.toFixed(2)}`);

    if (data.taxes) {
      console.log('\n📊 TAXAS:');
      if (data.taxes.marketplaceFee) {
        console.log(`  Taxa Marketplace: R$ ${data.taxes.marketplaceFee.toFixed(2)}`);
      }
      if (data.taxes.shippingFee) {
        console.log(`  Taxa Frete: R$ ${data.taxes.shippingFee.toFixed(2)}`);
      }
    }

    if (data.store) {
      console.log('\n🏪 LOJA EMISSORA:');
      console.log(`  Nome: ${data.store.name}`);
      console.log(`  ID: ${data.store.id}`);
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Dados fiscais obtidos com sucesso!');
    console.log('\n📌 Endpoint: GET /invoices/order/:orderId/invoice-data');
    console.log('💡 Use estes dados para emitir a nota fiscal no ERP\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testInvoiceData();
