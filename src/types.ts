export interface DriverData {
  mes?: string;
  origem?: string;
  dia?: string;
  data?: string;
  contato_whats?: string;
  hora_liberado?: string;
  status?: string;
  modelo_carreta?: string;
  modelo_cavalo?: string;
  fez_contato?: string;
  destino?: string;
  transportador?: string;
  cavalo?: string;
  carreta?: string;
  carreta2?: string;
  motorista?: string;
  cpf?: string;
  rg?: string;
  cnh?: string;
  telefone?: string;
  vigencia_cadastro?: string;
  vinculo?: string;
  uf_placas?: string;
  tipo_carreta?: string;
  tipo_cavalo?: string;
  tecnologia?: string;
  rota?: string;
}

export interface Contract {
  id: string;
  data: DriverData;
  signature?: string;
  signed_at?: string;
  created_at: string;
}
