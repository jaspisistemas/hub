/**
 * Script simplificado para testar API de Notas Fiscais
 * 
 * Uso:
 * 1. Certifique-se que o backend está rodando
 * 2. Execute: node test-invoice-simple.js
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000';

// Simula dados que o ERP enviaria
const mockInvoiceData = {
  orderId: '', // Será preenchido automaticamente
  number: '000123',
  series: '1',
  accessKey: '35260211234567000189550010001230001234567890',
  xmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe35260211234567000189550010001230001234567890">
    <ide>
      <cUF>35</cUF>
      <natOp>Venda de mercadoria</natOp>
      <mod>55</mod>
      <serie>1</serie>
      <nNF>123</nNF>
    </ide>
  </infNFe>
</NFe>`,
  pdfUrl: 'https://exemplo.com/notas/123.pdf',
  issueDate: new Date().toISOString(),
};

async function test() {
  try {
    console.log('🚀 Teste de API de Notas Fiscais\n');
    console.log('='.repeat(60));

    // Tentar registrar usuário (se não existir)
    console.log('\n0️⃣ Verificando usuário...');
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        email: 'admin@jaspi.com',
        password: 'admin123',
        name: 'Admin',
      });
      console.log('✅ Usuário criado');
    } catch (err) {
      console.log('ℹ️  Usuário já existe ou erro ao criar (continuando)');
    }

    // Login
    console.log('\n1️⃣ Fazendo login...');
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'admin@jaspi.com',
      password: 'admin123',
    });

    const token = loginRes.data.accessToken;
    console.log('✅ Login realizado');

    const headers = { Authorization: `Bearer ${token}` };

    // Buscar pedidos
    console.log('\n2️⃣ Buscando pedidos...');
    let ordersRes = await axios.get(`${API_BASE_URL}/orders`, { headers });
    
    let order;
    if (ordersRes.data.length === 0) {
      console.log('ℹ️  Nenhum pedido encontrado. Criando pedido de teste...');
      
      // Criar pedido de teste
      const testOrder = {
        externalId: 'TEST-' + Date.now(),
        marketplace: 'test',
        total: 150.00,
        customerName: 'Cliente Teste',
        customerEmail: 'teste@exemplo.com',
        customerPhone: '11999999999',
        customerCity: 'São Paulo',
        customerState: 'SP',
        raw: { test: true },
      };
      
      const createOrderRes = await axios.post(
        `${API_BASE_URL}/orders`,
        testOrder,
        { headers }
      );
      
      order = createOrderRes.data;
      console.log(`✅ Pedido de teste criado: ${order.externalId}`);
    } else {
      order = ordersRes.data[0];
      console.log(`✅ Pedido encontrado: ${order.orderNumber || order.id}`);
    }
    
    mockInvoiceData.orderId = order.id;
    
    console.log(`✅ Pedido encontrado: ${order.orderNumber || order.id}`);
    console.log(`   Total: R$ ${order.total}`);

    // Criar nota fiscal (ERP → Hub)
    console.log('\n3️⃣ Criando nota fiscal (simulando ERP)...');
    const invoiceRes = await axios.post(
      `${API_BASE_URL}/invoices`,
      mockInvoiceData,
      { headers }
    );

    console.log('✅ Nota fiscal criada!');
    console.log(`   ID: ${invoiceRes.data.id}`);
    console.log(`   Número: ${invoiceRes.data.number}`);
    console.log(`   Chave: ${invoiceRes.data.accessKey}`);
    console.log(`   Status: ${invoiceRes.data.status}`);

    // Buscar nota
    console.log('\n4️⃣ Buscando nota pelo pedido...');
    const getRes = await axios.get(
      `${API_BASE_URL}/invoices/order/${mockInvoiceData.orderId}`,
      { headers }
    );

    console.log('✅ Nota encontrada:');
    console.log(`   Criada em: ${new Date(getRes.data.createdAt).toLocaleString('pt-BR')}`);

    // Marcar como enviada
    console.log('\n5️⃣ Marcando como enviada ao marketplace...');
    const sentRes = await axios.post(
      `${API_BASE_URL}/invoices/${invoiceRes.data.id}/mark-sent`,
      {},
      { headers }
    );

    console.log('✅ Status atualizado:');
    console.log(`   Status: ${sentRes.data.status}`);
    console.log(`   Enviada: ${sentRes.data.sentToMarketplace}`);
    console.log(`   Enviada em: ${new Date(sentRes.data.sentAt).toLocaleString('pt-BR')}`);

    // Listar todas notas
    console.log('\n6️⃣ Listando todas as notas...');
    const allRes = await axios.get(`${API_BASE_URL}/invoices`, { headers });
    console.log(`✅ Total de notas: ${allRes.data.length}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Teste completo! 🎉\n');

  } catch (error) {
    console.error('\n❌ Erro:', error.response?.data?.message || error.message);
    if (error.response?.data) {
      console.error('Detalhes:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

test();
