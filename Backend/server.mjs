import { createServer } from "node:http";
import { DatabaseSync } from "node:sqlite";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.resolve(backendDirectory, "..");
const databaseDirectory = path.join(projectDirectory, "Database");
mkdirSync(databaseDirectory, { recursive: true });
const databasePath = process.env.SAUDE_DB_PATH || path.join(databaseDirectory, "saudeconecta.sqlite");
const database = new DatabaseSync(databasePath);
database.exec(readFileSync(path.join(databaseDirectory, "schema.sql"), "utf8"));
database.exec("PRAGMA foreign_keys = ON;");

const permittedProfiles = new Set(["paciente-maria", "paciente-rafael", "paciente-luciana"]);
const selectRows = (table, profileId) => database.prepare(`SELECT * FROM ${table} WHERE profile_id = ?`).all(profileId);

function getSnapshot(profileId) {
  const profileRow = database.prepare("SELECT * FROM profiles WHERE profile_id = ?").get(profileId);
  if (!profileRow) return null;
  const familyRow = database.prepare("SELECT * FROM families WHERE profile_id = ?").get(profileId);
  const dependents = database.prepare("SELECT * FROM dependents WHERE profile_id = ? ORDER BY name").all(profileId);
  const schedule = database.prepare("SELECT scheduled_date FROM weighing_schedules WHERE profile_id = ?").get(profileId);
  return {
    profile: { id: profileRow.profile_id, nome: profileRow.display_name, tipo: profileRow.role, unidade: profileRow.unit },
    family: familyRow ? {
      id: familyRow.household_id,
      responsavel: familyRow.responsible,
      cpf: familyRow.cpf,
      cartaoSus: familyRow.sus_card,
      telefone: familyRow.phone,
      endereco: familyRow.address,
      moradores: familyRow.residents,
      dependentes: dependents.map((row) => ({ id: row.dependent_id, nome: row.name, nascimento: row.birth_date, beneficioBolsaFamilia: row.bolsa_familia })),
    } : null,
    appointments: selectRows("appointments", profileId).map((row) => ({ id: row.appointment_id, paciente: row.patient_name, especialidade: row.specialty, data: row.appointment_date, horario: row.appointment_time, medico: row.doctor, status: row.status, criadaEm: row.created_at })),
    weighings: selectRows("weighings", profileId).map((row) => ({ id: row.weighing_id, pessoaId: row.person_id, pessoa: row.person_name, dataAgendada: row.scheduled_date, dataRealizada: row.measured_date, pesoKg: row.weight_kg, alturaCm: row.height_cm, observacao: row.note })),
    vaccinations: selectRows("vaccinations", profileId).map((row) => ({ id: row.vaccination_id, pessoaId: row.person_id, pessoa: row.person_name, vacina: row.vaccine, dose: row.dose, data: row.vaccination_date, status: row.status })),
    smartwatchReadings: selectRows("smartwatch_readings", profileId).map((row) => ({ id: row.reading_id, dataHora: row.recorded_at, pressaoSistolica: row.systolic_pressure, pressaoDiastolica: row.diastolic_pressure, saturacaoOxigenio: row.oxygen_saturation, passos: row.steps, origem: row.source })),
    visits: selectRows("home_visits", profileId).map((row) => ({ id: row.visit_id, perfilPacienteId: profileId, familia: row.family_name, endereco: row.address, observacao: row.observation, data: row.visit_date, agente: row.agent_name })),
    weighingDate: schedule?.scheduled_date ?? null,
  };
}

