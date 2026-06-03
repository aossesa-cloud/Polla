const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const { loadData } = require("../parser");
const { loadOverrides } = require("../storage");
const { addBandejaPicksSheet, extractBandejaRows } = require("./import-picks-from-excel");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "outputs");
const DEFAULT_OUTPUT = path.join(OUTPUT_DIR, "Libro Maestro Polla Hipica Compacto.xlsx");
const MAX_RACES = 30;
const LEGACY_FILES = [
  {
    file: path.join(ROOT, "DIARIA Y SEMANAL.xlsm"),
    prefix: "DS",
    label: "Diaria y Semanal antigua",
  },
  {
    file: path.join(ROOT, "POLLA MENSUAL.xlsx"),
    prefix: "MENS",
    label: "Mensual antigua",
  },
];

const PALETTE = {
  turf: "0B3D2E",
  turf2: "146C43",
  gold: "C6A15B",
  ink: "111827",
  blue: "1F4E79",
  red: "8E2C2C",
  paper: "F8FAF7",
  line: "CBD5E1",
  softGold: "FFF2CC",
  softGreen: "E2F0D9",
  softBlue: "DDEBF7",
  softRed: "F4CCCC",
  white: "FFFFFF",
};

function argb(hex) {
  return `FF${String(hex || "").replace("#", "").toUpperCase()}`;
}

function text(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function moneyFormat() {
  return '"$"#,##0;[Red]-"$"#,##0;"-"';
}

function pctFormat() {
  return '0.0%';
}

function normalizeIdPart(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function kindLabel(kind) {
  const safe = text(kind).toLowerCase();
  if (safe === "daily" || safe === "diaria") return "Diaria";
  if (safe === "weekly" || safe === "semanal") return "Semanal";
  if (safe === "monthly" || safe === "mensual") return "Mensual";
  return text(kind) || "General";
}

function kindKey(label) {
  const safe = text(label).toLowerCase();
  if (safe.startsWith("diar")) return "daily";
  if (safe.startsWith("seman")) return "weekly";
  if (safe.startsWith("mens")) return "monthly";
  return safe;
}

function campaignRows(overrides) {
  const campaigns = overrides.settings?.campaigns || {};
  return ["daily", "weekly", "monthly"].flatMap((kind) =>
    (campaigns[kind] || []).map((campaign) => ({
      kind,
      label: kindLabel(kind),
      id: text(campaign.id),
      name: text(campaign.name),
      enabled: campaign.enabled !== false,
      groupId: text(campaign.groupId),
      startDate: text(campaign.startDate || campaign.date),
      endDate: text(campaign.endDate || campaign.date),
      date: text(campaign.date),
      raceCount: number(campaign.raceCount, ""),
      entryValue: number(campaign.entryValue, 0),
      promoEnabled: Boolean(campaign.promoEnabled),
      promoPrice: number(campaign.promoPrice, 0),
      format: text(campaign.format || campaign.competitionMode || "individual"),
      firstPct: number(campaign.payout?.firstPct ?? overrides.settings?.prizes?.payout?.firstPct, 70) / 100,
      secondPct: number(campaign.payout?.secondPct ?? overrides.settings?.prizes?.payout?.secondPct, 20) / 100,
      thirdPct: number(campaign.payout?.thirdPct ?? overrides.settings?.prizes?.payout?.thirdPct, 0) / 100,
      adminPct: number(campaign.payout?.adminPct ?? overrides.settings?.prizes?.payout?.adminPct, 10) / 100,
      raw: campaign,
    })),
  );
}

function collectCampaignEventIds(campaignRow) {
  const campaign = campaignRow.raw || {};
  const ids = new Set();
  if (campaign.eventId) ids.add(text(campaign.eventId));
  (campaign.eventIds || []).forEach((id) => ids.add(text(id)));

  if (campaignRow.kind === "daily") {
    ids.add(`campaign-${campaign.id}`);
    ids.add(`campaign-daily-${campaign.id}`);
    ids.add(`campaign-diaria-${campaign.id}`);
  }

  if (campaignRow.kind === "weekly" && !ids.size) {
    (campaign.activeDays || []).forEach((day) => ids.add(`${campaign.id}-${normalizeIdPart(day)}`));
  }

  if (campaignRow.kind === "monthly" && !ids.size) {
    ids.add(`${campaign.id}-general`);
  }

  return Array.from(ids).filter(Boolean);
}

function buildEventIndex(events, campaigns) {
  const byId = new Map();
  campaigns.forEach((campaign) => {
    collectCampaignEventIds(campaign).forEach((id) => {
      byId.set(id, campaign);
    });
  });

  return events.map((event) => {
    const direct = byId.get(event.id);
    const byContain = campaigns.find((campaign) => event.id.includes(campaign.id));
    const metaType = kindLabel(event.meta?.campaignType || "");
    const inferred = direct || byContain;
    const label = inferred?.label || (metaType !== "General" ? metaType : (event.type === "mensual" ? "Mensual" : "Semanal"));
    return {
      ...event,
      displayKind: label,
      campaign: inferred || null,
    };
  });
}

function uniqueParticipants(events) {
  const names = new Set();
  events.forEach((event) => {
    (event.participants || []).forEach((participant) => {
      const name = text(participant.name);
      if (name) names.add(name.toLowerCase());
    });
  });
  return names.size;
}

function countRegistered(campaign, data, events) {
  const registered = Array.isArray(campaign.raw?.registeredParticipants)
    ? campaign.raw.registeredParticipants.length
    : 0;
  if (registered) return registered;

  const relatedIds = new Set(collectCampaignEventIds(campaign));
  const relatedEvents = events.filter((event) => relatedIds.has(event.id) || event.id.includes(campaign.id));
  const eventCount = uniqueParticipants(relatedEvents);
  if (eventCount) return eventCount;

  const key = kindKey(campaign.label);
  return (data.registry || []).filter((participant) => Boolean(participant[key])).length;
}

function countPromo(campaign, data) {
  if (!campaign.promoEnabled) return 0;
  const key = kindKey(campaign.label);
  return (data.registry || []).filter((participant) => Boolean(participant[key]) && Boolean(participant.promo)).length;
}

function createWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Tablas Nuevas";
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.calcProperties.fullCalcOnLoad = true;
  return workbook;
}

function addSheet(workbook, name, tabColor = PALETTE.turf) {
  const sheet = workbook.addWorksheet(name, {
    views: [{ state: "frozen", ySplit: 3 }],
    properties: { tabColor: { argb: argb(tabColor) } },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });
  sheet.properties.defaultRowHeight = 20;
  sheet.properties.outlineLevelCol = 1;
  sheet.views = [{ state: "frozen", ySplit: 3 }];
  return sheet;
}

function styleTitle(sheet, title, subtitle, columnCount) {
  sheet.mergeCells(1, 1, 1, columnCount);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 18, color: { argb: argb(PALETTE.white) } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(PALETTE.turf) } };
  titleCell.alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 30;

  sheet.mergeCells(2, 1, 2, columnCount);
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = subtitle;
  subtitleCell.font = { italic: true, color: { argb: argb(PALETTE.ink) } };
  subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(PALETTE.paper) } };
  subtitleCell.alignment = { vertical: "middle", horizontal: "left" };
}

