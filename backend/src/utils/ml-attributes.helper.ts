/**
 * Helper para processamento de atributos do Mercado Livre (mlAttributes)
 * Elimina duplicação de 26+ linhas em products.controller (create e update)
 */

/**
 * Interface para tipo de mlAttributes após parse
 */
export type MlAttributes = Record<string, any>;

/**
 * Parseia e limpa mlAttributes vindos de requisições
 * 
 * Resolve problemas comuns:
 * - mlAttributes como string JSON que precisa ser parseada
 * - Arrays que foram parseados incorretamente como objetos com chaves numéricas
 * - Mistura de chaves numéricas e não-numéricas
 * 
 * @param attributes - Atributos vindos da requisição (string, object, ou array)
 * @returns Objeto limpo com atributos válidos ou undefined se inválido
 * 
 * @example
 * ```typescript
 * // String JSON
 * const parsed = parseMlAttributes('{"color": "red", "size": "M"}');
 * // Retorna: { color: 'red', size: 'M' }
 * 
 * // Objeto com chaves numéricas (array parseado incorretamente)
 * const cleaned = parseMlAttributes({ '0': 'value1', '1': 'value2', 'color': 'red' });
 * // Retorna: { color: 'red' } (remove chaves numéricas)
 * 
 * // Objeto válido
 * const valid = parseMlAttributes({ color: 'red', brand: 'Nike' });
 * // Retorna: { color: 'red', brand: 'Nike' }
 * ```
 */
export function parseMlAttributes(attributes: any): MlAttributes | undefined {
  if (!attributes) {
    return undefined;
  }

  let parsed = attributes;

  // PASSO 1: Se vier como string, tenta parsear JSON
  if (typeof attributes === 'string') {
    console.log('🔄 Parseando mlAttributes string...');
    try {
      parsed = JSON.parse(attributes);
      console.log('✅ mlAttributes parseado:', parsed);
    } catch (error) {
      console.warn('❌ Erro ao parsear mlAttributes:', error);
      return undefined;
    }
  }

  // PASSO 2: Se não for um objeto válido após parse, retorna undefined
  if (typeof parsed !== 'object' || parsed === null) {
    console.warn('⚠️ mlAttributes não é um objeto válido');
    return undefined;
  }

  // PASSO 3: Verifica se é um array (arrays não são válidos para mlAttributes)
  if (Array.isArray(parsed)) {
    console.warn('⚠️ mlAttributes não pode ser um array, apenas objeto');
    return undefined;
  }

  // PASSO 4: Limpa objetos que têm chaves numéricas misturadas
  // Isso acontece quando um array foi parseado incorretamente como objeto
  const keys = Object.keys(parsed);
  const hasNumericKeys = keys.some((k) => !isNaN(Number(k)));
  const hasNonNumericKeys = keys.some((k) => isNaN(Number(k)));

  // Se tem tanto chaves numéricas quanto não-numéricas, remove as numéricas
  if (hasNumericKeys && hasNonNumericKeys) {
    console.warn('⚠️ mlAttributes foi parseado errado como array-objeto');
    const cleanedAttrs: MlAttributes = {};
    
    keys.forEach((k) => {
      if (isNaN(Number(k))) {
        cleanedAttrs[k] = parsed[k];
      }
    });
    
    console.log('✅ mlAttributes limpo:', cleanedAttrs);
    return cleanedAttrs;
  }

  // Se tem apenas chaves numéricas, é inválido (era um array)
  if (hasNumericKeys && !hasNonNumericKeys) {
    console.warn('⚠️ mlAttributes parece ser um array disfarçado de objeto');
    return undefined;
  }

  // PASSO 5: Objeto válido, retorna como está
  return parsed;
}

/**
 * Valida se mlAttributes tem a estrutura esperada para o Mercado Livre
 * 
 * @param attributes - Atributos a serem validados
 * @returns true se for um objeto válido com pelo menos uma chave
 * 
 * @example
 * ```typescript
 * isValidMlAttributes({ color: 'red' }); // true
 * isValidMlAttributes({}); // false (vazio)
 * isValidMlAttributes(null); // false
 * isValidMlAttributes(['value']); // false (é array)
 * ```
 */
export function isValidMlAttributes(attributes: any): boolean {
  if (!attributes || typeof attributes !== 'object' || Array.isArray(attributes)) {
    return false;
  }

  const keys = Object.keys(attributes);
  
  // Deve ter pelo menos uma chave
  if (keys.length === 0) {
    return false;
  }

  // Não deve ter apenas chaves numéricas (indicaria um array)
  const hasOnlyNumericKeys = keys.every((k) => !isNaN(Number(k)));
  if (hasOnlyNumericKeys) {
    return false;
  }

  return true;
}

/**
 * Serializa mlAttributes para string JSON de forma segura
 * 
 * @param attributes - Atributos a serem serializados
 * @returns String JSON ou undefined se inválido
 * 
 * @example
 * ```typescript
 * const json = stringifyMlAttributes({ color: 'red', size: 'M' });
 * // Retorna: '{"color":"red","size":"M"}'
 * ```
 */
export function stringifyMlAttributes(attributes: any): string | undefined {
  if (!isValidMlAttributes(attributes)) {
    return undefined;
  }

  try {
    return JSON.stringify(attributes);
  } catch (error) {
    console.warn('❌ Erro ao serializar mlAttributes:', error);
    return undefined;
  }
}
