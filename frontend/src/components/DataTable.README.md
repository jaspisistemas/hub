# DataTable Component - Guia Rápido

## 🎯 Uso Básico

```tsx
import DataTable, { Column, TableImage, TruncatedText } from '@/components/DataTable';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

function ProductsTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const columns: Column<Product>[] = [
    {
      id: 'imageUrl',
      label: 'Imagem',
      width: 80,
      format: (_, row) => (
        <TableImage src={row.imageUrl} alt={row.name} />
      ),
    },
    {
      id: 'name',
      label: 'Produto',
      minWidth: 200,
      format: (value) => <TruncatedText maxLength={50}>{value}</TruncatedText>,
    },
    {
      id: 'price',
      label: 'Preço',
      align: 'right',
      numeric: true,
      format: (value) => (
        new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        }).format(value)
      ),
    },
    {
      id: 'stock',
      label: 'Estoque',
      align: 'center',
      numeric: true,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={products}
      loading={loading}
      emptyMessage="Nenhum produto cadastrado"
      pagination
      page={page}
      rowsPerPage={rowsPerPage}
      onPageChange={setPage}
      onRowsPerPageChange={setRowsPerPage}
      showActions
      onRowAction={(product, event) => {
        // Abrir menu de ações
      }}
    />
  );
}
```

## 📊 Exemplos de Formatação

### Moeda (BRL)
```tsx
{
  id: 'price',
  label: 'Preço',
  align: 'right',
  numeric: true,
  format: (value) => (
    <Typography sx={{ fontWeight: 600 }}>
      {new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value)}
    </Typography>
  ),
}
```

### Data (pt-BR)
```tsx
{
  id: 'createdAt',
  label: 'Data',
  format: (value) => new Date(value).toLocaleDateString('pt-BR'),
}
```

### Chip de Status
```tsx
{
  id: 'status',
  label: 'Status',
  format: (value) => (
    <Chip
      label={value}
      color={value === 'active' ? 'success' : 'error'}
      size="small"
      variant="filled"
    />
  ),
}
```

### Badge Customizado
```tsx
{
  id: 'status',
  label: 'Status',
  format: (value) => <StatusBadge status={value} size="small" />,
}
```

### Imagem com Fallback
```tsx
{
  id: 'image',
  label: 'Imagem',
  width: 80,
  format: (_, row) => (
    <TableImage 
      src={row.imageUrl} 
      alt={row.name}
      size={48}
    />
  ),
}
```

### Texto Longo com Tooltip
```tsx
{
  id: 'description',
  label: 'Descrição',
  format: (value) => <TruncatedText maxLength={50}>{value}</TruncatedText>,
}
```

### Cores Condicionais
```tsx
{
  id: 'stock',
  label: 'Estoque',
  align: 'center',
  format: (value) => (
    <Typography
      sx={{
        fontWeight: 600,
        color: value === 0 
          ? 'error.main'
          : value < 10 
            ? 'warning.main' 
            : 'success.main',
      }}
    >
      {value}
    </Typography>
  ),
}
```

## ⚙️ Props do DataTable

### Obrigatórias
- `columns`: Column[] - Definição das colunas
- `data`: T[] - Array de dados

### Opcionais
- `loading`: boolean - Estado de carregamento
- `emptyMessage`: string - Mensagem quando vazio
- `emptyIcon`: ReactNode - Ícone do empty state

### Paginação
- `pagination`: boolean - Habilita paginação
- `page`: number - Página atual
- `rowsPerPage`: number - Linhas por página
- `totalCount`: number - Total de registros
- `onPageChange`: (page: number) => void
- `onRowsPerPageChange`: (rows: number) => void
- `rowsPerPageOptions`: number[] - Opções de linhas (padrão: [10, 25, 50, 100])

### Seleção
- `selectable`: boolean - Habilita checkboxes
- `selectedRows`: string[] - IDs selecionados
- `onSelectionChange`: (selected: string[]) => void
- `getRowId`: (row: T) => string - Função para obter ID

### Ações
- `showActions`: boolean - Mostra coluna de ações
- `onRowAction`: (row: T, event: MouseEvent) => void - Callback de ação
- `onRowClick`: (row: T) => void - Callback de click na linha