function saveSnapshot(profileId, snapshot) {
  const profile = snapshot.profile;
  if (!profile || profile.id !== profileId) throw new Error("Perfil inválido no corpo da requisição.");
  const arrays = ["appointments", "weighings", "vaccinations", "smartwatchReadings", "visits"];
  for (const key of arrays) if (!Array.isArray(snapshot[key])) throw new Error(`A lista ${key} é obrigatória.`);

  database.exec("BEGIN IMMEDIATE;");
  try {
    database.prepare(`INSERT INTO profiles(profile_id, display_name, role, unit, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(profile_id) DO UPDATE SET display_name=excluded.display_name, role=excluded.role, unit=excluded.unit, updated_at=CURRENT_TIMESTAMP`)
      .run(profileId, profile.nome, profile.tipo, profile.unidade);

    for (const table of ["dependents", "families", "appointments", "weighings", "vaccinations", "smartwatch_readings", "home_visits", "weighing_schedules"]) {
      database.prepare(`DELETE FROM ${table} WHERE profile_id = ?`).run(profileId);
    }

    const family = snapshot.family;
    if (family) {
      database.prepare("INSERT INTO families(profile_id, household_id, responsible, cpf, sus_card, phone, address, residents) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
        .run(profileId, family.id, family.responsavel, family.cpf, family.cartaoSus ?? "", family.telefone ?? "", family.endereco ?? "", family.moradores ?? 1);
      const insertDependent = database.prepare("INSERT INTO dependents(dependent_id, profile_id, name, birth_date, bolsa_familia) VALUES (?, ?, ?, ?, ?)");
      for (const item of family.dependentes ?? []) insertDependent.run(item.id, profileId, item.nome, item.nascimento, item.beneficioBolsaFamilia ?? "Não informado");
    }

    const insertAppointment = database.prepare("INSERT INTO appointments(appointment_id, profile_id, patient_name, specialty, appointment_date, appointment_time, doctor, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const item of snapshot.appointments) insertAppointment.run(item.id, profileId, item.paciente, item.especialidade, item.data, item.horario, item.medico, item.status, item.criadaEm);

    const insertWeighing = database.prepare("INSERT INTO weighings(weighing_id, profile_id, person_id, person_name, scheduled_date, measured_date, weight_kg, height_cm, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
    for (const item of snapshot.weighings) insertWeighing.run(item.id, profileId, item.pessoaId, item.pessoa, item.dataAgendada, item.dataRealizada, item.pesoKg, item.alturaCm, item.observacao ?? "");

    const insertVaccination = database.prepare("INSERT INTO vaccinations(vaccination_id, profile_id, person_id, person_name, vaccine, dose, vaccination_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (const item of snapshot.vaccinations) insertVaccination.run(item.id, profileId, item.pessoaId, item.pessoa, item.vacina, item.dose, item.data, item.status);

    const insertReading = database.prepare("INSERT INTO smartwatch_readings(reading_id, profile_id, recorded_at, systolic_pressure, diastolic_pressure, oxygen_saturation, steps, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (const item of snapshot.smartwatchReadings) insertReading.run(item.id, profileId, item.dataHora, item.pressaoSistolica, item.pressaoDiastolica, item.saturacaoOxigenio, item.passos, item.origem);

    const insertVisit = database.prepare("INSERT INTO home_visits(visit_id, profile_id, family_name, address, observation, visit_date, agent_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
    for (const item of snapshot.visits) insertVisit.run(item.id, profileId, item.familia, item.endereco, item.observacao, item.data, item.agente);

    if (snapshot.weighingDate) database.prepare("INSERT INTO weighing_schedules(profile_id, scheduled_date) VALUES (?, ?)").run(profileId, snapshot.weighingDate);
    database.exec("COMMIT;");
  } catch (error) {
    database.exec("ROLLBACK;");
    throw error;
  }
}

function send(response, status, value) {
  const body = JSON.stringify(value);
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  response.end(body);
}

async function readJson(request) {
  const chunks = [];
  let total = 0;
  for await (const chunk of request) {
    total += chunk.length;
    if (total > 1_000_000) throw new Error("Requisição acima do limite de 1 MB.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

const server = createServer(async (request, response) => {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return response.end();
  }
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  if (url.pathname === "/api/health" && request.method === "GET") {
    return send(response, 200, { ok: true, database: "SQLite", file: path.relative(projectDirectory, databasePath) });
  }
  const match = url.pathname.match(/^\/api\/profiles\/([a-z0-9-]+)$/i);
  if (!match) return send(response, 404, { error: "Rota não encontrada." });
  const profileId = match[1];
  if (!permittedProfiles.has(profileId)) return send(response, 404, { error: "Perfil de paciente não cadastrado para o protótipo." });

  try {
    if (request.method === "GET") {
      const snapshot = getSnapshot(profileId);
      return snapshot ? send(response, 200, snapshot) : send(response, 404, { error: "Perfil ainda não sincronizado." });
    }
    if (request.method === "PUT") {
      const body = await readJson(request);
      saveSnapshot(profileId, body);
      return send(response, 200, { ok: true, profileId, savedAt: new Date().toISOString() });
    }
    return send(response, 405, { error: "Método não permitido." });
  } catch (error) {
    console.error("Falha na API:", error);
    return send(response, 400, { error: error instanceof Error ? error.message : "Erro ao processar requisição." });
  }
});

const host = process.env.SAUDE_HOST || "0.0.0.0";
const port = Number(process.env.SAUDE_PORT || 8000);
server.listen(port, host, () => console.log(`SaúdeConecta API pronta em http://${host}:${port} (SQLite: ${path.relative(projectDirectory, databasePath)})`));
process.on("SIGINT", () => { server.close(); database.close(); process.exit(0); });