function styleHeader(row, fill = PALETTE.blue) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: argb(PALETTE.white) } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(fill) } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = {
      top: { style: "thin", color: { argb: argb(PALETTE.line) } },
      left: { style: "thin", color: { argb: argb(PALETTE.line) } },
      bottom: { style: "thin", color: { argb: argb(PALETTE.line) } },
      right: { style: "thin", color: { argb: argb(PALETTE.line) } },
    };
  });
  row.height = 24;
}

function styleBodyRow(row, rowIndex) {
  row.eachCell((cell) => {
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.border = {
      bottom: { style: "hair", color: { argb: argb(PALETTE.line) } },
    };
    if (rowIndex % 2 === 0) {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb("F8FAFC") } };
    }
  });
}

function writeTable(sheet, startRow, headers, rows, options = {}) {
  const headerRow = sheet.getRow(startRow);
  headerRow.values = headers;
  styleHeader(headerRow, options.headerColor || PALETTE.blue);

  rows.forEach((values, offset) => {
    const row = sheet.getRow(startRow + 1 + offset);
    values.forEach((value, index) => {
      row.getCell(index + 1).value = value;
    });
    styleBodyRow(row, offset);
  });

  const lastRow = Math.max(startRow + rows.length, startRow + 1);
  sheet.autoFilter = {
    from: { row: startRow, column: 1 },
    to: { row: lastRow, column: headers.length },
  };
  return lastRow + 2;
}

function setWidths(sheet, widths) {
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
}

function applyCurrency(sheet, columns, startRow, endRow) {
  columns.forEach((col) => {
    for (let row = startRow; row <= endRow; row += 1) {
      sheet.getCell(row, col).numFmt = moneyFormat();
    }
  });
}

function applyPercent(sheet, columns, startRow, endRow) {
  columns.forEach((col) => {
    for (let row = startRow; row <= endRow; row += 1) {
      sheet.getCell(row, col).numFmt = pctFormat();
    }
  });
}

function makeDashboard(workbook, data, campaigns, events) {
  const sheet = addSheet(workbook, "Panel", PALETTE.turf);
  styleTitle(sheet, "Libro Maestro Polla Hipica", "Vista central para campanas, premios, programa, resultados y rankings", 10);
  setWidths(sheet, [22, 18, 18, 18, 18, 16, 16, 18, 18, 18]);

  const activeCampaigns = campaigns.filter((campaign) => campaign.enabled);
  const racesWithResults = events.reduce((sum, event) => sum + (event.results || []).filter((result) => text(result.primero)).length, 0);
  const kpis = [
    ["Participantes maestro", (data.registry || []).length],
    ["Campanas activas", activeCampaigns.length],
    ["Eventos con datos", events.length],
    ["Carreras con resultado", racesWithResults],
    ["Programas guardados", Object.keys(data.programs || {}).length],
  ];

  writeTable(sheet, 4, ["Indicador", "Valor"], kpis, { headerColor: PALETTE.turf2 });

  const rows = activeCampaigns.map((campaign) => [
    campaign.label,
    campaign.name,
    campaign.startDate,
    campaign.endDate,
    campaign.entryValue,
    campaign.promoEnabled ? "Si" : "No",
    campaign.format,
  ]);
  writeTable(sheet, 12, ["Tipo", "Campana", "Inicio", "Fin", "Entrada", "Promo", "Formato"], rows, { headerColor: PALETTE.red });
  applyCurrency(sheet, [5], 13, 13 + rows.length);

  sheet.getCell("D4").value = "Flujo recomendado";
  sheet.getCell("D4").font = { bold: true, color: { argb: argb(PALETTE.white) } };
  sheet.getCell("D4").fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(PALETTE.gold) } };
  const flow = [
    "1. Editar Configuracion y Campanas si cambian valores o premios.",
    "2. Ejecutar npm run excel:update para importar programa/resultados y regenerar el libro.",
    "3. Revisar Ranking Diaria, Ranking Semanal, Ranking Mensual y Premios.",
    "4. Compartir desde Excel usando las tablas antiguas o exportando la hoja necesaria.",
  ];
  flow.forEach((line, index) => {
    const cell = sheet.getCell(5 + index, 4);
    cell.value = line;
    cell.alignment = { wrapText: true };
  });
}

