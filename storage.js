const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "data");
const OVERRIDES_FILE = path.join(DATA_DIR, "overrides.json");
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
  if (!fs.existsSync(OVERRIDES_FILE)) {
    fs.writeFileSync(
      OVERRIDES_FILE,
      JSON.stringify({ events: {}, registry: [], settings: createDefaultSettings() }, null, 2),
      "utf8",
    );
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
  fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(data, null, 2), "utf8");
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
    console.log(`⏭️ [INCREMENTAL] Carrera ${race} ya está completa, saltando...`);
    return { skipped: true, reason: 'already_complete' };
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

/**
 * Smart merge: prefer existing values, only fill gaps with new data
 */
function mergeResultsSmart(existing, newData) {
  const merged = { ...existing };
  
  // Only copy fields from newData if they don't exist or are empty in existing
  Object.keys(newData).forEach(key => {
    const existingVal = merged[key];
    const newVal = newData[key];
    
    // Skip if existing has a value (prefer existing)
    if (existingVal !== undefined && existingVal !== null && existingVal !== '') {
      return;
    }
    
    // Copy if new has a value
    if (newVal !== undefined && newVal !== null && newVal !== '') {
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
  const merged = { ...newData };
  
  // Only copy from existing if new doesn't have the value
  Object.keys(existing).forEach(key => {
    const existingVal = existing[key];
    const newVal = merged[key];
    
    // Skip if new has a value
    if (newVal !== undefined && newVal !== null && newVal !== '') {
      return;
    }
    
    // Copy if existing has a value
    if (existingVal !== undefined && existingVal !== null && existingVal !== '') {
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
  const normalized = {
    name,
    diaria: Boolean(participant.diaria),
    semanal: Boolean(participant.semanal),
    mensual: Boolean(participant.mensual),
    promo: Boolean(participant.promo),
    group: String(participant.group || "").trim(),
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
      String(item.group || "").trim() === originalId
        ? { ...item, group: normalized.id }
        : item
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
    String(item.group || "").trim() === targetId
      ? { ...item, group: "" }
      : item
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
  parsed.jornadas[fecha] = { ...jornada, updatedAt: new Date().toISOString() };
  fs.writeFileSync(OVERRIDES_FILE, JSON.stringify(parsed, null, 2), "utf8");
  return parsed.jornadas[fecha];
}

function listJornadaDates() {
  try {
    const raw = fs.readFileSync(OVERRIDES_FILE, "utf8");
    const parsed = JSON.parse(raw || "{}");
    return Object.keys(parsed.jornadas || {});
  } catch {
    return [];
  }
}

module.exports = {
  OVERRIDES_FILE,
  clearEventData,
  deleteCampaign,
  deleteProgram,
  copyEventResults,
  deleteParticipant,
  deleteRegistryGroup,
  deleteRegistryParticipant,
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
};
