export enum StatusPedido {
    PENDENTE = 'PENDENTE',
    INTEGRADO = 'INTEGRADO',
    ERRO = 'ERRO',
}

export interface PedidoDTO {
    id: string;
    status: StatusPedido;
    cliente: string;
    total: number;
    marketplace: string;
}