function makeCampaigns(workbook, overrides, campaigns, data) {
  const sheet = addSheet(workbook, "Campañas", PALETTE.blue);
  styleTitle(sheet, "Campañas, Participantes y Premios", "Centro de configuracion: campanas activas, padron y reglas economicas", 12);
  setWidths(sheet, [14, 28, 18, 16, 14, 14, 14, 14, 14, 14, 14, 18]);

  const prizes = overrides.settings?.prizes || {};
  const payout = prizes.payout || {};
  const settingRows = [
    ["Diaria entrada", prizes.daily?.singlePrice || 0],
    ["Diaria promo activa", prizes.daily?.promoEnabled ? "Si" : "No"],
    ["Diaria promo cantidad", prizes.daily?.promoQuantity || 0],
    ["Diaria promo precio", prizes.daily?.promoPrice || 0],
    ["Semanal entrada", prizes.weekly?.entryPrice || 0],
    ["Mensual entrada", prizes.monthly?.entryPrice || 0],
    ["Premio 1 %", number(payout.firstPct, 70) / 100],
    ["Premio 2 %", number(payout.secondPct, 20) / 100],
    ["Premio 3 %", number(payout.thirdPct, 0) / 100],
    ["Admin %", number(payout.adminPct, 10) / 100],
  ];
  writeTable(sheet, 4, ["Parametro", "Valor"], settingRows, { headerColor: PALETTE.blue });
  applyCurrency(sheet, [2], 5, 10);
  applyPercent(sheet, [2], 11, 14);

  const campaignData = campaigns.map((campaign) => [
    campaign.label,
    campaign.id,
    campaign.name,
    campaign.enabled ? "Activa" : "Pausada",
    campaign.startDate,
    campaign.endDate,
    campaign.raceCount,
    campaign.entryValue,
    campaign.promoEnabled ? "Si" : "No",
    campaign.promoPrice,
    campaign.format,
    campaign.groupId,
  ]);
  const participantsStart = writeTable(sheet, 18, ["Tipo", "ID", "Nombre", "Estado", "Inicio", "Fin", "Carreras", "Entrada", "Promo", "Precio Promo", "Formato", "Grupo"], campaignData, { headerColor: PALETTE.turf });
  applyCurrency(sheet, [8, 10], 19, participantsStart);

  const participantRows = (data.registry || []).map((participant) => [
    participant.name,
    participant.diaria ? "Si" : "",
    participant.semanal ? "Si" : "",
    participant.mensual ? "Si" : "",
    participant.promo ? "Si" : "",
    participant.group || "",
    participant.groupName || "",
    participant.source || "",
    "",
  ]);
  writeTable(sheet, participantsStart + 2, ["Stud", "Diaria", "Semanal", "Mensual", "Promo", "Grupo ID", "Grupo", "Origen", "Notas"], participantRows, { headerColor: PALETTE.gold });
}

function makePrograms(workbook, data) {
  const sheet = addSheet(workbook, "Programa", PALETTE.turf2);
  styleTitle(sheet, "Programa", "Carreras y ejemplares importados desde Teletrak o cargados localmente", 10);
  setWidths(sheet, [14, 22, 10, 12, 32, 14, 14, 10, 34, 30]);

  const rows = [];
  Object.entries(data.programs || {}).forEach(([, program]) => {
    Object.values(program.races || {}).forEach((race) => {
      const entries = Array.isArray(race.entries) && race.entries.length ? race.entries : [{ number: "", name: "", jockey: "" }];
      entries.forEach((entry) => {
        rows.push([
          program.date,
          program.trackName || program.trackId,
          race.race,
          race.postTime,
          race.label,
          race.distance,
          race.surface,
          entry.number,
          entry.name,
          entry.jockey,
        ]);
      });
    });
  });

  writeTable(sheet, 4, ["Fecha", "Hipodromo", "Carrera", "Hora", "Nombre Carrera", "Distancia", "Superficie", "N", "Ejemplar", "Jinete"], rows, { headerColor: PALETTE.turf2 });
}

function eventDate(event) {
  const candidates = [
    event.meta?.date,
    event.date,
    event.operationDate,
    event.sheetName,
    event.id,
  ];
  for (const candidate of candidates) {
    const match = text(candidate).match(/\d{4}-\d{2}-\d{2}/);
    if (match) return match[0];
  }
  return "";
}

function eventTrack(event) {
  return text(event.meta?.trackName || event.trackName || event.meta?.hipodromo || event.programTrackId || "");
}

function resultStatus(result) {
  if (result?.manualOverride) return "Manual";
  if (text(result?.primero) && (text(result?.ganador) || text(result?.divSegundo) || text(result?.divTercero))) return "Completo";
  if (text(result?.primero)) return "Parcial";
  return "Pendiente";
}

