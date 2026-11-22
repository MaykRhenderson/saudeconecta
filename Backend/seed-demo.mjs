const pacientes = [
  { id: "paciente-maria", nome: "Maria Oliveira" },
  { id: "paciente-rafael", nome: "Rafael Santos" },
  { id: "paciente-luciana", nome: "Luciana Alves" },
];

function dataLocal(data) {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function daqui(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  return dataLocal(data);
}

function anosAtras(anos) {
  const data = new Date();
  data.setFullYear(data.getFullYear() - anos);
  return dataLocal(data);
}

function montarSnapshot(perfil) {
  const responsavelId = `demo-${perfil.id}-responsavel`;
  const dependenteId = `demo-${perfil.id}-filho-1`;
  const dataPesagem = daqui(14);
  const hoje = dataLocal(new Date());
  const endereco = "Rua de Exemplo, 123 — Bairro Modelo";
  return {
    profile: { ...perfil, tipo: "paciente", unidade: "UBS Jardim das Flores" },
    family: {
      id: `demo-familia-${perfil.id}`,
      responsavel: perfil.nome,
      cpf: "00000000000",
      cartaoSus: "000000000000000",
      telefone: "(00) 00000-0000",
      endereco,
      moradores: 3,
      dependentes: [
        { id: dependenteId, nome: "Luiza (fictícia)", nascimento: anosAtras(7), beneficioBolsaFamilia: "Sim" },
        { id: `demo-${perfil.id}-filho-2`, nome: "Pedro (fictício)", nascimento: anosAtras(13), beneficioBolsaFamilia: "Não informado" },
      ],
    },
    appointments: [{ id: `demo-consulta-${perfil.id}`, paciente: perfil.nome, especialidade: "Clínica geral", data: daqui(3), horario: "09:00", medico: "Dr. Carlos Ferreira", status: "Agendada", criadaEm: new Date().toISOString() }],
    weighings: [
      { id: `demo-pesagem-${perfil.id}-1`, pessoaId: responsavelId, pessoa: perfil.nome, dataAgendada: dataPesagem, dataRealizada: hoje, pesoKg: 68.4, alturaCm: 164, observacao: "Dados fictícios para demonstração." },
      { id: `demo-pesagem-${perfil.id}-2`, pessoaId: dependenteId, pessoa: "Luiza (fictícia)", dataAgendada: dataPesagem, dataRealizada: hoje, pesoKg: 22.1, alturaCm: 121, observacao: "Dados fictícios para demonstração." },
    ],
    vaccinations: [
      { id: `demo-vacina-${perfil.id}-1`, pessoaId: responsavelId, pessoa: perfil.nome, vacina: "Influenza (registro demonstrativo)", dose: "Dose de exemplo", data: hoje, status: "Aplicada" },
      { id: `demo-vacina-${perfil.id}-2`, pessoaId: dependenteId, pessoa: "Luiza (fictícia)", vacina: "Vacina de exemplo", dose: "Próxima dose", data: daqui(30), status: "Agendada" },
    ],
    smartwatchReadings: [{ id: `demo-smartwatch-${perfil.id}`, dataHora: new Date().toISOString(), pressaoSistolica: 120, pressaoDiastolica: 80, saturacaoOxigenio: 98, passos: 6420, origem: "Demonstração" }],
    visits: [{ id: `demo-visita-${perfil.id}`, perfilPacienteId: perfil.id, familia: perfil.nome, endereco, observacao: "Visita domiciliar fictícia para demonstração do protótipo.", data: hoje, agente: "Ana Costa (perfil demonstrativo)" }],
    weighingDate: dataPesagem,
  };
}

for (const perfil of pacientes) {
  const response = await fetch(`http://127.0.0.1:8000/api/profiles/${perfil.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(montarSnapshot(perfil)),
  });
  if (!response.ok) throw new Error(`Falha ao inserir ${perfil.nome}: ${response.status} ${await response.text()}`);
  console.log(`Dados fictícios gravados no SQLite: ${perfil.nome}`);
}
