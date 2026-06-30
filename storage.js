const fs = require("fs");
const path = require("path");

const DATA_DIR = path.resolve(__dirname, process.env.DATA_DIR || "data");
const OVERRIDES_FILE = path.join(DATA_DIR, "overrides.json");
const AUDIT_LOG_FILE = path.join(DATA_DIR, "audit-log.json");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const ENV_FILE = path.join(__dirname, ".env");

function loadEnvFile() {
  if (!fs.existsSync(ENV_FILE)) return;
  const raw = fs.readFileSync(ENV_FILE, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    const trimmed = String(line || "").trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex <= 0) return;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^['"]|['"]$/g, "");
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

function createDefaultSettings() {
  return {
    adminPin: "",
    adminUsers: [],
    daily: {
      defaultView: "actual",
    },
    weekly: {
      format: "todos-contra-todos",
      activeDays: ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"],
      finalDays: ["Sabado"],
      groupSize: 4,
      qualifiersPerGroup: 2,
      qualifiersByGroup: {},
      pairMode: false,
      showTotalsByDefault: true,
    },
    monthly: {
      hipodromos: ["Club Hipico"],
      startDate: "",
      endDate: "",
      selectedEventIds: [],
      showTotalsByDefault: true,
    },
    toteletras: {
      username: "",
      password: "",
      loginUrl: "https://apuestas.toteletras.cl",
      pollingEnabled: false,
      pollingIntervalMinutes: 5,
      pollingDelayMinutes: 5,
    },
    automation: {
      filterDate: "",
      groupId: "",
      includeDaily: true,
      includeWeekly: true,
      includeMonthly: true,
      selectedCaptureKeys: [],
    },
    themes: {
      daily: "#c56a2d",
      weekly: "#2d6aa5",
      monthly: "#2d7d57",
    },
    campaigns: {
      daily: [],
      weekly: [],
      monthly: [],
    },
    registryGroups: [],
    excel: {
      useExcelBase: true,
    },
    prizes: {
      daily: {
        singlePrice: 5000,
        promoEnabled: true,
        promoQuantity: 2,
        promoPrice: 9000,
      },
      weekly: {
        entryPrice: 10000,
      },
      monthly: {
        entryPrice: 10000,
      },
      payout: {
        firstPct: 70,
        secondPct: 20,
        thirdPct: 0,
        adminPct: 10,
      },
    },
  };
}

function createProgramKey(date, trackId) {
  return `${String(date || "").trim()}::${String(trackId || "").trim()}`;
}

function normalizeProgramEntry(entry) {
  return {
    number: String(entry?.number || entry?.numero || "").trim(),
    name: String(entry?.name || entry?.ejemplar || "").trim(),
    jockey: String(entry?.jockey || entry?.jinete || "").trim(),
  };
}

function normalizeProgramRace(raceKey, raceData) {
  const race = Number(raceData?.race || raceData?.carrera || raceKey) || 0;
  return {
    race,
    label: String(raceData?.label || raceData?.titulo || `Carrera ${race || raceKey}`).trim(),
    postTime: String(raceData?.postTime || raceData?.hora || "").trim(),
    distance: String(raceData?.distance || raceData?.distancia || "").trim(),
    surface: String(raceData?.surface || raceData?.superficie || "").trim(),
    entries: safeArray(raceData?.entries || raceData?.ejemplares)
      .map((entry) => normalizeProgramEntry(entry))
      .filter((entry) => entry.number || entry.name),
  };
}

function normalizeProgramsMap(programs) {
  const normalized = {};
  Object.entries(programs || {}).forEach(([key, program]) => {
    const date = String(program?.date || key.split("::")[0] || "").trim();
    const trackId = String(program?.trackId || key.split("::")[1] || "").trim();
    if (!date || !trackId) return;
    const races = Object.fromEntries(
      Object.entries(program?.races || {}).map(([raceKey, raceData]) => [String(raceKey), normalizeProgramRace(raceKey, raceData)]),
    );
    normalized[createProgramKey(date, trackId)] = {
      date,
      trackId,
      trackName: String(program?.trackName || trackId).trim(),
      source: String(program?.source || "manual").trim(),
      sourceUrl: String(program?.sourceUrl || "").trim(),
      importedAt: String(program?.importedAt || "").trim(),
      status: String(program?.status || "manual").trim(),
      races,
    };
  });
  return normalized;
}

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
  }
  if (!fs.existsSync(OVERRIDES_FILE)) {
    writeJsonAtomic(
      OVERRIDES_FILE,
      { events: {}, registry: [], settings: createDefaultSettings() },
    );
  }
}

function writeJsonAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tempPath, filePath);
}

function backupCurrentOverrides() {
  try {
    if (!fs.existsSync(OVERRIDES_FILE)) return;
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    const now = new Date();
    const stamp = now.toISOString().replace(/[:.]/g, "-");
    const backupPath = path.join(BACKUP_DIR, `overrides-${stamp}.json`);
    fs.copyFileSync(OVERRIDES_FILE, backupPath);

    const entries = fs
      .readdirSync(BACKUP_DIR)
      .filter((name) => name.startsWith("overrides-") && name.endsWith(".json"))
      .sort();
    const maxBackups = 20;
    if (entries.length > maxBackups) {
      entries.slice(0, entries.length - maxBackups).forEach((name) => {
        const oldPath = path.join(BACKUP_DIR, name);
        fs.unlinkSync(oldPath);
      });
    }
  } catch (error) {
    console.warn(`[STORAGE] No se pudo crear backup de overrides: ${error.message}`);
  }
}