function makeResults(workbook, events) {
  const sheet = addSheet(workbook, "Resultados", PALETTE.red);
  styleTitle(sheet, "Resultados", "Fuente oficial para calculo de puntajes: importacion automatica con proteccion para correcciones manuales", 27);
  setWidths(sheet, [
    12, 20, 28, 12, 10, 10, 12, 16, 16, 16, 10, 12, 16, 16,
    10, 12, 16, 10, 12, 12, 20, 14, 14, 14, 12, 28, 20,
  ]);

  const rows = [];
  events.forEach((event) => {
    (event.results || []).forEach((result) => {
      rows.push([
        eventDate(event),
        eventTrack(event),
        event.id,
        event.displayKind,
        result.race,
        result.primero,
        result.empatePrimero,
        result.ganador,
        result.divSegundoPrimero,
        result.divTerceroPrimero,
        result.segundo,
        result.empateSegundo,
        result.divSegundo,
        result.divTerceroSegundo,
        result.tercero,
        result.empateTercero,
        result.divTercero,
        result.favorito,
        result.retiro1 || (result.retiros || [])[0] || "",
        result.retiro2 || (result.retiros || [])[1] || "",
        text((result.retiros || []).join(", ")),
        resultStatus(result),
        result.source || (result.manualOverride ? "manual" : "teletrak/local"),
        result.manualOverride ? "Si" : "",
        result.manualOverride ? "Si" : "",
        result.observacion || result.note || "",
        result.updatedAt || result.importedAt || "",
      ]);
    });
  });

  writeTable(sheet, 4, [
    "Fecha",
    "Hipodromo",
    "Evento ID",
    "Tipo Campana",
    "Carrera",
    "Primero",
    "Empate Primero",
    "Div Primero Ganador",
    "Div Primero Segundo",
    "Div Primero Tercero",
    "Segundo",
    "Empate Segundo",
    "Div Segundo Segundo",
    "Div Segundo Tercero",
    "Tercero",
    "Empate Tercero",
    "Div Tercero Tercero",
    "Favorito",
    "Retirado 1",
    "Retirado 2",
    "Retirados",
    "Estado",
    "Fuente",
    "ManualOverride",
    "Bloqueado",
    "Observacion",
    "Actualizado",
  ], rows, { headerColor: PALETTE.red });
}

function makePicks(workbook, events) {
  const sheet = addSheet(workbook, "Pronosticos", PALETTE.blue);
  styleTitle(sheet, "Pronosticos", "Vista unica: tabla ancha de picks y validacion por carrera", 36);
  setWidths(sheet, [12, 28, 30, 8, 28, 12, ...Array.from({ length: MAX_RACES }, () => 10)]);

  const boardHeaders = ["Tipo", "Evento", "Evento ID", "N", "Stud", "Total", ...Array.from({ length: MAX_RACES }, (_, index) => `C${index + 1}`)];
  const boardRows = [];
  events.forEach((event) => {
    (event.participants || []).forEach((participant) => {
      boardRows.push([
        event.displayKind,
        event.title || event.sheetName,
        event.id,
        participant.index,
        participant.name,
        participant.points || 0,
        ...Array.from({ length: MAX_RACES }, (_, index) => {
          const pick = participant.picks?.[index];
          if (!pick?.horse) return "";
          const score = Number(pick.score) || 0;
          return score ? `${pick.horse} (${score})` : text(pick.horse);
        }),
      ]);
    });
  });
  const nextRow = writeTable(sheet, 4, boardHeaders, boardRows, { headerColor: PALETTE.blue });

  sheet.getCell(nextRow, 1).value = "Validacion por carrera";
  sheet.getCell(nextRow, 1).font = { bold: true, size: 14, color: { argb: argb(PALETTE.white) } };
  sheet.getCell(nextRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(PALETTE.red) } };

  const rows = [];
  events.forEach((event) => {
    (event.participants || []).forEach((participant) => {
      (participant.picks || []).forEach((pick) => {
        const resultMap = new Map((event.results || []).map((result) => [String(result.race), result]));
        const result = resultMap.get(String(pick.race || pick.raceLabel));
        rows.push([
          event.displayKind,
          event.id,
          event.title || event.sheetName,
          participant.index,
          participant.name,
          pick.race,
          pick.horse,
          pick.score || 0,
          resultSummaryForPick(result),
          (pick.score || 0) > 0 ? "Si" : "No",
          participant.points || 0,
          event.races || "",
        ]);
      });
    });
  });

  writeTable(sheet, nextRow + 1, ["Tipo", "Evento ID", "Evento", "N", "Stud", "Carrera", "Pick", "Puntos Carrera", "Resultado", "Sumo", "Puntos Evento", "Carreras"], rows, { headerColor: PALETTE.red });
}

function findProgramRunnerName(data, event, raceNumber, horseNumber) {
  const lookup = text(horseNumber);
  if (!lookup) return "";
  const eventDate = text(event.meta?.date || event.date || event.sheetName).match(/\d{4}-\d{2}-\d{2}/)?.[0] || "";
  const programs = Object.values(data.programs || {}).filter((program) => !eventDate || text(program.date) === eventDate);
  for (const program of programs) {
    const race = program.races?.[String(raceNumber)];
    const entry = (race?.entries || []).find((item) => text(item.number) === lookup);
    if (entry) return text(entry.name);
  }
  return "";
}