### Visual
- `hover`: boolean - Efeito hover (padrão: true)
- `dense`: boolean - Modo compacto (padrão: false)
- `stickyHeader`: boolean - Cabeçalho fixo (padrão: false)
- `maxHeight`: string | number - Altura máxima

### Ordenação
- `orderBy`: string - ID da coluna ordenada
- `order`: 'asc' | 'desc' - Direção da ordenação
- `onSort`: (columnId: string) => void - Callback de ordenação

## 📐 Props de Column

```tsx
interface Column<T = any> {
  id: string;                    // ID da propriedade no objeto
  label: string;                 // Texto do cabeçalho
  align?: 'left' | 'center' | 'right';  // Alinhamento
  width?: string | number;       // Largura fixa
  minWidth?: string | number;    // Largura mínima
  format?: (value: any, row: T) => ReactNode;  // Formatador customizado
  sortable?: boolean;            // Habilita ordenação
  numeric?: boolean;             // Auto-alinha à direita
}
```

## 🎨 Constantes de Tema

```tsx
import { TABLE_CONSTANTS } from '@/components/DataTable';

// Usar as mesmas constantes em componentes customizados
const myStyle = {
  padding: TABLE_CONSTANTS.CELL_PADDING,
  fontSize: TABLE_CONSTANTS.BODY.FONT_SIZE,
};
```

### Disponíveis:
- `ROW_HEIGHT`: 64
- `HEADER_HEIGHT`: 56
- `CELL_PADDING`: '12px 16px'
- `IMAGE_SIZE`: 48
- `BORDER_RADIUS`: '12px'
- `HEADER.FONT_SIZE`: '0.875rem'
- `HEADER.FONT_WEIGHT`: 600
- `BODY.FONT_SIZE`: '0.9375rem'
- `BODY.FONT_WEIGHT`: 400

## 💡 Dicas e Boas Práticas

### 1. Use TypeScript Generics
```tsx
const columns: Column<MyType>[] = [...];
<DataTable<MyType> columns={columns} data={myData} />
```

### 2. Memoize Columns
```tsx
const columns = useMemo<Column<Product>[]>(() => [
  // definições das colunas
], []);
```

### 3. Paginação Server-Side
```tsx
<DataTable
  data={currentPageData}
  pagination
  page={page}
  rowsPerPage={rowsPerPage}
  totalCount={totalFromServer}
  onPageChange={(newPage) => {
    setPage(newPage);
    fetchData(newPage, rowsPerPage);
  }}
/>
```

### 4. Empty State Customizado
```tsx
<DataTable
  data={filteredData}
  emptyMessage={
    searchTerm 
      ? 'Nenhum resultado encontrado' 
      : 'Nenhum item cadastrado'
  }
  emptyIcon={<MyCustomIcon />}
/>
```

### 5. Seleção com Ações em Lote
```tsx
const [selected, setSelected] = useState<string[]>([]);

<DataTable
  selectable
  selectedRows={selected}
  onSelectionChange={setSelected}
  // ...
/>

{selected.length > 0 && (
  <Button onClick={() => deleteMany(selected)}>
    Excluir {selected.length} itens
  </Button>
)}
```

## 🔧 Troubleshooting

### Dados não aparecem
- Verifique se `data` não é undefined
- Confirme que `getRowId` retorna um ID único
- Cheque se as colunas têm IDs correspondentes às propriedades

### Paginação não funciona
- Certifique-se de passar `pagination={true}`
- Implemente `onPageChange` e `onRowsPerPageChange`
- Use `totalCount` para total de registros (não apenas a página atual)

### Imagens não carregam
- Use `TableImage` que tem fallback automático
- Verifique as URLs das imagens
- Confirme que o servidor de imagens está acessível

### Performance lenta
- Use `dense={true}` para reduzir altura
- Implemente paginação server-side
- Memoize formatadores complexos
- Considere virtual scrolling para >1000 itens

## 📚 Mais Exemplos

Veja os arquivos de implementação:
- [ProductsPage.tsx](../src/features/products/ProductsPage.tsx)
- [OrdersPage.tsx](../src/features/orders/OrdersPage.tsx)
- [DashboardPage.tsx](../src/features/dashboard/DashboardPage.tsx)