function loadOverrides() {
  ensureStorage();
  const raw = fs.readFileSync(OVERRIDES_FILE, "utf8");
  const parsed = JSON.parse(raw || "{}");
  const envAdminPin = getEnvAdminPin();
  const envAdminUsers = getEnvAdminUsers();
  const authManagedByEnv = Boolean(envAdminPin || envAdminUsers.length);
  return {
    events: parsed.events || {},
    registry: Array.isArray(parsed.registry) ? parsed.registry : [],
    programs: normalizeProgramsMap(parsed.programs || {}),
    settings: {
      ...createDefaultSettings(),
      ...(parsed.settings || {}),
      daily: {
        ...createDefaultSettings().daily,
        ...((parsed.settings || {}).daily || {}),
      },
      weekly: {
        ...createDefaultSettings().weekly,
        ...((parsed.settings || {}).weekly || {}),
      },
      monthly: {
        ...createDefaultSettings().monthly,
        ...((parsed.settings || {}).monthly || {}),
      },
      toteletras: {
        ...createDefaultSettings().toteletras,
        ...((parsed.settings || {}).toteletras || {}),
      },
      automation: {
        ...createDefaultSettings().automation,
        ...((parsed.settings || {}).automation || {}),
      },
      themes: {
        ...createDefaultSettings().themes,
        ...((parsed.settings || {}).themes || {}),
      },
      campaigns: {
        daily: Array.isArray(((parsed.settings || {}).campaigns || {}).daily) ? ((parsed.settings || {}).campaigns || {}).daily : [],
        weekly: Array.isArray(((parsed.settings || {}).campaigns || {}).weekly) ? ((parsed.settings || {}).campaigns || {}).weekly : [],
        monthly: Array.isArray(((parsed.settings || {}).campaigns || {}).monthly) ? ((parsed.settings || {}).campaigns || {}).monthly : [],
      },
      registryGroups: Array.isArray((parsed.settings || {}).registryGroups)
        ? parsed.settings.registryGroups.map((group, index) => normalizeRegistryGroup(group, `grupo-${index + 1}`)).filter((group) => group.id)
        : [],
      adminPin: authManagedByEnv
        ? envAdminPin
        : String((parsed.settings || {}).adminPin || createDefaultSettings().adminPin || "").trim(),
      adminUsers: authManagedByEnv
        ? envAdminUsers
        : Array.isArray((parsed.settings || {}).adminUsers)
          ? parsed.settings.adminUsers.map((user, index) => normalizeAdminUser(user, `admin-${index + 1}`)).filter((user) => user.id && user.username)
          : createDefaultSettings().adminUsers,
      authManagedByEnv,
      excel: {
        ...createDefaultSettings().excel,
        ...((parsed.settings || {}).excel || {}),
      },
      prizes: {
        ...createDefaultSettings().prizes,
        ...((parsed.settings || {}).prizes || {}),
        daily: {
          ...createDefaultSettings().prizes.daily,
          ...(((parsed.settings || {}).prizes || {}).daily || {}),
        },
        weekly: {
          ...createDefaultSettings().prizes.weekly,
          ...(((parsed.settings || {}).prizes || {}).weekly || {}),
        },
        monthly: {
          ...createDefaultSettings().prizes.monthly,
          ...(((parsed.settings || {}).prizes || {}).monthly || {}),
        },
        payout: {
          ...createDefaultSettings().prizes.payout,
          ...(((parsed.settings || {}).prizes || {}).payout || {}),
        },
      },
    },
  };
}

function saveOverrides(data) {
  ensureStorage();
  backupCurrentOverrides();
  writeJsonAtomic(OVERRIDES_FILE, data);
}

function ensureAuditLogFile() {
  ensureStorage();
  if (!fs.existsSync(AUDIT_LOG_FILE)) {
    writeJsonAtomic(AUDIT_LOG_FILE, []);
  }
}

function loadAuditLog() {
  try {
    ensureAuditLogFile();
    const raw = fs.readFileSync(AUDIT_LOG_FILE, "utf8");
    const parsed = JSON.parse(raw || "[]");
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed.entries)) return parsed.entries;
    return [];
  } catch (error) {
    console.warn(`[AUDIT] No se pudo leer audit-log.json: ${error.message}`);
    return [];
  }
}

