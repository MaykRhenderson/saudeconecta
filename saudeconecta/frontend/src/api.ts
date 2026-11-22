import {
  PERFIS_DEMO,
  lerConsultas,
  lerFamiliaDoPerfil,
  lerLeiturasSmartwatch,
  lerPesagens,
  lerVacinas,
  lerVisitas,
  salvarConsultas,
  salvarFamiliaDoPerfil,
  salvarLeiturasSmartwatch,
  salvarPesagens,
  salvarVacinas,
  salvarVisitas,
  type Consulta,
  type Familia,
  type LeituraSmartwatch,
  type Perfil,
  type RegistroPesagem,
  type RegistroVacina,
  type Visita,
} from "./types";

type Snapshot = {
  profile: Perfil;
  family: Familia | null;
  appointments: Consulta[];
  weighings: RegistroPesagem[];
  vaccinations: RegistroVacina[];
  smartwatchReadings: LeituraSmartwatch[];
  visits: Visita[];
  weighingDate: string | null;
};

const weighingDateKey = (profileId: string) => `saudeconecta:pesagem-agendada:${profileId}`;
const writeQueue = new Map<string, Promise<boolean>>();

function localSnapshot(profileId: string): Snapshot | null {
  const profile = PERFIS_DEMO.find((item) => item.id === profileId);
  if (!profile) return null;
  return {
    profile,
    family: lerFamiliaDoPerfil(profileId),
    appointments: lerConsultas().filter((item) => item.paciente === profile.nome),
    weighings: lerPesagens(profileId),
    vaccinations: lerVacinas(profileId),
    smartwatchReadings: lerLeiturasSmartwatch(profileId),
    visits: lerVisitas(profileId),
    weighingDate: localStorage.getItem(weighingDateKey(profileId)),
  };
}

function aplicarSnapshot(snapshot: Snapshot) {
  const { profile, family } = snapshot;
  if (family) salvarFamiliaDoPerfil(profile.id, { ...family, dependentes: family.dependentes ?? [] });
  else localStorage.removeItem(`saudeconecta:familia:${profile.id}`);

  const outrasConsultas = lerConsultas().filter((item) => item.paciente !== profile.nome);
  salvarConsultas([...outrasConsultas, ...snapshot.appointments]);
  salvarPesagens(profile.id, snapshot.weighings);
  salvarVacinas(profile.id, snapshot.vaccinations);
  salvarLeiturasSmartwatch(profile.id, snapshot.smartwatchReadings);
  salvarVisitas(snapshot.visits, profile.id);
  if (snapshot.weighingDate) localStorage.setItem(weighingDateKey(profile.id), snapshot.weighingDate);
  else localStorage.removeItem(weighingDateKey(profile.id));
}

export async function salvarPerfilNoBackend(profileId: string): Promise<boolean> {
  const anterior = writeQueue.get(profileId) ?? Promise.resolve(true);
  const atual = anterior.catch(() => false).then(async () => {
    const snapshot = localSnapshot(profileId);
    if (!snapshot) return false;
    try {
      const response = await fetch(`/api/profiles/${profileId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
        signal: AbortSignal.timeout(3000),
      });
      return response.ok;
    } catch {
      return false;
    }
  });
  writeQueue.set(profileId, atual);
  return atual;
}

export async function sincronizarPerfilAoEntrar(profileId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/profiles/${profileId}`, { signal: AbortSignal.timeout(2500) });
    if (response.ok) {
      aplicarSnapshot(await response.json() as Snapshot);
      return true;
    }
    if (response.status === 404) return salvarPerfilNoBackend(profileId);
  } catch {
    // O protótipo continua utilizável pelo armazenamento local quando a API estiver parada.
  }
  return false;
}

export async function sincronizarTodosPacientes(): Promise<boolean> {
  const pacientes = PERFIS_DEMO.filter((perfil) => perfil.tipo === "paciente");
  const resultados = await Promise.all(pacientes.map(async (perfil) => {
    try {
      const response = await fetch(`/api/profiles/${perfil.id}`, { signal: AbortSignal.timeout(2500) });
      if (!response.ok) return false;
      aplicarSnapshot(await response.json() as Snapshot);
      return true;
    } catch {
      return false;
    }
  }));
  return resultados.some(Boolean);
}

function dataLocal(data: Date) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function dataAnosAtras(anos: number) {
  const data = new Date();
  data.setFullYear(data.getFullYear() - anos);
  return dataLocal(data);
}

function dataDepois(dias: number) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return dataLocal(data);
}

function proximaDataUtil(dias: number) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  while (data.getDay() === 0 || data.getDay() === 6) data.setDate(data.getDate() + 1);
  return dataLocal(data);
}