function resultSummaryForPick(result) {
  if (!result) return "";
  const parts = [
    result.primero ? `1: ${result.primero}` : "",
    result.segundo ? `2: ${result.segundo}` : "",
    result.tercero ? `3: ${result.tercero}` : "",
    result.favorito ? `Fav: ${result.favorito}` : "",
  ].filter(Boolean);
  return parts.join(" | ");
}

function makePickValidation(workbook, data, events) {
  const sheet = addSheet(workbook, "Validacion Picks", PALETTE.red);
  styleTitle(sheet, "Validacion Picks", "Cada pronostico con resultado, puntaje y lectura por carrera", 13);
  setWidths(sheet, [12, 30, 34, 28, 8, 10, 30, 22, 28, 12, 12, 18, 20]);

  const rows = [];
  events.forEach((event) => {
    const resultMap = new Map((event.results || []).map((result) => [String(result.race), result]));
    (event.participants || []).forEach((participant) => {
      (participant.picks || []).forEach((pick) => {
        const result = resultMap.get(String(pick.race || pick.raceLabel));
        const runnerName = findProgramRunnerName(data, event, pick.race || pick.raceLabel, pick.horse);
        rows.push([
          event.displayKind,
          event.id,
          event.title || event.sheetName,
          participant.name,
          participant.index,
          pick.race || pick.raceLabel,
          pick.horse,
          runnerName,
          resultSummaryForPick(result),
          pick.score || 0,
          (pick.score || 0) > 0 ? "Si" : "No",
          participant.points || 0,
          event.scoring?.mode || "",
        ]);
      });
    });
  });

  writeTable(sheet, 4, ["Tipo", "Evento ID", "Evento", "Stud", "N", "Carrera", "Pick", "Ejemplar", "Resultado", "Puntos C", "Sumo", "Total Stud", "Regla"], rows, { headerColor: PALETTE.red });
}

function makePicksBoard(workbook, events) {
  const sheet = addSheet(workbook, "Tabla Pronosticos", PALETTE.blue);
  styleTitle(sheet, "Tabla Pronosticos", "Vista ancha para revisar rapidamente donde quedo cargado cada stud", 34);
  setWidths(sheet, [12, 28, 30, 8, 28, 12, ...Array.from({ length: MAX_RACES }, () => 10)]);

  const headers = ["Tipo", "Evento", "Evento ID", "N", "Stud", "Total", ...Array.from({ length: MAX_RACES }, (_, index) => `C${index + 1}`)];
  const rows = [];
  events.forEach((event) => {
    (event.participants || []).forEach((participant) => {
      rows.push([
        event.displayKind,
        event.title || event.sheetName,
        event.id,
        participant.index,
        participant.name,
        participant.points || 0,
        ...Array.from({ length: MAX_RACES }, (_, index) => {
          const pick = participant.picks?.[index];
          if (!pick?.horse) return "";
          const score = Number(pick.score) || 0;
          return score ? `${pick.horse} (${score})` : text(pick.horse);
        }),
      ]);
    });
  });

  writeTable(sheet, 4, headers, rows, { headerColor: PALETTE.blue });
}

function makeInputGuide(workbook) {
  const sheet = addSheet(workbook, "Ingreso Picks", PALETTE.gold);
  styleTitle(sheet, "Ingreso Picks", "Bandeja de trabajo para cargar diaria, semanal y mensual al mismo tiempo", 10);
  setWidths(sheet, [24, 60, 24, 24, 24, 24, 24, 24, 24, 24]);

  const rows = [
    ["Archivo de ingreso", path.join(ROOT, "outputs", "Libro Maestro Polla Hipica Unificado.xlsx")],
    ["Comando para procesar", "npm run excel:picks"],
    ["Que hace", "Lee la hoja Bandeja Picks de este mismo libro, guarda los studs en todas las campanas marcadas y regenera el Libro Maestro sin borrar la bandeja."],
    ["Pegado simple", "5 7 9 2 1 llena C1, C2, C3..."],
    ["Pegado con carreras", "1. 5\n2. 7\n3. 9 detecta el numero de carrera."],
    ["Pegado doble", "1. 5-12\n2. 7-4 llena Stud 1 con el primer numero y Stud 2 con el segundo."],
    ["Validacion", "Revisa Tabla Pronosticos y Validacion Picks despues de procesar."],
  ];
  writeTable(sheet, 4, ["Tema", "Detalle"], rows, { headerColor: PALETTE.gold });
}

function sanitizeSheetName(name) {
  return String(name || "Hoja")
    .replace(/[:\\/?*\[\]]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 31);
}

function uniqueSheetName(workbook, preferredName) {
  const base = sanitizeSheetName(preferredName) || "Hoja";
  if (!workbook.getWorksheet(base)) return base;
  for (let index = 2; index < 100; index += 1) {
    const suffix = ` ${index}`;
    const candidate = sanitizeSheetName(`${base.slice(0, 31 - suffix.length)}${suffix}`);
    if (!workbook.getWorksheet(candidate)) return candidate;
  }
  return sanitizeSheetName(`${Date.now()}`.slice(-31));
}

function clonePlain(value) {
  if (!value || typeof value !== "object") return value;
  if (value instanceof Date) return new Date(value);
  return JSON.parse(JSON.stringify(value));
}

