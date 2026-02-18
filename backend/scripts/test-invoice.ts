/**
 * Script de teste para simular ERP enviando nota fiscal
 * 
 * Este script simula o fluxo:
 * 1. ERP gera nota fiscal
 * 2. ERP faz POST para o Hub com os dados da nota
 * 
 * Para usar:
 * 1. Certifique-se que o backend está rodando
 * 2. Obtenha um token de autenticação (use get-token.ts)
 * 3. Coloque um orderId válido
 * 4. Execute: ts-node test-invoice.ts
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

// Dados de exemplo de uma nota fiscal
const mockInvoiceData = {
  orderId: 'COLE_AQUI_UM_ORDER_ID_VALIDO', // Troque por um orderId real
  number: '000123',
  series: '1',
  accessKey: '35260211234567000189550010001230001234567890', // 44 dígitos
  xmlContent: `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe35260211234567000189550010001230001234567890">
    <ide>
      <cUF>35</cUF>
      <cNF>123456789</cNF>
      <natOp>Venda de mercadoria</natOp>
      <mod>55</mod>
      <serie>1</serie>
      <nNF>123</nNF>
      <dhEmi>2026-02-11T14:30:00-03:00</dhEmi>
    </ide>
  </infNFe>
</NFe>`,
  pdfUrl: 'https://exemplo.com/notas/123.pdf',
  issueDate: new Date().toISOString(),
};

async function testCreateInvoice() {
  try {
    console.log('🔐 Configurando autenticação...');
    
    // TROQUE AQUI: Cole um token JWT válido que você obtém fazendo login no frontend
    // ou rode: npm run seed para criar usuário admin e depois faça POST /auth/login
    const token = 'SEU_TOKEN_JWT_AQUI';
    
    if (token === 'SEU_TOKEN_JWT_AQUI') {
      console.error('\n❌ ERRO: Você precisa configurar um token válido!');
      console.log('\n📋 Como obter um token:');
      console.log('1. Acesse o frontend (http://localhost:5174)');
      console.log('2. Faça login');
      console.log('3. Abra DevTools > Application > Local Storage');
      console.log('4. Copie o valor de "token"');
      console.log('5. Cole no script na linha 51\n');
      return;
    }

    console.log('✅ Token configurado');

    // 2. Buscar pedidos para pegar um orderId válido
    console.log('\n📦 Buscando pedidos...');
    const ordersResponse = await axios.get(`${API_BASE_URL}/orders`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (ordersResponse.data.length === 0) {
      console.error('❌ Nenhum pedido encontrado. Crie um pedido primeiro.');
      return;
    }

    // Pegar o primeiro pedido
    const firstOrder = ordersResponse.data[0];
    mockInvoiceData.orderId = firstOrder.id;
    
    console.log(`✅ Usando pedido: ${firstOrder.id}`);
    console.log(`   Número: ${firstOrder.orderNumber || 'N/A'}`);
    console.log(`   Total: R$ ${firstOrder.total}`);

    // 3. Criar nota fiscal (simular ERP)
    console.log('\n📄 Criando nota fiscal...');
    console.log('Dados enviados:');
    console.log(JSON.stringify(mockInvoiceData, null, 2));

    const invoiceResponse = await axios.post(
      `${API_BASE_URL}/invoices`,
      mockInvoiceData,
      {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('\n✅ Nota fiscal criada com sucesso!');
    console.log('Resposta:');
    console.log(JSON.stringify(invoiceResponse.data, null, 2));

    // 4. Buscar nota criada
    console.log('\n🔍 Buscando nota fiscal criada...');
    const getInvoiceResponse = await axios.get(
      `${API_BASE_URL}/invoices/order/${mockInvoiceData.orderId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('✅ Nota encontrada:');
    console.log(JSON.stringify(getInvoiceResponse.data, null, 2));

    // 5. Testar atualização de status
    console.log('\n📤 Marcando como enviada ao marketplace...');
    const markSentResponse = await axios.post(
      `${API_BASE_URL}/invoices/${invoiceResponse.data.id}/mark-sent`,
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log('✅ Status atualizado:');
    console.log(`   Status: ${markSentResponse.data.status}`);
    console.log(`   Enviada: ${markSentResponse.data.sentToMarketplace}`);
    console.log(`   Data envio: ${markSentResponse.data.sentAt}`);

    console.log('\n✅ Teste completo com sucesso! 🎉');

  } catch (error: any) {
    if (error.response) {
      console.error('❌ Erro na requisição:');
      console.error('Status:', error.response?.status);
      console.error('Mensagem:', error.response?.data?.message || error.message);
      console.error('Dados:', JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error('❌ Erro:', error);
    }
  }
}

// Executar teste
console.log('🚀 Iniciando teste de integração de Notas Fiscais\n');
console.log('='.repeat(60));
testCreateInvoice();
