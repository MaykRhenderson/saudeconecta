export type Familia = {
  id: string;
  responsavel: string;
  cpf: string;
  cartaoSus: string;
  telefone: string;
  endereco: string;
  moradores: number;
  dependentes: Dependente[];
};

export type Dependente = {
  id: string;
  nome: string;
  nascimento: string;
  beneficioBolsaFamilia: "Sim" | "Não" | "Não informado";
};

export type PerfilTipo = "paciente" | "medico" | "agente" | "recepcao" | "coordenacao" | "agenda" | "cadastro";

export type Perfil = {
  id: string;
  nome: string;
  tipo: PerfilTipo;
  unidade: string;
};

export type StatusConsulta = "Agendada" | "Chegou" | "Concluída" | "Faltou" | "Cancelada";

export type Consulta = {
  id: string;
  paciente: string;
  especialidade: string;
  data: string;
  horario: string;
  medico: string;
  status: StatusConsulta;
  criadaEm: string;
};

export type Visita = {
  id: string;
  perfilPacienteId: string;
  familia: string;
  endereco: string;
  observacao: string;
  data: string;
  agente: string;
};

export type RegistroPesagem = {
  id: string;
  pessoaId: string;
  pessoa: string;
  dataAgendada: string;
  dataRealizada: string;
  pesoKg: number;
  alturaCm: number;
  observacao: string;
};

export type RegistroVacina = {
  id: string;
  pessoaId: string;
  pessoa: string;
  vacina: string;
  dose: string;
  data: string;
  status: "Aplicada" | "Agendada";
};

export type LeituraSmartwatch = {
  id: string;
  dataHora: string;
  pressaoSistolica: number;
  pressaoDiastolica: number;
  saturacaoOxigenio: number;
  passos: number;
  origem: "Manual" | "Demonstração";
};

export const FAMILIA_STORAGE_KEY = "saudeconecta:familia";
export const PERFIL_STORAGE_KEY = "saudeconecta:perfil";
export const CONSULTAS_STORAGE_KEY = "saudeconecta:consultas";
export const VISITAS_STORAGE_KEY = "saudeconecta:visitas";
export const PESAGENS_STORAGE_KEY = "saudeconecta:pesagens";
export const VACINAS_STORAGE_KEY = "saudeconecta:vacinas";
export const SMARTWATCH_STORAGE_KEY = "saudeconecta:smartwatch";

export const PERFIS_DEMO: Perfil[] = [
  { id: "paciente-maria", nome: "Maria Oliveira", tipo: "paciente", unidade: "UBS Jardim das Flores" },
  { id: "paciente-rafael", nome: "Rafael Santos", tipo: "paciente", unidade: "UBS Jardim das Flores" },
  { id: "paciente-luciana", nome: "Luciana Alves", tipo: "paciente", unidade: "UBS Jardim das Flores" },
  { id: "medico-carlos", nome: "Dr. Carlos Ferreira", tipo: "medico", unidade: "UBS Jardim das Flores" },
  { id: "agente-ana", nome: "Ana Costa", tipo: "agente", unidade: "UBS Jardim das Flores" },
  { id: "recepcao-joao", nome: "João Melo", tipo: "recepcao", unidade: "UBS Jardim das Flores" },
  { id: "coordenacao-paula", nome: "Paula Nunes", tipo: "coordenacao", unidade: "UBS Jardim das Flores" },
  { id: "agenda-renata", nome: "Renata Lima", tipo: "agenda", unidade: "UBS Jardim das Flores" },
  { id: "cadastro-marcos", nome: "Marcos Silva", tipo: "cadastro", unidade: "UBS Jardim das Flores" },
];

export const ROTULOS_PERFIL: Record<PerfilTipo, string> = {
  paciente: "Paciente",
  medico: "Médico",
  agente: "Agente comunitário de saúde",
  recepcao: "Recepção",
  coordenacao: "Coordenação da unidade",
  agenda: "Administração de agenda",
  cadastro: "Cadastro e prontuários",
};

function lerLista<T>(chave: string): T[] {
  try {
    const valor = localStorage.getItem(chave);
    const dados: unknown = valor ? JSON.parse(valor) : [];
    return Array.isArray(dados) ? (dados as T[]) : [];
  } catch {
    return [];
  }
}

export function lerFamilia(): Familia | null {
  const perfil = lerPerfil();
  const profileId = perfil?.tipo === "paciente" ? perfil.id : PERFIS_DEMO.find((item) => item.tipo === "paciente")?.id;
  return profileId ? lerFamiliaDoPerfil(profileId) : null;
}