function legacySheetMaxRow(sheet) {
  let max = 0;
  sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (row.actualCellCount > 0) max = Math.max(max, rowNumber);
  });
  (sheet.model?.merges || []).forEach((mergeRef) => {
    const match = String(mergeRef).match(/(\d+)(?::[A-Z]+(\d+))?$/i);
    if (match) max = Math.max(max, Number(match[2] || match[1]) || 0);
  });
  return Math.min(max || sheet.actualRowCount || 1, 500);
}

function copyWorksheet(sourceSheet, targetWorkbook, preferredName) {
  const targetSheet = targetWorkbook.addWorksheet(uniqueSheetName(targetWorkbook, preferredName), {
    views: clonePlain(sourceSheet.views || []),
    pageSetup: clonePlain(sourceSheet.pageSetup || {}),
    properties: clonePlain(sourceSheet.properties || {}),
  });

  const maxRow = legacySheetMaxRow(sourceSheet);
  const maxCol = Math.min(sourceSheet.actualColumnCount || sourceSheet.columnCount || 1, 120);

  for (let col = 1; col <= maxCol; col += 1) {
    const sourceCol = sourceSheet.getColumn(col);
    const targetCol = targetSheet.getColumn(col);
    if (sourceCol.width) targetCol.width = sourceCol.width;
    if (sourceCol.hidden) targetCol.hidden = sourceCol.hidden;
    if (sourceCol.style && Object.keys(sourceCol.style).length) targetCol.style = clonePlain(sourceCol.style);
  }

  for (let rowNumber = 1; rowNumber <= maxRow; rowNumber += 1) {
    const sourceRow = sourceSheet.getRow(rowNumber);
    const targetRow = targetSheet.getRow(rowNumber);
    if (sourceRow.height) targetRow.height = sourceRow.height;
    if (sourceRow.hidden) targetRow.hidden = sourceRow.hidden;
    if (sourceRow.style && Object.keys(sourceRow.style).length) targetRow.style = clonePlain(sourceRow.style);

    for (let col = 1; col <= maxCol; col += 1) {
      const sourceCell = sourceRow.getCell(col);
      if (sourceCell.type === ExcelJS.ValueType.Null && !sourceCell.style) continue;
      const targetCell = targetRow.getCell(col);
      targetCell.value = clonePlain(sourceCell.value);
      if (sourceCell.style && Object.keys(sourceCell.style).length) targetCell.style = clonePlain(sourceCell.style);
      if (sourceCell.numFmt) targetCell.numFmt = sourceCell.numFmt;
      if (sourceCell.alignment) targetCell.alignment = clonePlain(sourceCell.alignment);
      if (sourceCell.border) targetCell.border = clonePlain(sourceCell.border);
      if (sourceCell.fill) targetCell.fill = clonePlain(sourceCell.fill);
      if (sourceCell.font) targetCell.font = clonePlain(sourceCell.font);
    }
  }

  (sourceSheet.model?.merges || []).forEach((mergeRef) => {
    try {
      targetSheet.mergeCells(mergeRef);
    } catch (_) {
      // Some legacy merge refs can collide after truncation; values/styles are still copied.
    }
  });

  targetSheet.views = clonePlain(sourceSheet.views || targetSheet.views || []);
  return targetSheet;
}

async function makeLegacyGuideAndSheets(workbook) {
  const guide = addSheet(workbook, "Tablas Antiguas", PALETTE.ink);
  styleTitle(guide, "Tablas Antiguas Consolidadas", "Copias editables de las planillas actuales dentro del Libro Maestro", 5);
  setWidths(guide, [24, 34, 30, 18, 60]);

  const rows = [];
  for (const source of LEGACY_FILES) {
    if (!fs.existsSync(source.file)) {
      rows.push([source.label, path.basename(source.file), "No encontrado", "", ""]);
      continue;
    }
    const sourceWorkbook = new ExcelJS.Workbook();
    await sourceWorkbook.xlsx.readFile(source.file);
    for (const sourceSheet of sourceWorkbook.worksheets) {
      const newName = uniqueSheetName(workbook, `${source.prefix} ${sourceSheet.name}`);
      copyWorksheet(sourceSheet, workbook, newName);
      rows.push([
        source.label,
        path.basename(source.file),
        sourceSheet.name,
        newName,
        "Copia de valores, formulas y formato basico. Macros e imagenes incrustadas no se trasladan a esta copia consolidada.",
      ]);
    }
  }

  writeTable(guide, 4, ["Origen", "Archivo", "Hoja original", "Hoja en maestro", "Nota"], rows, { headerColor: PALETTE.ink });
}

async function readExistingBandejaRows(outputPath) {
  if (!fs.existsSync(outputPath)) return [];
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(outputPath);
  return extractBandejaRows(workbook);
}

