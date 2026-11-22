PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS profiles (
  profile_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL,
  unit TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS families (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(profile_id) ON DELETE CASCADE,
  household_id TEXT NOT NULL,
  responsible TEXT NOT NULL,
  cpf TEXT NOT NULL,
  sus_card TEXT NOT NULL DEFAULT '',
  phone TEXT NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  residents INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS dependents (
  dependent_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date TEXT NOT NULL,
  bolsa_familia TEXT NOT NULL DEFAULT 'Não informado'
);

CREATE TABLE IF NOT EXISTS appointments (
  appointment_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  appointment_date TEXT NOT NULL,
  appointment_time TEXT NOT NULL,
  doctor TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weighings (
  weighing_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  person_id TEXT NOT NULL,
  person_name TEXT NOT NULL,
  scheduled_date TEXT NOT NULL,
  measured_date TEXT NOT NULL,
  weight_kg REAL NOT NULL,
  height_cm REAL NOT NULL,
  note TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS vaccinations (
  vaccination_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  person_id TEXT NOT NULL,
  person_name TEXT NOT NULL,
  vaccine TEXT NOT NULL,
  dose TEXT NOT NULL,
  vaccination_date TEXT NOT NULL,
  status TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS smartwatch_readings (
  reading_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  recorded_at TEXT NOT NULL,
  systolic_pressure INTEGER NOT NULL,
  diastolic_pressure INTEGER NOT NULL,
  oxygen_saturation INTEGER NOT NULL,
  steps INTEGER NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS home_visits (
  visit_id TEXT PRIMARY KEY,
  profile_id TEXT NOT NULL REFERENCES profiles(profile_id) ON DELETE CASCADE,
  family_name TEXT NOT NULL,
  address TEXT NOT NULL,
  observation TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  agent_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS weighing_schedules (
  profile_id TEXT PRIMARY KEY REFERENCES profiles(profile_id) ON DELETE CASCADE,
  scheduled_date TEXT NOT NULL
);