function appendAuditLog(entry) {
  const now = new Date();
  const maxEntries = Number(process.env.AUDIT_LOG_MAX_ENTRIES || 5000);
  const currentEntries = loadAuditLog();
  const nextEntry = {
    id: `${now.toISOString()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: now.toISOString(),
    timestampChile: formatChileTimestamp(now),
    ...entry,
  };
  const entries = [...currentEntries, nextEntry];
  const boundedEntries = Number.isFinite(maxEntries) && maxEntries > 0
    ? entries.slice(-maxEntries)
    : entries;
  ensureAuditLogFile();
  writeJsonAtomic(AUDIT_LOG_FILE, boundedEntries);
  return nextEntry;
}

function formatChileTimestamp(date) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Santiago",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date).reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});
    return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
  } catch {
    return date.toISOString();
  }
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeIdPart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeRegistryGroup(group, fallbackId = "") {
  const name = String(group?.name || "").trim();
  const id = String(group?.id || "").trim() || normalizeIdPart(name) || fallbackId;
  return {
    id,
    name: name || id,
    description: String(group?.description || "").trim(),
    enabled: group?.enabled !== false,
  };
}

function normalizeAdminUser(user, fallbackId = "") {
  const username = String(user?.username || "").trim();
  const id = String(user?.id || "").trim() || normalizeIdPart(username) || fallbackId;
  return {
    id,
    username,
    displayName: String(user?.displayName || username || id).trim(),
    passwordHash: String(user?.passwordHash || "").trim(),
    enabled: user?.enabled !== false,
    role: String(user?.role || "admin").trim() || "admin",
  };
}

function getEnvAdminPin() {
  return String(process.env.ADMIN_PIN || "").trim();
}

function getEnvAdminUsers() {
  const raw = String(process.env.ADMIN_USERS_JSON || "").trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((user, index) => normalizeAdminUser(user, `env-admin-${index + 1}`)).filter((user) => user.id && user.username)
      : [];
  } catch (error) {
    console.warn(`[AUTH] No se pudo parsear ADMIN_USERS_JSON: ${error.message}`);
    return [];
  }
}

function upsertParticipant(eventId, participant) {
  const overrides = loadOverrides();
  const eventData = overrides.events[eventId] || { participants: [], results: {} };
  const list = Array.isArray(eventData.participants) ? eventData.participants : [];
  const idx = list.findIndex((item) => Number(item.index) === Number(participant.index));
  if (idx >= 0) {
    list[idx] = participant;
  } else {
    list.push(participant);
  }
  eventData.participants = list.sort((a, b) => a.index - b.index);
  overrides.events[eventId] = eventData;
  saveOverrides(overrides);
}

function deleteParticipant(eventId, index) {
  const overrides = loadOverrides();
  const eventData = overrides.events[eventId] || { participants: [], results: {} };
  const list = Array.isArray(eventData.participants) ? eventData.participants : [];
  eventData.participants = list.filter((item) => Number(item.index) !== Number(index));
  overrides.events[eventId] = eventData;
  saveOverrides(overrides);
}

function upsertResult(eventId, race, result) {
  const overrides = loadOverrides();
  const eventData = overrides.events[eventId] || { participants: [], results: {}, meta: {} };
  eventData.results = eventData.results || {};
  eventData.results[String(race)] = result;
  overrides.events[eventId] = eventData;
  saveOverrides(overrides);
}

/**
 * Upsert result with INCREMENTAL merge (does NOT overwrite existing data)
 * 
 * @param {string} eventId - Event ID
 * @param {string|number} race - Race number
 * @param {Object} newData - New result data to merge
 * @param {Object} options - Options
 * @param {boolean} options.skipIfComplete - Skip if race already has complete dividends
 * @param {boolean} options.preferExisting - Keep existing values when both exist (default: true)
 */
function upsertResultIncremental(eventId, race, newData, options = {}) {
  const { skipIfComplete = true, preferExisting = true } = options;
  
  const overrides = loadOverrides();
  const eventData = overrides.events[eventId] || { participants: [], results: {}, meta: {} };
  eventData.results = eventData.results || {};
  
  const raceKey = String(race);
  const existingResult = eventData.results[raceKey] || {};
  
  // CHECK 0: If race was manually overridden, never auto-update it
  if (existingResult.manualOverride) {
    console.log(`⏭️ [INCREMENTAL] Carrera ${race} con override manual, saltando auto-import.`);
    return { skipped: true, reason: 'manual_override' };
  }

  // CHECK 1: Skip if race is already complete
  if (skipIfComplete && isRaceComplete(existingResult)) {
    if (!hasResultCorrection(existingResult, newData)) {
    console.log(`⏭️ [INCREMENTAL] Carrera ${race} ya está completa, saltando...`);
    return { skipped: true, reason: 'already_complete' };
    }
    console.log(`🔄 [INCREMENTAL] Carrera ${race} completa pero con corrección oficial detectada, actualizando...`);
  }
  
  // CHECK 2: Smart merge - only fill missing fields
  const mergedResult = preferExisting
    ? mergeResultsSmart(existingResult, newData)  // Prefer existing, fill gaps
    : mergeResultsNewFirst(existingResult, newData);  // Prefer new, keep existing if missing
  
  eventData.results[raceKey] = mergedResult;
  overrides.events[eventId] = eventData;
  saveOverrides(overrides);
  
  console.log(`✅ [INCREMENTAL] Carrera ${race} actualizada:`, {
    existingFields: Object.keys(existingResult).length,
    newFields: Object.keys(newData).length,
    mergedFields: Object.keys(mergedResult).length,
    wasUpdated: JSON.stringify(existingResult) !== JSON.stringify(mergedResult)
  });
  
  return { skipped: false, merged: mergedResult };
}

/**
 * Check if a race has complete dividend data
 */
function isRaceComplete(result) {
  if (!result || !result.primero) return false;
  
  // A race is complete if it has:
  // - primero (first place)
  // - At least main dividends (ganador)
  // - favorito (if applicable)
  const hasPrimero = result.primero && result.primero !== '';
  const hasGanador = result.ganador && result.ganador !== '';
  const hasSegundo = result.segundo && result.segundo !== '';
  const hasTercero = result.tercero && result.tercero !== '';
  const hasDividends = hasGanador || result.divSegundo || result.divTercero;
  
  return hasPrimero && hasSegundo && hasTercero && hasDividends;
}

function hasNonEmptyValue(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function normalizeRunnerNumber(value) {
  return String(value ?? "").trim();
}

const RESULT_CORE_PODIUM_KEYS = ["primero", "segundo", "tercero"];
const RESULT_PODIUM_KEYS = [
  "primero",
  "empatePrimero",
  "segundo",
  "empateSegundo",
  "tercero",
  "empateTercero",
];
const RESULT_POSITIONAL_KEYS = [
  ...RESULT_PODIUM_KEYS,
  "nombrePrimero",
  "nombreEmpatePrimero",
  "ganador",
  "divSegundoPrimero",
  "divTerceroPrimero",
  "empatePrimeroGanador",
  "empatePrimeroDivSegundo",
  "empatePrimeroDivTercero",
  "nombreSegundo",
  "nombreEmpateSegundo",
  "divSegundo",
  "divTerceroSegundo",
  "empateSegundoDivSegundo",
  "empateSegundoDivTercero",
  "nombreTercero",
  "nombreEmpateTercero",
  "divTercero",
  "empateTerceroDivTercero",
];

function hasOwnKey(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj || {}, key);
}

function normalizeResultFieldValue(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item && typeof item === "object") {
          return normalizeRunnerNumber(item.number ?? item.numero ?? item.id ?? item.value ?? "");
        }
        return normalizeRunnerNumber(item);
      })
      .filter(Boolean)
      .sort()
      .join("|");
  }
  if (value && typeof value === "object") {
    return normalizeRunnerNumber(value.number ?? value.numero ?? value.id ?? value.value ?? "");
  }
  return String(value ?? "").trim();
}

function hasPodiumStructureChanged(existing, incoming, options = {}) {
  const { onlyProvidedKeys = false } = options;
  const keys = onlyProvidedKeys
    ? RESULT_PODIUM_KEYS.filter((key) => hasOwnKey(incoming, key))
    : RESULT_PODIUM_KEYS;

  if (!keys.length) return false;

  return keys.some((key) => normalizeRunnerNumber(existing?.[key]) !== normalizeRunnerNumber(incoming?.[key]));
}

function hasResultCorrection(existing, incoming) {
  if (!incoming || typeof incoming !== "object") return false;

  const correctionKeys = [
    ...RESULT_POSITIONAL_KEYS,
    "favorito",
    "retiros",
    "retiro1",
    "retiro2",
  ];

  return correctionKeys.some((key) => {
    if (!hasOwnKey(incoming, key)) return false;
    if (!hasNonEmptyValue(incoming?.[key])) return false;
    return normalizeResultFieldValue(existing?.[key]) !== normalizeResultFieldValue(incoming?.[key]);
  });
}

function shouldApplyCorrectionValue(existing, key, newVal) {
  const correctionKeys = new Set([
    ...RESULT_POSITIONAL_KEYS,
    "favorito",
    "nombreFavorito",
    "retiros",
    "retiro1",
    "retiro2",
  ]);
  if (!correctionKeys.has(key)) return false;
  if (!hasNonEmptyValue(newVal)) return false;
  if (!hasNonEmptyValue(existing?.[key])) return false;
  return normalizeResultFieldValue(existing?.[key]) !== normalizeResultFieldValue(newVal);
}

function mergeWithdrawalValues(existingVal, newVal) {
  const values = [existingVal, newVal]
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .map((item) => {
      if (item && typeof item === "object") {
        return normalizeRunnerNumber(item.number ?? item.numero ?? item.id ?? item.value ?? "");
      }
      return normalizeRunnerNumber(item);
    })
    .filter(Boolean);

  return [...new Set(values)];
}

function replacePositionalFields(base, source, options = {}) {
  const { clearMissing = false, preserveCorePodium = false } = options;
  const next = { ...base };

  RESULT_POSITIONAL_KEYS.forEach((key) => {
    if (hasOwnKey(source, key)) {
      next[key] = source[key] ?? "";
      return;
    }
    if (clearMissing) {
      if (preserveCorePodium && RESULT_CORE_PODIUM_KEYS.includes(key)) return;
      next[key] = "";
    }
  });

  return next;
}

function prepareManualResultPayload(existing, incoming, race) {
  const safeIncoming = incoming || {};
  const merged = {
    ...existing,
    ...safeIncoming,
    race,
    manualOverride: true,
    source: "manual",
  };

  const podiumChanged = hasPodiumStructureChanged(existing, safeIncoming, { onlyProvidedKeys: true });
  if (!podiumChanged) return merged;

  return replacePositionalFields(merged, safeIncoming, {
    clearMissing: true,
    preserveCorePodium: true,
  });
}

/**
 * Align tie dividend bundles by runner number.
 * This avoids crossed dividends when Teletrak sends tied horses in different order
 * across incremental imports.
 */
function alignSecondTieBundle(existing, incoming) {
  const existingSecond = normalizeRunnerNumber(existing?.segundo);
  const existingTieSecond = normalizeRunnerNumber(existing?.empateSegundo);
  const incomingSecond = normalizeRunnerNumber(incoming?.segundo);
  const incomingTieSecond = normalizeRunnerNumber(incoming?.empateSegundo);

  if (!existingSecond || !existingTieSecond || !incomingSecond || !incomingTieSecond) {
    return incoming;
  }

  const existingPair = new Set([existingSecond, existingTieSecond]);
  const incomingPair = new Set([incomingSecond, incomingTieSecond]);
  if (existingPair.size !== 2 || incomingPair.size !== 2) {
    return incoming;
  }
  if (!existingPair.has(incomingSecond) || !existingPair.has(incomingTieSecond)) {
    return incoming;
  }

  const incomingByRunner = {
    [incomingSecond]: {
      divSegundo: incoming?.divSegundo,
      divTerceroSegundo: incoming?.divTerceroSegundo,
    },
    [incomingTieSecond]: {
      divSegundo: incoming?.empateSegundoDivSegundo,
      divTerceroSegundo: incoming?.empateSegundoDivTercero,
    },
  };

  const alignedSecond = incomingByRunner[existingSecond] || {};
  const alignedTieSecond = incomingByRunner[existingTieSecond] || {};

  return {
    ...incoming,
    divSegundo: alignedSecond.divSegundo ?? incoming.divSegundo,
    divTerceroSegundo: alignedSecond.divTerceroSegundo ?? incoming.divTerceroSegundo,
    empateSegundoDivSegundo: alignedTieSecond.divSegundo ?? incoming.empateSegundoDivSegundo,
    empateSegundoDivTercero: alignedTieSecond.divTerceroSegundo ?? incoming.empateSegundoDivTercero,
  };
}

function uniqueGroupIds(values = []) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

function normalizeParticipantGroupIds(participant = {}) {
  return uniqueGroupIds([
    ...(Array.isArray(participant.groups) ? participant.groups : []),
    ...(Array.isArray(participant.groupIds) ? participant.groupIds : []),
    participant.group,
    participant.groupId,
  ]);
}

function replaceParticipantGroupId(participant, originalId, nextId) {
  const groups = normalizeParticipantGroupIds(participant).map((groupId) => (
    groupId === originalId ? nextId : groupId
  ));
  const group = String(participant.group || "").trim() === originalId
    ? nextId
    : String(participant.group || "").trim();

  return {
    ...participant,
    group,
    groups: uniqueGroupIds(groups),
  };
}

function removeParticipantGroupId(participant, groupId) {
  const groups = normalizeParticipantGroupIds(participant).filter((id) => id !== groupId);
  const currentGroup = String(participant.group || "").trim();

  return {
    ...participant,
    group: groups.includes(currentGroup) ? currentGroup : groups[0] || "",
    groups,
  };
}

function alignTieBundles(existing, incoming) {
  return alignSecondTieBundle(existing, incoming);
}

/**
 * Smart merge: prefer existing values, only fill gaps with new data
 */
function mergeResultsSmart(existing, newData) {
  const alignedNewData = alignTieBundles(existing, newData || {});
  const podiumChanged = hasPodiumStructureChanged(existing, alignedNewData);
  const merged = podiumChanged
    ? replacePositionalFields({ ...existing }, alignedNewData, { clearMissing: true })
    : { ...existing };
  
  // Only copy fields from newData if they don't exist or are empty in existing
  Object.keys(alignedNewData).forEach(key => {
    if (podiumChanged && RESULT_POSITIONAL_KEYS.includes(key)) {
      return;
    }
    const existingVal = merged[key];
    const newVal = alignedNewData[key];

    if (key === 'retiros' && hasNonEmptyValue(newVal)) {
      const withdrawals = mergeWithdrawalValues(existingVal, newVal);
      if (withdrawals.length > 0) {
        merged[key] = withdrawals;
      }
      return;
    }

    if (shouldApplyCorrectionValue(merged, key, newVal)) {
      merged[key] = newVal;
      return;
    }
    
    // Skip if existing has a value (prefer existing)
    if (hasNonEmptyValue(existingVal)) {
      return;
    }
    
    // Copy if new has a value
    if (hasNonEmptyValue(newVal)) {
      // Handle arrays (retiros) by merging
      if (key === 'retiros' && Array.isArray(existingVal) && Array.isArray(newVal)) {
        merged[key] = [...new Set([...existingVal, ...newVal])];
      } else {
        merged[key] = newVal;
      }
    }
  });
  
  // Special case: keep existing 'retiro1' and 'retiro2' if they exist
  if (merged.retiro1 || merged.retiro2) {
    // Keep them as is
  }
  
  return merged;
}

/**
 * Alternative merge: prefer new values, but keep existing if new is missing
 */
function mergeResultsNewFirst(existing, newData) {
  const alignedNewData = alignTieBundles(existing, newData || {});
  const merged = { ...alignedNewData };
  
  // Only copy from existing if new doesn't have the value
  Object.keys(existing).forEach(key => {
    const existingVal = existing[key];
    const newVal = merged[key];
    
    // Skip if new has a value
    if (hasNonEmptyValue(newVal)) {
      return;
    }
    
    // Copy if existing has a value
    if (hasNonEmptyValue(existingVal)) {
      merged[key] = existingVal;
    }
  });
  
  return merged;
}

function upsertEventMeta(eventId, meta) {
  const overrides = loadOverrides();
  const eventData = overrides.events[eventId] || { participants: [], results: {}, meta: {} };
  eventData.meta = {
    ...(eventData.meta || {}),
    ...(meta || {}),
  };
  overrides.events[eventId] = eventData;
  saveOverrides(overrides);
}

function copyEventResults(sourceEventId, targetEventIds, options = {}) {
  const overrides = loadOverrides();
  const sourceData = overrides.events[sourceEventId] || { participants: [], results: {}, meta: {} };
  const sourceResults = sourceData.results || {};
  const sourceMeta = sourceData.meta || {};
  const replace = options.replace !== false;

  targetEventIds.forEach((eventId) => {
    if (!eventId) return;
    const eventData = overrides.events[eventId] || { participants: [], results: {}, meta: {} };
    eventData.results = replace
      ? JSON.parse(JSON.stringify(sourceResults))
      : {
          ...(eventData.results || {}),
          ...JSON.parse(JSON.stringify(sourceResults)),
        };
    eventData.meta = {
      ...(eventData.meta || {}),
      ...(Number(sourceMeta.raceCount) > 0 ? { raceCount: Number(sourceMeta.raceCount) } : {}),
      copiedResultsFrom: sourceEventId,
      copiedResultsAt: new Date().toISOString(),
    };
    overrides.events[eventId] = eventData;
  });

  saveOverrides(overrides);
}

function upsertRegistryParticipant(participant) {
  const overrides = loadOverrides();
  const list = safeArray(overrides.registry);
  const name = String(participant.name || "").trim();
  const originalName = String(participant.originalName || "").trim();
  const lookupName = originalName || name;
  const idx = list.findIndex((item) => String(item.name || "").trim().toLowerCase() === lookupName.toLowerCase());
  const existing = idx >= 0 ? list[idx] : {};
  const requestedGroupIds = normalizeParticipantGroupIds(participant);
  const existingGroupIds = normalizeParticipantGroupIds(existing);
  const nextGroupIds = participant.replaceGroups === true
    ? requestedGroupIds
    : uniqueGroupIds([...existingGroupIds, ...requestedGroupIds]);
  const requestedPrimaryGroup = String(participant.group || "").trim();
  const existingPrimaryGroup = String(existing.group || "").trim();
  const primaryGroup = requestedPrimaryGroup || existingPrimaryGroup || nextGroupIds[0] || "";
  const normalized = {
    name,
    diaria: Boolean(participant.diaria),
    semanal: Boolean(participant.semanal),
    mensual: Boolean(participant.mensual),
    promo: Boolean(participant.promo),
    group: nextGroupIds.includes(primaryGroup) ? primaryGroup : nextGroupIds[0] || "",
    groups: nextGroupIds,
    promoPartners: Array.isArray(participant.promoPartners)
      ? [...new Set(participant.promoPartners.map((item) => String(item || "").trim()).filter(Boolean))]
      : [],
  };
  if (idx >= 0) {
    list[idx] = normalized;
  } else {
    list.push(normalized);
  }
  overrides.registry = list.sort((a, b) => a.name.localeCompare(b.name, "es"));
  saveOverrides(overrides);
}

function deleteRegistryParticipant(name) {
  const overrides = loadOverrides();
  const lookup = String(name || "").trim().toLowerCase();
  overrides.registry = safeArray(overrides.registry).filter((item) => String(item.name || "").trim().toLowerCase() !== lookup);
  saveOverrides(overrides);
}

function upsertRegistryGroup(group) {
  const overrides = loadOverrides();
  const groups = safeArray(overrides.settings.registryGroups);
  const originalId = String(group?.originalId || "").trim();
  const normalized = normalizeRegistryGroup(group, originalId || `grupo-${groups.length + 1}`);
  const targetId = originalId || normalized.id;
  const idx = groups.findIndex((item) => item.id === targetId);
  const nextGroups = idx >= 0
    ? groups.map((item, index) => (index === idx ? normalized : item))
    : [...groups, normalized];
  overrides.settings.registryGroups = nextGroups
    .filter((item) => item.id)
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "es"));

  if (originalId && originalId !== normalized.id) {
    overrides.registry = safeArray(overrides.registry).map((item) => (
      replaceParticipantGroupId(item, originalId, normalized.id)
    ));
    Object.keys(overrides.settings.campaigns || {}).forEach((kind) => {
      overrides.settings.campaigns[kind] = safeArray(overrides.settings.campaigns[kind]).map((campaign) => (
        String(campaign.groupId || "").trim() === originalId
          ? { ...campaign, groupId: normalized.id }
          : campaign
      ));
    });
  }

  saveOverrides(overrides);
}

function deleteRegistryGroup(groupId) {
  const overrides = loadOverrides();
  const targetId = String(groupId || "").trim();
  overrides.settings.registryGroups = safeArray(overrides.settings.registryGroups).filter((item) => item.id !== targetId);
  overrides.registry = safeArray(overrides.registry).map((item) => (
    removeParticipantGroupId(item, targetId)
  ));
  Object.keys(overrides.settings.campaigns || {}).forEach((kind) => {
    overrides.settings.campaigns[kind] = safeArray(overrides.settings.campaigns[kind]).map((campaign) => (
      String(campaign.groupId || "").trim() === targetId
        ? { ...campaign, groupId: "" }
        : campaign
    ));
  });
  saveOverrides(overrides);
}

function updateSettings(partialSettings) {
  const overrides = loadOverrides();
  overrides.settings = {
    ...overrides.settings,
    ...partialSettings,
    daily: {
      ...overrides.settings.daily,
      ...(partialSettings.daily || {}),
    },
    weekly: {
      ...overrides.settings.weekly,
      ...(partialSettings.weekly || {}),
    },
    monthly: {
      ...overrides.settings.monthly,
      ...(partialSettings.monthly || {}),
    },
    toteletras: {
      ...overrides.settings.toteletras,
      ...(partialSettings.toteletras || {}),
    },
    automation: {
      ...overrides.settings.automation,
      ...(partialSettings.automation || {}),
      selectedCaptureKeys: Array.isArray((partialSettings.automation || {}).selectedCaptureKeys)
        ? partialSettings.automation.selectedCaptureKeys.map((value) => String(value || "")).filter(Boolean)
        : overrides.settings.automation.selectedCaptureKeys,
    },
    themes: {
      ...overrides.settings.themes,
      ...(partialSettings.themes || {}),
    },
    campaigns: {
      daily: Array.isArray((partialSettings.campaigns || {}).daily)
        ? partialSettings.campaigns.daily
        : overrides.settings.campaigns.daily,
      weekly: Array.isArray((partialSettings.campaigns || {}).weekly)
        ? partialSettings.campaigns.weekly
        : overrides.settings.campaigns.weekly,
      monthly: Array.isArray((partialSettings.campaigns || {}).monthly)
        ? partialSettings.campaigns.monthly
        : overrides.settings.campaigns.monthly,
    },
    registryGroups: Array.isArray(partialSettings.registryGroups)
      ? partialSettings.registryGroups.map((group, index) => normalizeRegistryGroup(group, `grupo-${index + 1}`)).filter((group) => group.id)
      : overrides.settings.registryGroups,
    adminUsers: Array.isArray(partialSettings.adminUsers)
      ? partialSettings.adminUsers.map((user, index) => normalizeAdminUser(user, `admin-${index + 1}`)).filter((user) => user.id && user.username)
      : overrides.settings.adminUsers,
    excel: {
      ...overrides.settings.excel,
      ...(partialSettings.excel || {}),
    },
    prizes: {
      ...overrides.settings.prizes,
      ...(partialSettings.prizes || {}),
      daily: {
        ...overrides.settings.prizes.daily,
        ...((partialSettings.prizes || {}).daily || {}),
      },
      weekly: {
        ...overrides.settings.prizes.weekly,
        ...((partialSettings.prizes || {}).weekly || {}),
      },
      monthly: {
        ...overrides.settings.prizes.monthly,
        ...((partialSettings.prizes || {}).monthly || {}),
      },
      payout: {
        ...overrides.settings.prizes.payout,
        ...((partialSettings.prizes || {}).payout || {}),
      },
    },
  };
  saveOverrides(overrides);
}

function getCampaignEventIds(campaign) {
  if (!campaign) return [];
  if (Array.isArray(campaign.eventIds) && campaign.eventIds.length) return campaign.eventIds;
  if (campaign.eventId) return [campaign.eventId];
  return [];
}

function clearEventData(eventIds) {
  const overrides = loadOverrides();
  eventIds.forEach((eventId) => {
    delete overrides.events[eventId];
  });
  saveOverrides(overrides);
}

function updateCampaign(kind, id, updates) {
  const overrides = loadOverrides();
  const list = Array.isArray(overrides.settings.campaigns?.[kind]) ? overrides.settings.campaigns[kind] : [];
  
  console.log(`\n🔄 [CAMPAIGN-UPDATE] Actualizando campaña '${id}' en ${kind}`);
  console.log(`[CAMPAIGN-UPDATE] Updates:`, JSON.stringify(updates, null, 2));
  
  const updatedList = list.map((campaign) => {
    if (campaign.id === id) {
      console.log(`[CAMPAIGN-UPDATE] Campaña encontrada, aplicando updates...`);
      console.log(`[CAMPAIGN-UPDATE] Antes:`, JSON.stringify(campaign, null, 2));
      const updated = { ...campaign, ...updates, lastModified: new Date().toISOString() };
      console.log(`[CAMPAIGN-UPDATE] Después:`, JSON.stringify(updated, null, 2));
      return updated;
    }
    return campaign;
  });
  
  const wasFound = list.some(c => c.id === id);
  if (!wasFound) {
    console.error(`❌ [CAMPAIGN-UPDATE] Error: Campaña '${id}' no encontrada en ${kind}`);
    throw new Error(`Campaña '${id}' no encontrada en ${kind}`);
  }
  
  overrides.settings.campaigns[kind] = updatedList;
  saveOverrides(overrides);
  console.log(`✅ [CAMPAIGN-UPDATE] Campaña '${id}' actualizada exitosamente\n`);
}

function deleteCampaign(kind, id, options = {}) {
  const overrides = loadOverrides();
  const list = Array.isArray(overrides.settings.campaigns?.[kind]) ? overrides.settings.campaigns[kind] : [];
  const campaign = list.find((item) => item.id === id);
  
  console.log(`\n🗑️ [CAMPAIGN-DELETE] Eliminando campaña '${id}' en ${kind}`);
  console.log(`[CAMPAIGN-DELETE] Campaña encontrada:`, campaign ? JSON.stringify(campaign, null, 2) : 'NO');
  console.log(`[CAMPAIGN-DELETE] Clear events:`, options.clearEvents);
  
  if (!campaign) {
    console.error(`❌ [CAMPAIGN-DELETE] Error: Campaña '${id}' no encontrada en ${kind}`);
    throw new Error(`Campaña '${id}' no encontrada en ${kind}`);
  }
  
  overrides.settings.campaigns[kind] = list.filter((item) => item.id !== id);
  
  if (options.clearEvents) {
    const eventIds = getCampaignEventIds(campaign);
    console.log(`[CAMPAIGN-DELETE] Limpiando eventos:`, JSON.stringify(eventIds));
    eventIds.forEach((eventId) => {
      delete overrides.events[eventId];
    });
  }
  
  saveOverrides(overrides);
  console.log(`✅ [CAMPAIGN-DELETE] Campaña '${id}' eliminada exitosamente\n`);
}

function upsertProgram(program) {
  const overrides = loadOverrides();
  const date = String(program?.date || "").trim();
  const trackId = String(program?.trackId || "").trim();
  if (!date || !trackId) return overrides;
  const key = createProgramKey(date, trackId);
  overrides.programs = normalizeProgramsMap({
    ...(overrides.programs || {}),
    [key]: {
      ...(overrides.programs || {})[key],
      ...program,
      date,
      trackId,
      importedAt: program?.importedAt || new Date().toISOString(),
    },
  });
  saveOverrides(overrides);
  return overrides;
}

function deleteProgram(date, trackId) {
  const overrides = loadOverrides();
  const key = createProgramKey(date, trackId);
  if (overrides.programs && Object.prototype.hasOwnProperty.call(overrides.programs, key)) {
    delete overrides.programs[key];
  }
  saveOverrides(overrides);
  return overrides;
}

// ===== JORNADA SERVER-SIDE STORAGE =====

function loadJornada(fecha) {
  ensureStorage();
  const raw = fs.readFileSync(OVERRIDES_FILE, "utf8");
  const parsed = JSON.parse(raw || "{}");
  return (parsed.jornadas || {})[fecha] || null;
}

function saveJornadaServer(fecha, jornada) {
  ensureStorage();
  const raw = fs.readFileSync(OVERRIDES_FILE, "utf8");
  const parsed = JSON.parse(raw || "{}");
  if (!parsed.jornadas) parsed.jornadas = {};
  const savedJornada = { ...jornada, updatedAt: new Date().toISOString() };
  parsed.jornadas[fecha] = savedJornada;
  syncJornadaResultsToImportedEvent(parsed, fecha, savedJornada);
  backupCurrentOverrides();
  writeJsonAtomic(OVERRIDES_FILE, parsed);
  return parsed.jornadas[fecha];
}

function syncJornadaResultsToImportedEvent(parsed, fecha, jornada) {
  if (!fecha || !jornada?.races || typeof jornada.races !== "object") return;

  if (!parsed.events) parsed.events = {};
  const eventId = `imported-${fecha}`;
  syncJornadaResultsToEvent(parsed, fecha, jornada, eventId, {
    source: "jornada",
    visibleInAdmin: true,
  });

  resolveCampaignResultTargetEventIds(parsed, fecha, jornada).forEach((target) => {
    syncJornadaResultsToEvent(parsed, fecha, jornada, target.eventId, {
      campaignId: target.campaignId,
      campaignType: target.campaignType,
      title: target.title,
      source: "jornada",
      visibleInAdmin: true,
    });
  });
}

function syncJornadaResultsToEvent(parsed, fecha, jornada, eventId, meta = {}) {
  if (!eventId) return;

  const eventData = parsed.events[eventId] || { participants: [], results: {}, meta: {} };
  eventData.results = eventData.results || {};

  Object.entries(jornada.races).forEach(([raceKey, race]) => {
    const normalized = mapJornadaRaceToEventResult(race, raceKey);
    if (!normalized) return;
    const resultKey = String(normalized.race || raceKey);
    const existingResult = eventData.results[resultKey] || {};
    eventData.results[resultKey] = mergeJornadaResultIntoEventResult(
      existingResult,
      normalized,
      getManualOverrideFields(race),
    );
  });

  eventData.meta = {
    ...(eventData.meta || {}),
    date: fecha,
    ...meta,
    source: eventData.meta?.source || meta.source || "jornada",
    visibleInAdmin: meta.visibleInAdmin ?? true,
    lastUpdated: new Date().toISOString(),
  };
  parsed.events[eventId] = eventData;
}

function resolveCampaignResultTargetEventIds(parsed, fecha, jornada = {}) {
  const normalizedDate = normalizeDateKey(fecha);
  if (!normalizedDate) return [];

  const targets = new Map();
  const events = parsed.events || {};
  const campaigns = parsed.settings?.campaigns || {};
  const trackHints = collectJornadaTrackHints(jornada);

  Object.entries(campaigns).forEach(([kind, list]) => {
    if (!Array.isArray(list)) return;

    list.forEach((campaign) => {
      if (!campaign || campaign.enabled === false) return;
      if (!isCampaignActiveOnDate(campaign, kind, normalizedDate)) return;
      if (!campaignMatchesTrackHints(campaign, trackHints)) return;

      const campaignId = String(campaign.id || "").trim();
      if (!campaignId) return;
      const campaignType = campaignKindToType(kind);

      getExplicitCampaignEventIdsForDate(campaign, normalizedDate).forEach((eventId) => {
        addCampaignResultTarget(targets, eventId, campaignId, campaignType, campaign.name);
      });

      Object.keys(events).forEach((eventId) => {
        if (eventBelongsToCampaignDate(eventId, events[eventId], campaignId, normalizedDate)) {
          addCampaignResultTarget(targets, eventId, campaignId, campaignType, campaign.name);
        }
      });

      addCampaignResultTarget(
        targets,
        `campaign-${campaignId}-${normalizedDate}`,
        campaignId,
        campaignType,
        campaign.name,
      );

      if (campaignType === "diaria") {
        addCampaignResultTarget(targets, `campaign-${campaignId}`, campaignId, campaignType, campaign.name);
      }
    });
  });

  return Array.from(targets.values());
}

function addCampaignResultTarget(targets, eventId, campaignId, campaignType, title) {
  const id = String(eventId || "").trim();
  if (!id) return;
  targets.set(id, {
    eventId: id,
    campaignId,
    campaignType,
    title: title || "",
  });
}

function getExplicitCampaignEventIdsForDate(campaign, normalizedDate) {
  const ids = [];
  if (campaign.eventId) ids.push(campaign.eventId);
  if (Array.isArray(campaign.eventIds)) ids.push(...campaign.eventIds);
  return ids
    .map((eventId) => String(eventId || "").trim())
    .filter(Boolean)
    .filter((eventId) => {
      const eventDate = normalizeDateKey(eventId);
      return !eventDate || eventDate === normalizedDate;
    });
}

function eventBelongsToCampaignDate(eventId, eventData, campaignId, normalizedDate) {
  const id = String(eventId || "");
  if (!id.includes(campaignId)) return false;

  const explicitCampaignId = String(eventData?.campaignId || eventData?.meta?.campaignId || "").trim();
  if (explicitCampaignId && explicitCampaignId !== campaignId) return false;

  const eventDate = normalizeDateKey(eventData?.meta?.date || eventData?.date || eventId);
  return !eventDate || eventDate === normalizedDate;
}

function campaignKindToType(kind) {
  if (kind === "daily") return "diaria";
  if (kind === "weekly") return "semanal";
  if (kind === "monthly") return "mensual";
  return kind || "";
}

function isCampaignActiveOnDate(campaign, kind, normalizedDate) {
  if (kind === "daily") {
    return normalizeDateKey(campaign.date) === normalizedDate;
  }

  const startDate = normalizeDateKey(campaign.startDate);
  const endDate = normalizeDateKey(campaign.endDate);
  if (startDate && normalizedDate < startDate) return false;
  if (endDate && normalizedDate > endDate) return false;
  return Boolean(startDate || endDate);
}

function collectJornadaTrackHints(jornada) {
  return [
    jornada?.trackId,
    jornada?.trackName,
    jornada?.hipodromo,
    jornada?.hipodromoId,
  ]
    .map(normalizeTrackText)
    .filter(Boolean);
}

function campaignMatchesTrackHints(campaign, trackHints) {
  if (!trackHints.length) return true;

  const campaignHints = [
    campaign?.trackId,
    campaign?.hippodrome,
    ...(Array.isArray(campaign?.hipodromos) ? campaign.hipodromos : []),
  ]
    .map(normalizeTrackText)
    .filter(Boolean);

  if (!campaignHints.length) return true;
  return campaignHints.some((campaignHint) =>
    trackHints.some((trackHint) => campaignHint.includes(trackHint) || trackHint.includes(campaignHint))
  );
}

function normalizeDateKey(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const ymd = raw.match(/(\d{4}-\d{2}-\d{2})/);
  if (ymd) return ymd[1];
  const latin = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (latin) {
    return `${latin[3]}-${latin[2].padStart(2, "0")}-${latin[1].padStart(2, "0")}`;
  }
  return "";
}

function normalizeTrackText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ");
}

function mapJornadaRaceToEventResult(race, raceKey) {
  if (!race || typeof race !== "object") return null;
  const raceNumber = Number(race.raceNumber || race.race || raceKey);
  if (!Number.isFinite(raceNumber) || raceNumber <= 0) return null;

  const winner = race.winner || {};
  const second = race.second || {};
  const third = race.third || {};
  const favorite = race.favorite || {};
  const result = {
    race: String(raceNumber),
    primero: normalizeRunnerNumber(winner.number),
    nombrePrimero: String(winner.name || "").trim(),
    ganador: winner.dividend ?? "",
    divSegundoPrimero: winner.divSegundo ?? "",
    divTerceroPrimero: winner.divTercero ?? "",
    segundo: normalizeRunnerNumber(second.number),
    nombreSegundo: String(second.name || "").trim(),
    divSegundo: second.dividend ?? "",
    divTerceroSegundo: second.divTercero ?? "",
    tercero: normalizeRunnerNumber(third.number),
    nombreTercero: String(third.name || "").trim(),
    divTercero: third.dividend ?? "",
    favorito: normalizeRunnerNumber(favorite.number),
    nombreFavorito: String(favorite.name || "").trim(),
    retiros: normalizeJornadaWithdrawals(race.withdrawals),
    complete: Boolean(winner.number),
    source: Array.isArray(race.manualOverrides) && race.manualOverrides.length > 0
      ? "jornada-manual"
      : "jornada",
  };

  applyJornadaTies(result, race.ties);
  return result;
}

function applyJornadaTies(result, ties) {
  if (!Array.isArray(ties)) return;

  ties.forEach((tie) => {
    const position = Number(tie?.position);
    if (position === 1) {
      result.empatePrimero = normalizeRunnerNumber(tie.number);
      result.nombreEmpatePrimero = String(tie.name || "").trim();
      result.empatePrimeroGanador = tie.dividend ?? "";
      result.empatePrimeroDivSegundo = tie.divSegundo ?? "";
      result.empatePrimeroDivTercero = tie.divTercero ?? "";
    }
    if (position === 2) {
      result.empateSegundo = normalizeRunnerNumber(tie.number);
      result.nombreEmpateSegundo = String(tie.name || "").trim();
      result.empateSegundoDivSegundo = tie.dividend ?? "";
      result.empateSegundoDivTercero = tie.divTercero ?? "";
    }
    if (position === 3) {
      result.empateTercero = normalizeRunnerNumber(tie.number);
      result.nombreEmpateTercero = String(tie.name || "").trim();
      result.empateTerceroDivTercero = tie.dividend ?? "";
    }
  });
}

function mergeJornadaResultIntoEventResult(existing, jornadaResult, manualFields = new Set()) {
  const merged = { ...(existing || {}) };

  Object.entries(jornadaResult || {}).forEach(([key, value]) => {
    const force = shouldForceJornadaField(key, manualFields);
    if (force || hasNonEmptyValue(value)) {
      merged[key] = value;
    }
  });

  return merged;
}

function shouldForceJornadaField(key, manualFields) {
  if (!manualFields || manualFields.size === 0) return false;
  if (["primero", "nombrePrimero", "ganador", "divSegundoPrimero", "divTerceroPrimero"].includes(key)) {
    return manualFields.has("winner");
  }
  if (["segundo", "nombreSegundo", "divSegundo", "divTerceroSegundo"].includes(key)) {
    return manualFields.has("second");
  }
  if (["tercero", "nombreTercero", "divTercero"].includes(key)) {
    return manualFields.has("third");
  }
  if (["favorito", "nombreFavorito"].includes(key)) {
    return manualFields.has("favorite");
  }
  if (key === "retiros") {
    return manualFields.has("withdrawals");
  }
  return false;
}

function getManualOverrideFields(race) {
  return new Set(
    (Array.isArray(race?.manualOverrides) ? race.manualOverrides : [])
      .map((override) => String(override?.field || "").split(".")[0])
      .filter(Boolean),
  );
}

function normalizeJornadaWithdrawals(withdrawals) {
  return safeArray(withdrawals)
    .map((item) => {
      if (item && typeof item === "object") {
        return normalizeRunnerNumber(item.number ?? item.numero ?? item.id ?? "");
      }
      return normalizeRunnerNumber(item);
    })
    .filter(Boolean);
}

function listJornadaDates() {
  try {
    ensureStorage();
    const raw = fs.readFileSync(OVERRIDES_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return Object.keys(parsed.jornadas || {});
  } catch {
    return [];
  }
}

module.exports = {
  AUDIT_LOG_FILE,
  OVERRIDES_FILE,
  appendAuditLog,
  clearEventData,
  deleteCampaign,
  deleteProgram,
  copyEventResults,
  deleteParticipant,
  deleteRegistryGroup,
  deleteRegistryParticipant,
  loadAuditLog,
  loadOverrides,
  saveOverrides,
  upsertEventMeta,
  upsertParticipant,
  upsertRegistryGroup,
  upsertProgram,
  upsertResult,
  upsertResultIncremental,  // ✅ NEW: Incremental upsert
  isRaceComplete,           // ✅ NEW: Check completeness
  upsertRegistryParticipant,
  updateCampaign,
  updateSettings,
  loadJornada,
  saveJornadaServer,
  listJornadaDates,
  prepareManualResultPayload,
  resolveCampaignResultTargetEventIds,
};