function makePrizeSheet(workbook, data, campaigns, events) {
  const sheet = addSheet(workbook, "Premios", PALETTE.gold);
  styleTitle(sheet, "Premios", "Pozos calculados con porcentajes editables por campana", 15);
  setWidths(sheet, [12, 28, 12, 14, 14, 12, 14, 14, 12, 12, 14, 14, 14, 14, 20]);

  const headers = ["Tipo", "Campana", "Estado", "Inscritos", "Promo", "Normales", "Entrada", "Precio Promo", "Admin %", "Pozo Bruto", "Admin", "Pozo Neto", "1 Lugar", "2 Lugar", "3 Lugar"];
  const startRow = 4;
  styleHeader(sheet.getRow(startRow), PALETTE.gold);
  sheet.getRow(startRow).values = headers;
  styleHeader(sheet.getRow(startRow), PALETTE.gold);

  const firstPrizeRowByKind = {};
  campaigns.forEach((campaign, index) => {
    const rowNumber = startRow + 1 + index;
    if (!firstPrizeRowByKind[campaign.label] && campaign.enabled) firstPrizeRowByKind[campaign.label] = rowNumber;
    const row = sheet.getRow(rowNumber);
    const inscritos = countRegistered(campaign, data, events);
    const promo = countPromo(campaign, data);
    const normales = Math.max(inscritos - promo, 0);
    const values = [
      campaign.label,
      campaign.name,
      campaign.enabled ? "Activa" : "Pausada",
      inscritos,
      promo,
      normales,
      campaign.entryValue,
      campaign.promoPrice,
      campaign.adminPct,
      { formula: `F${rowNumber}*G${rowNumber}+E${rowNumber}*H${rowNumber}`, result: normales * campaign.entryValue + promo * campaign.promoPrice },
      { formula: `J${rowNumber}*I${rowNumber}`, result: 0 },
      { formula: `J${rowNumber}-K${rowNumber}`, result: 0 },
      { formula: `L${rowNumber}*${campaign.firstPct}`, result: 0 },
      { formula: `L${rowNumber}*${campaign.secondPct}`, result: 0 },
      { formula: `L${rowNumber}*${campaign.thirdPct}`, result: 0 },
    ];
    values.forEach((value, colIndex) => {
      row.getCell(colIndex + 1).value = value;
    });
    styleBodyRow(row, index);
  });

  const endRow = startRow + campaigns.length;
  applyCurrency(sheet, [7, 8, 10, 11, 12, 13, 14, 15], startRow + 1, endRow);
  applyPercent(sheet, [9], startRow + 1, endRow);
  sheet.autoFilter = { from: { row: startRow, column: 1 }, to: { row: endRow, column: headers.length } };
  return firstPrizeRowByKind;
}

function aggregateRanking(events, label) {
  const totals = new Map();
  events
    .filter((event) => event.displayKind === label)
    .forEach((event) => {
      (event.leaderboard || event.participants || []).forEach((participant) => {
        const name = text(participant.name);
        if (!name) return;
        const current = totals.get(name.toLowerCase()) || {
          name,
          points: 0,
          events: 0,
          wins: 0,
          sourceEvents: [],
        };
        current.points += number(participant.points, 0);
        current.events += 1;
        current.sourceEvents.push(event.title || event.sheetName);
        totals.set(name.toLowerCase(), current);
      });
    });

  return Array.from(totals.values())
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name, "es"))
    .map((item, index) => ({ ...item, position: index + 1 }));
}

function makeRanking(workbook, label, events, prizeRows) {
  const color = label === "Diaria" ? PALETTE.red : label === "Semanal" ? PALETTE.blue : PALETTE.turf;
  const sheet = addSheet(workbook, `Ranking ${label}`, color);
  styleTitle(sheet, `Ranking ${label}`, "Tabla final con posicion, puntos y premio sugerido", 9);
  setWidths(sheet, [10, 30, 14, 12, 14, 18, 28, 16, 16]);

  const rows = aggregateRanking(events, label).map((item) => [
    item.position,
    item.name,
    item.points,
    item.events,
    item.position <= 3 ? "Premio" : "",
    "",
    item.sourceEvents.slice(0, 3).join(", "),
    "",
    "",
  ]);

  const startRow = 4;
  writeTable(sheet, startRow, ["Pos", "Stud", "Puntos", "Eventos", "Estado", "Premio", "Eventos Base", "Notas", "Pago"], rows, { headerColor: color });
  const prizeRow = prizeRows[label];
  rows.forEach((_, index) => {
    const rowNumber = startRow + 1 + index;
    const row = sheet.getRow(rowNumber);
    if (prizeRow) {
      row.getCell(6).value = {
        formula: `IF(A${rowNumber}=1,Premios!$M$${prizeRow},IF(A${rowNumber}=2,Premios!$N$${prizeRow},IF(A${rowNumber}=3,Premios!$O$${prizeRow},"")))`,
        result: "",
      };
      row.getCell(6).numFmt = moneyFormat();
    }
    if (index === 0) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(PALETTE.softGold) } };
        cell.font = { bold: true, color: { argb: argb(PALETTE.ink) } };
      });
    } else if (index === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(PALETTE.softBlue) } };
      });
    } else if (index === 2) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(PALETTE.softGreen) } };
      });
    }
  });
}