export function criarSnapshotFicticio(profileId: string): Snapshot | null {
  const profile = PERFIS_DEMO.find((item) => item.id === profileId && item.tipo === "paciente");
  if (!profile) return null;
  const hoje = dataLocal(new Date());
  const dataPesagem = proximaDataUtil(14);
  const responsavelId = `demo-${profileId}-responsavel`;
  const dependenteId = `demo-${profileId}-filho-1`;
  const family: Familia = {
    id: `demo-familia-${profileId}`,
    responsavel: profile.nome,
    cpf: "00000000000",
    cartaoSus: "000000000000000",
    telefone: "(00) 00000-0000",
    endereco: "Rua de Exemplo, 123 — Bairro Modelo",
    moradores: 3,
    dependentes: [
      { id: dependenteId, nome: "Luiza (fictícia)", nascimento: dataAnosAtras(7), beneficioBolsaFamilia: "Sim" },
      { id: `demo-${profileId}-filho-2`, nome: "Pedro (fictício)", nascimento: dataAnosAtras(13), beneficioBolsaFamilia: "Não informado" },
    ],
  };
  const snapshot: Snapshot = {
    profile,
    family,
    appointments: [{ id: `demo-consulta-${profileId}`, paciente: profile.nome, especialidade: "Clínica geral", data: dataDepois(3), horario: "09:00", medico: "Dr. Carlos Ferreira", status: "Agendada", criadaEm: new Date().toISOString() }],
    weighings: [
      { id: `demo-pesagem-${profileId}-1`, pessoaId: responsavelId, pessoa: profile.nome, dataAgendada: dataPesagem, dataRealizada: hoje, pesoKg: 68.4, alturaCm: 164, observacao: "Dados fictícios para demonstração." },
      { id: `demo-pesagem-${profileId}-2`, pessoaId: dependenteId, pessoa: "Luiza (fictícia)", dataAgendada: dataPesagem, dataRealizada: hoje, pesoKg: 22.1, alturaCm: 121, observacao: "Dados fictícios para demonstração." },
    ],
    vaccinations: [
      { id: `demo-vacina-${profileId}-1`, pessoaId: responsavelId, pessoa: profile.nome, vacina: "Influenza (registro demonstrativo)", dose: "Dose de exemplo", data: hoje, status: "Aplicada" },
      { id: `demo-vacina-${profileId}-2`, pessoaId: dependenteId, pessoa: "Luiza (fictícia)", vacina: "Vacina de exemplo", dose: "Próxima dose", data: dataDepois(30), status: "Agendada" },
    ],
    smartwatchReadings: [{ id: `demo-smartwatch-${profileId}`, dataHora: new Date().toISOString(), pressaoSistolica: 120, pressaoDiastolica: 80, saturacaoOxigenio: 98, passos: 6420, origem: "Demonstração" }],
    visits: [{ id: `demo-visita-${profileId}`, perfilPacienteId: profileId, familia: profile.nome, endereco: family.endereco, observacao: "Visita domiciliar fictícia para demonstração do protótipo.", data: hoje, agente: "Ana Costa (perfil demonstrativo)" }],
    weighingDate: dataPesagem,
  };
  return snapshot;
}

export async function simularDadosDoPerfil(profileId: string): Promise<boolean> {
  const snapshot = criarSnapshotFicticio(profileId);
  if (!snapshot) return false;
  aplicarSnapshot(snapshot);
  return salvarPerfilNoBackend(profileId);
}