export function chaveFamilia(profileId: string) {
  return `${FAMILIA_STORAGE_KEY}:${profileId}`;
}

export function lerFamiliaDoPerfil(profileId: string): Familia | null {
  try {
    const valor = localStorage.getItem(chaveFamilia(profileId));
    if (valor) {
      const familia = JSON.parse(valor) as Familia;
      return { ...familia, dependentes: familia.dependentes ?? [] };
    }
    // Migra o cadastro antigo, que era único para todo o navegador, para o perfil da Maria.
    const idMaria = PERFIS_DEMO.find((item) => item.id === "paciente-maria")?.id;
    const legado = profileId === idMaria ? localStorage.getItem(FAMILIA_STORAGE_KEY) : null;
    if (!legado) return null;
    const familia = JSON.parse(legado) as Familia;
    const migrada = { ...familia, dependentes: familia.dependentes ?? [] };
    localStorage.setItem(chaveFamilia(profileId), JSON.stringify(migrada));
    localStorage.removeItem(FAMILIA_STORAGE_KEY);
    return migrada;
  } catch {
    return null;
  }
}

export function salvarFamiliaDoPerfil(profileId: string, familia: Familia) {
  localStorage.setItem(chaveFamilia(profileId), JSON.stringify(familia));
}

export function removerFamiliaDoPerfil(profileId: string) {
  localStorage.removeItem(chaveFamilia(profileId));
}

export function lerFamilias(): { perfil: Perfil; familia: Familia }[] {
  return PERFIS_DEMO.filter((perfil) => perfil.tipo === "paciente").flatMap((perfil) => {
    const familia = lerFamiliaDoPerfil(perfil.id);
    return familia ? [{ perfil, familia }] : [];
  });
}

export function lerConsultas(): Consulta[] {
  return lerLista<Consulta>(CONSULTAS_STORAGE_KEY);
}

export function salvarConsultas(consultas: Consulta[]) {
  localStorage.setItem(CONSULTAS_STORAGE_KEY, JSON.stringify(consultas));
}

export function lerVisitas(profileId?: string): Visita[] {
  if (profileId) return lerLista<Visita>(`${VISITAS_STORAGE_KEY}:${profileId}`);
  return PERFIS_DEMO.filter((perfil) => perfil.tipo === "paciente").flatMap((perfil) => lerLista<Visita>(`${VISITAS_STORAGE_KEY}:${perfil.id}`));
}

export function salvarVisitas(visitas: Visita[], profileId?: string) {
  localStorage.setItem(profileId ? `${VISITAS_STORAGE_KEY}:${profileId}` : VISITAS_STORAGE_KEY, JSON.stringify(visitas));
}

function lerDadosDoPerfil<T>(chave: string, profileId: string): T[] {
  return lerLista<T>(`${chave}:${profileId}`);
}

export function lerPesagens(profileId: string): RegistroPesagem[] {
  return lerDadosDoPerfil<RegistroPesagem>(PESAGENS_STORAGE_KEY, profileId);
}

export function salvarPesagens(profileId: string, registros: RegistroPesagem[]) {
  localStorage.setItem(`${PESAGENS_STORAGE_KEY}:${profileId}`, JSON.stringify(registros));
}

export function lerVacinas(profileId: string): RegistroVacina[] {
  return lerDadosDoPerfil<RegistroVacina>(VACINAS_STORAGE_KEY, profileId);
}

export function salvarVacinas(profileId: string, registros: RegistroVacina[]) {
  localStorage.setItem(`${VACINAS_STORAGE_KEY}:${profileId}`, JSON.stringify(registros));
}

export function lerLeiturasSmartwatch(profileId: string): LeituraSmartwatch[] {
  return lerDadosDoPerfil<LeituraSmartwatch>(SMARTWATCH_STORAGE_KEY, profileId);
}

export function salvarLeiturasSmartwatch(profileId: string, registros: LeituraSmartwatch[]) {
  localStorage.setItem(`${SMARTWATCH_STORAGE_KEY}:${profileId}`, JSON.stringify(registros));
}

export function lerPerfil(): Perfil | null {
  try {
    const id = localStorage.getItem(PERFIL_STORAGE_KEY);
    return PERFIS_DEMO.find((perfil) => perfil.id === id) ?? null;
  } catch {
    return null;
  }
}

export function hojeLocal() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

export function formatarData(data: string) {
  if (!data) return "";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${data}T12:00:00Z`));
}