function makeRankingCompact(workbook, data, campaigns, events) {
  const sheet = addSheet(workbook, "Ranking", PALETTE.turf);
  styleTitle(sheet, "Ranking y Premios", "Ranking diario, semanal y mensual en una sola vista", 9);
  setWidths(sheet, [10, 30, 14, 12, 14, 18, 30, 16, 16]);

  const prizeHeaders = ["Tipo", "Campana", "Estado", "Inscritos", "Promo", "Normales", "Entrada", "Precio Promo", "Admin %", "Pozo Bruto", "Admin", "Pozo Neto", "1 Lugar", "2 Lugar", "3 Lugar"];
  const prizeStart = 4;
  const prizeRowsByKind = {};
  styleHeader(sheet.getRow(prizeStart), PALETTE.gold);
  sheet.getRow(prizeStart).values = prizeHeaders;
  styleHeader(sheet.getRow(prizeStart), PALETTE.gold);
  campaigns.forEach((campaign, index) => {
    const rowNumber = prizeStart + 1 + index;
    if (!prizeRowsByKind[campaign.label] && campaign.enabled) prizeRowsByKind[campaign.label] = rowNumber;
    const row = sheet.getRow(rowNumber);
    const inscritos = countRegistered(campaign, data, events);
    const promo = countPromo(campaign, data);
    const normales = Math.max(inscritos - promo, 0);
    [
      campaign.label,
      campaign.name,
      campaign.enabled ? "Activa" : "Pausada",
      inscritos,
      promo,
      normales,
      campaign.entryValue,
      campaign.promoPrice,
      campaign.adminPct,
      { formula: `F${rowNumber}*G${rowNumber}+E${rowNumber}*H${rowNumber}`, result: normales * campaign.entryValue + promo * campaign.promoPrice },
      { formula: `J${rowNumber}*I${rowNumber}`, result: 0 },
      { formula: `J${rowNumber}-K${rowNumber}`, result: 0 },
      { formula: `L${rowNumber}*${campaign.firstPct}`, result: 0 },
      { formula: `L${rowNumber}*${campaign.secondPct}`, result: 0 },
      { formula: `L${rowNumber}*${campaign.thirdPct}`, result: 0 },
    ].forEach((value, colIndex) => {
      row.getCell(colIndex + 1).value = value;
    });
    styleBodyRow(row, index);
  });
  const prizeEnd = prizeStart + campaigns.length;
  applyCurrency(sheet, [7, 8, 10, 11, 12, 13, 14, 15], prizeStart + 1, prizeEnd);
  applyPercent(sheet, [9], prizeStart + 1, prizeEnd);

  let startRow = prizeEnd + 3;
  ["Diaria", "Semanal", "Mensual"].forEach((label) => {
    sheet.getCell(startRow, 1).value = `Ranking ${label}`;
    sheet.getCell(startRow, 1).font = { bold: true, size: 14, color: { argb: argb(PALETTE.white) } };
    sheet.getCell(startRow, 1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: argb(label === "Diaria" ? PALETTE.red : label === "Semanal" ? PALETTE.blue : PALETTE.turf) } };
    const rows = aggregateRanking(events, label).map((item) => [
      item.position,
      item.name,
      item.points,
      item.events,
      item.position <= 3 ? "Premio" : "",
      "",
      item.sourceEvents.slice(0, 3).join(", "),
      "",
      "",
    ]);
    const headerRow = startRow + 1;
    const prizeRow = prizeRowsByKind[label];
    const nextStart = writeTable(sheet, headerRow, ["Pos", "Stud", "Puntos", "Eventos", "Estado", "Premio", "Eventos Base", "Notas", "Pago"], rows, {
      headerColor: label === "Diaria" ? PALETTE.red : label === "Semanal" ? PALETTE.blue : PALETTE.turf,
    });
    rows.forEach((_, index) => {
      const rowNumber = headerRow + 1 + index;
      const row = sheet.getRow(rowNumber);
      if (prizeRow) {
        row.getCell(6).value = {
          formula: `IF(A${rowNumber}=1,Ranking!$M$${prizeRow},IF(A${rowNumber}=2,Ranking!$N$${prizeRow},IF(A${rowNumber}=3,Ranking!$O$${prizeRow},"")))`,
          result: "",
        };
        row.getCell(6).numFmt = moneyFormat();
      }
    });
    startRow = nextStart + 1;
  });
}

async function buildMasterWorkbook(outputPath = DEFAULT_OUTPUT, sourceWorkbookPath = outputPath) {
  const existingBandejaRows = await readExistingBandejaRows(sourceWorkbookPath);
  const data = loadData();
  const overrides = loadOverrides();
  const campaigns = campaignRows(overrides);
  const allEvents = Array.from(new Map([...(data.semanal?.events || []), ...(data.mensual?.events || [])].map((event) => [event.id, event])).values());
  const events = buildEventIndex(allEvents, campaigns);

  const workbook = createWorkbook();
  makeDashboard(workbook, data, campaigns, events);
  makeCampaigns(workbook, overrides, campaigns, data);
  addBandejaPicksSheet(workbook, existingBandejaRows, { participants: data.registry || [] });
  makePrograms(workbook, data);
  makeResults(workbook, events);
  makePicks(workbook, events);
  makeRankingCompact(workbook, data, campaigns, events);

  workbook.eachSheet((sheet) => {
    sheet.eachRow((row) => {
      row.eachCell((cell) => {
        cell.font = { name: "Aptos", ...(cell.font || {}) };
      });
    });
  });

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await workbook.xlsx.writeFile(outputPath);
  return outputPath;
}

if (require.main === module) {
  const outputArg = process.argv.find((arg) => arg.startsWith("--out="));
  const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
  const outputPath = outputArg ? path.resolve(outputArg.slice("--out=".length)) : DEFAULT_OUTPUT;
  const sourceWorkbookPath = sourceArg ? path.resolve(sourceArg.slice("--source=".length)) : outputPath;
  buildMasterWorkbook(outputPath, sourceWorkbookPath)
    .then((filePath) => {
      console.log(`Libro Maestro generado: ${filePath}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = { buildMasterWorkbook };
