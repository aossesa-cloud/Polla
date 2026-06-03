const fs = require("fs");
const path = require("path");
const ExcelJS = require("exceljs");

const { parseBulkPickPayload } = require("./lib/pick-parser");
const { loadData } = require("../parser");
const { loadOverrides, saveOverrides } = require("../storage");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "outputs");
const DEFAULT_INPUT = path.join(OUTPUT_DIR, "Libro Maestro Polla Hipica Compacto.xlsm");
const SHEET_NAME = "Ingreso Picks";
const MAX_RACES = 30;
const TECHNICAL_HEADER_ROW = 34;
const BANDEJA_HEADERS = [
  "Procesar",
  "Fecha",
  "Grupo",
  "Diaria",
  "Semanal",
  "Mensual",
  "Evento Diaria ID",
  "Evento Semanal ID",
  "Evento Mensual ID",
  "N Stud 1",
  "Stud 1",
  "Pegado Stud 1",
  "N Stud 2",
  "Stud 2",
  "Pegado Stud 2",
  ...Array.from({ length: MAX_RACES }, (_, index) => `C${index + 1}`),
  ...Array.from({ length: MAX_RACES }, (_, index) => `D${index + 1}`),
  "Estado",
  "Destinos",
  "Observaciones",
];

function text(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(value);
  }
  if (typeof value === "object" && value.text) return String(value.text).trim();
  if (typeof value === "object" && value.result !== undefined) return text(value.result);
  return String(value).trim();
}

function yes(value) {
  const safe = text(value).toLowerCase();
  return ["si", "sí", "s", "yes", "y", "x", "1", "true"].includes(safe);
}

function normalizeIdPart(value) {
  return text(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function weekdayName(dateText) {
  if (!dateText) return "";
  const date = new Date(`${dateText}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CL", { weekday: "long", timeZone: "America/Santiago" })
    .format(date)
    .replace(/^\w/, (char) => char.toUpperCase());
}

function dateInRange(date, start, end) {
  const safeDate = text(date);
  const safeStart = text(start);
  const safeEnd = text(end);
  if (!safeDate || !safeStart || !safeEnd) return false;
  return safeDate >= safeStart && safeDate <= safeEnd;
}

function getCampaignEventIds(kind, campaign, operationDate = "") {
  if (!campaign) return [];
  if (kind === "daily") {
    return [campaign.eventId || `campaign-${campaign.id}`].filter(Boolean);
  }

  const eventIds = Array.isArray(campaign.eventIds) ? campaign.eventIds.filter(Boolean) : [];
  const eventDates = Array.isArray(campaign.eventDates) ? campaign.eventDates : [];
  if (operationDate && eventIds.length && eventDates.length) {
    const dated = eventIds.filter((_, index) => text(eventDates[index]) === operationDate);
    if (dated.length) return dated;
  }

  if (kind === "weekly") {
    const eventNames = Array.isArray(campaign.eventNames) ? campaign.eventNames : [];
    const day = weekdayName(operationDate);
    if (eventIds.length && eventNames.length && day) {
      const index = eventNames.findIndex((name) => normalizeIdPart(name) === normalizeIdPart(day));
      if (index >= 0 && eventIds[index]) return [eventIds[index]];
    }
    return eventIds.length
      ? eventIds
      : (campaign.activeDays || []).map((item) => `${campaign.id}-${normalizeIdPart(item)}`);
  }

  if (kind === "monthly") {
    const selected = Array.isArray(campaign.selectedEventIds)
      ? campaign.selectedEventIds.filter((id) => operationDate && text(id).includes(operationDate))
      : [];
    if (selected.length) return selected;
    return eventIds.length ? eventIds : [`${campaign.id}-general`];
  }

  return [];
}

function activeCampaignsFor(kind, operationDate, groupId, overrides) {
  const campaigns = overrides.settings?.campaigns?.[kind] || [];
  return campaigns.filter((campaign) => {
    if (campaign.enabled === false) return false;
    if (groupId && text(campaign.groupId) && text(campaign.groupId) !== groupId) return false;
    if (kind === "daily") return text(campaign.date) === operationDate;
    return dateInRange(operationDate, campaign.startDate, campaign.endDate);
  });
}

function targetEventIdsFromRow(row, overrides) {
  const operationDate = text(row.fecha);
  const groupId = text(row.grupo);
  const ids = [];

  const addExplicitOrActive = (kind, explicitId) => {
    if (explicitId) {
      ids.push(explicitId);
      return;
    }
    activeCampaignsFor(kind, operationDate, groupId, overrides).forEach((campaign) => {
      ids.push(...getCampaignEventIds(kind, campaign, operationDate));
    });
  };

  if (row.diaria) addExplicitOrActive("daily", text(row.eventoDiaria));
  if (row.semanal) addExplicitOrActive("weekly", text(row.eventoSemanal));
  if (row.mensual) addExplicitOrActive("monthly", text(row.eventoMensual));

  return Array.from(new Set(ids.filter(Boolean)));
}

function eventRaceCount(eventId, data, fallback = 12) {
  const events = [...(data.semanal?.events || []), ...(data.mensual?.events || [])];
  const event = events.find((item) => item.id === eventId);
  return Math.min(Number(event?.races) || fallback, MAX_RACES);
}

function nextParticipantIndex(overrides, targetEventIds) {
  let max = 0;
  targetEventIds.forEach((eventId) => {
    (overrides.events?.[eventId]?.participants || []).forEach((participant) => {
      max = Math.max(max, Number(participant.index) || 0);
    });
  });
  return max + 1;
}

function readRaceColumns(row, prefix) {
  return Array.from({ length: MAX_RACES }, (_, index) => text(row[`${prefix}${index + 1}`]));
}

function upsertParticipantInOverrides(overrides, eventId, participant) {
  overrides.events = overrides.events || {};
  const eventData = overrides.events[eventId] || { participants: [], results: {}, meta: {} };
  const list = Array.isArray(eventData.participants) ? eventData.participants : [];
  const existingIndex = list.findIndex((item) => Number(item.index) === Number(participant.index));
  if (existingIndex >= 0) {
    list[existingIndex] = participant;
  } else {
    list.push(participant);
  }
  eventData.participants = list.sort((a, b) => Number(a.index) - Number(b.index));
  overrides.events[eventId] = eventData;
}

function findHeaderRow(sheet) {
  const maxRows = Math.min(sheet.rowCount || 1, 100);
  for (let rowNumber = 1; rowNumber <= maxRows; rowNumber += 1) {
    const labels = [];
    sheet.getRow(rowNumber).eachCell((cell) => labels.push(text(cell.value).toLowerCase()));
    if (labels.includes("procesar") && labels.includes("fecha") && labels.includes("stud 1")) {
      return rowNumber;
    }
  }
  return 0;
}

function parseHeaderMap(sheet, headerRow = 1) {
  const map = new Map();
  sheet.getRow(headerRow).eachCell((cell, colNumber) => {
    map.set(text(cell.value).toLowerCase(), colNumber);
  });
  return map;
}

function cell(row, headerMap, name) {
  const col = headerMap.get(name.toLowerCase());
  return col ? row.getCell(col).value : "";
}

function rowPayload(row, headerMap) {
  const payload = {
    procesar: text(cell(row, headerMap, "Procesar")),
    fecha: text(cell(row, headerMap, "Fecha")),
    grupo: text(cell(row, headerMap, "Grupo")),
    diaria: yes(cell(row, headerMap, "Diaria")),
    semanal: yes(cell(row, headerMap, "Semanal")),
    mensual: yes(cell(row, headerMap, "Mensual")),
    eventoDiaria: text(cell(row, headerMap, "Evento Diaria ID")),
    eventoSemanal: text(cell(row, headerMap, "Evento Semanal ID")),
    eventoMensual: text(cell(row, headerMap, "Evento Mensual ID")),
    index1: Number(text(cell(row, headerMap, "N Stud 1"))) || 0,
    stud1: text(cell(row, headerMap, "Stud 1")),
    pegado1: text(cell(row, headerMap, "Pegado Stud 1")),
    index2: Number(text(cell(row, headerMap, "N Stud 2"))) || 0,
    stud2: text(cell(row, headerMap, "Stud 2")),
    pegado2: text(cell(row, headerMap, "Pegado Stud 2")),
  };

  for (let index = 1; index <= MAX_RACES; index += 1) {
    payload[`C${index}`] = text(cell(row, headerMap, `C${index}`));
    payload[`D${index}`] = text(cell(row, headerMap, `D${index}`));
  }

  return payload;
}

function setStatus(row, headerMap, status, destinations, notes) {
  const statusCol = headerMap.get("estado");
  const destinationsCol = headerMap.get("destinos");
  const notesCol = headerMap.get("observaciones");
  if (statusCol) row.getCell(statusCol).value = status;
  if (destinationsCol) row.getCell(destinationsCol).value = destinations;
  if (notesCol) row.getCell(notesCol).value = notes;
}

function defaultBandejaRows() {
  return [[
    "NO",
    new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date()),
    "",
    "SI",
    "SI",
    "SI",
    "",
    "",
    "",
    1,
    "NOMBRE STUD",
    "1. 5-12\n2. 7-4\n3. 9-2",
    2,
    "OTRO STUD",
    "",
  ]];
}

function columnLetter(number) {
  let dividend = number;
  let letter = "";
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    letter = String.fromCharCode(65 + modulo) + letter;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return letter;
}

function participantNames(options = {}) {
  return Array.from(new Set(
    (options.participants || [])
      .map((participant) => text(participant?.name || participant))
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "es")),
  ));
}

function addParticipantDropdowns(sheet, options = {}) {
  const names = participantNames(options);
  if (!names.length) return;

  const listColumn = BANDEJA_HEADERS.length + 3;
  const letter = columnLetter(listColumn);
  sheet.getColumn(listColumn).hidden = true;
  sheet.getCell(1, listColumn).value = "Lista Participantes";

  names.forEach((name, index) => {
    sheet.getCell(index + 2, listColumn).value = name;
  });

  const formula = `=$${letter}$2:$${letter}$${names.length + 1}`;
  ["D16", "L16"].forEach((cellRef) => {
    sheet.getCell(cellRef).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [formula],
      showInputMessage: true,
      promptTitle: "Seleccionar participante",
      prompt: "Abre la flecha de esta celda y elige un participante del padron.",
      showErrorMessage: true,
      errorTitle: "Participante no encontrado",
      error: "Selecciona un participante del padron o agregalo primero en Campanas.",
    };
  });
}

function applyFill(cell, color) {
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
}

function applyBorder(cell, color = "FF2D3954") {
  cell.border = {
    top: { style: "thin", color: { argb: color } },
    left: { style: "thin", color: { argb: color } },
    bottom: { style: "thin", color: { argb: color } },
    right: { style: "thin", color: { argb: color } },
  };
}

function styleRange(sheet, range, style) {
  const [start, end] = range.split(":");
  const startCell = sheet.getCell(start);
  const endCell = sheet.getCell(end);
  for (let row = startCell.row; row <= endCell.row; row += 1) {
    for (let col = startCell.col; col <= endCell.col; col += 1) {
      const cellRef = sheet.getCell(row, col);
      if (style.fill) applyFill(cellRef, style.fill);
      if (style.font) cellRef.font = style.font;
      if (style.alignment) cellRef.alignment = style.alignment;
      if (style.border) applyBorder(cellRef, style.border);
    }
  }
}

function addBandejaPicksSheet(workbook, rows = [], options = {}) {
  const existing = workbook.getWorksheet(SHEET_NAME);
  if (existing) workbook.removeWorksheet(existing.id);

  const sheet = workbook.addWorksheet(SHEET_NAME, {
    views: [{ showGridLines: false }],
    properties: { tabColor: { argb: "FF1F4E79" } },
    pageSetup: { orientation: "landscape", fitToPage: true, fitToWidth: 1 },
  });

  const widths = [8, 8, 12, 34, 5, 5, 20, 4, 8, 8, 12, 34, 5, 5, 14, 14];
  widths.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width;
  });
  sheet.properties.defaultRowHeight = 21;

  styleRange(sheet, "A1:P33", { fill: "FF070C16" });

  sheet.mergeCells("A1:P2");
  sheet.getCell("A1").value = "Ingreso de Pronosticos";
  sheet.getCell("A1").font = { bold: true, size: 26, color: { argb: "FFFFFFFF" } };
  sheet.getCell("A1").alignment = { vertical: "middle", horizontal: "left" };
  sheet.getRow(1).height = 33;
  sheet.getRow(2).height = 18;

  sheet.mergeCells("A3:P3");
  sheet.getCell("A3").value = "Selecciona la fecha y las campanas a las que ingresar picks. Puedes pegar pronosticos libres como en la web.";
  sheet.getCell("A3").font = { size: 12, color: { argb: "FF8EA6C9" } };
  sheet.getCell("A3").alignment = { vertical: "middle", horizontal: "left" };

  sheet.mergeCells("A5:C5");
  sheet.getCell("A5").value = "FECHA OPERATIVA";
  sheet.mergeCells("E5:G5");
  sheet.getCell("E5").value = "GRUPO / HIPODROMO";
  sheet.mergeCells("I5:J5");
  sheet.getCell("I5").value = "PROCESAR CARGA";
  ["A5", "E5", "I5"].forEach((cellRef) => {
    sheet.getCell(cellRef).font = { bold: true, color: { argb: "FF7895BD" } };
  });

  sheet.mergeCells("A6:C7");
  sheet.getCell("A6").value = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Santiago" }).format(new Date());
  sheet.getCell("A6").numFmt = "yyyy-mm-dd";
  sheet.mergeCells("E6:G7");
  sheet.getCell("E6").value = "";
  sheet.mergeCells("I6:J7");
  sheet.getCell("I6").value = "NO";
  ["A6", "E6", "I6"].forEach((cellRef) => {
    const cellRefObj = sheet.getCell(cellRef);
    applyFill(cellRefObj, "FF1B2538");
    applyBorder(cellRefObj, "FF31405F");
    cellRefObj.font = { size: 13, color: { argb: "FFFFFFFF" } };
    cellRefObj.alignment = { vertical: "middle", horizontal: "center" };
  });
  sheet.getCell("I6").dataValidation = { type: "list", allowBlank: false, formulae: ['"SI,NO"'] };

  sheet.mergeCells("A9:P9");
  sheet.getCell("A9").value = "CAMPANAS ACTIVAS / DESTINOS";
  sheet.getCell("A9").font = { bold: true, size: 12, color: { argb: "FF8EA6C9" } };
  sheet.getCell("A9").alignment = { vertical: "middle", horizontal: "left" };

  sheet.getRow(10).values = ["Usar", "Tipo", "Nombre visible", "", "", "", "Evento ID opcional", "", "Nota", "", "", "", "", "", "", ""];
  sheet.getRow(10).font = { bold: true, color: { argb: "FFFFFFFF" } };
  styleRange(sheet, "A10:P13", { fill: "FF1A2437", border: "FF2D3954", alignment: { vertical: "middle", horizontal: "left" } });
  [
    ["A11", "SI", "B11", "Diaria", "C11", "Detectar diaria activa por fecha"],
    ["A12", "SI", "B12", "Semanal", "C12", "Detectar semanal activa por fecha"],
    ["A13", "SI", "B13", "Mensual", "C13", "Detectar mensual activa por fecha"],
  ].forEach(([useCell, useValue, typeCell, typeValue, nameCell, nameValue], index) => {
    const rowNumber = 11 + index;
    sheet.getCell(useCell).value = useValue;
    sheet.getCell(useCell).dataValidation = { type: "list", allowBlank: false, formulae: ['"SI,NO"'] };
    sheet.getCell(typeCell).value = typeValue;
    sheet.mergeCells(rowNumber, 3, rowNumber, 6);
    sheet.getCell(nameCell).value = nameValue;
    sheet.mergeCells(rowNumber, 7, rowNumber, 8);
    sheet.mergeCells(rowNumber, 9, rowNumber, 16);
    sheet.getCell(rowNumber, 9).value = "Si dejas el Evento ID vacio, se busca automaticamente por fecha y grupo.";
    sheet.getRow(rowNumber).font = { color: { argb: "FFFFFFFF" } };
  });

  sheet.mergeCells("A15:P15");
  sheet.getCell("A15").value = "PARTICIPANTE";
  sheet.getCell("A15").font = { bold: true, size: 12, color: { argb: "FF8EA6C9" } };

  styleRange(sheet, "A16:P18", { fill: "FF1B2538", border: "FF31405F", alignment: { vertical: "middle", horizontal: "left" } });
  sheet.getCell("A16").value = "N Stud 1";
  sheet.getCell("B16").value = 1;
  sheet.getCell("C16").value = "Stud 1";
  sheet.getCell("D16").value = "";
  sheet.getCell("E16").value = "<-- lista";
  sheet.getCell("I16").value = "N Stud 2";
  sheet.getCell("J16").value = 2;
  sheet.getCell("K16").value = "Stud 2";
  sheet.getCell("L16").value = "";
  sheet.getCell("M16").value = "<-- lista";
  ["A16", "C16", "I16", "K16"].forEach((cellRef) => {
    sheet.getCell(cellRef).font = { bold: true, color: { argb: "FF8EA6C9" } };
  });
  ["B16", "D16", "J16", "L16"].forEach((cellRef) => {
    sheet.getCell(cellRef).font = { color: { argb: "FFFFFFFF" } };
  });
  ["D16", "L16"].forEach((cellRef) => {
    const inputCell = sheet.getCell(cellRef);
    applyFill(inputCell, "FF263550");
    applyBorder(inputCell, "FF58A6FF");
    inputCell.alignment = { vertical: "middle", horizontal: "left" };
  });
  ["E16", "M16"].forEach((cellRef) => {
    sheet.getCell(cellRef).font = { italic: true, color: { argb: "FF58A6FF" } };
  });
  addParticipantDropdowns(sheet, options);

  sheet.mergeCells("A18:P18");
  sheet.getCell("A18").value = "Tip: para pareja, completa Stud 2. Si solo juegan individual, dejalo vacio.";
  sheet.getCell("A18").font = { italic: true, color: { argb: "FF8EA6C9" } };

  sheet.mergeCells("A20:H20");
  sheet.mergeCells("I20:P20");
  sheet.getCell("A20").value = "INGRESO AUTOMATICO - STUD 1";
  sheet.getCell("I20").value = "INGRESO AUTOMATICO - STUD 2 / PAREJA";
  ["A20", "I20"].forEach((cellRef) => {
    sheet.getCell(cellRef).font = { bold: true, color: { argb: "FF8EA6C9" } };
  });

  sheet.mergeCells("A21:H28");
  sheet.mergeCells("I21:P28");
  ["A21", "I21"].forEach((cellRef) => {
    const cellRefObj = sheet.getCell(cellRef);
    applyFill(cellRefObj, "FF1B2538");
    applyBorder(cellRefObj, "FF31405F");
    cellRefObj.font = { size: 12, color: { argb: "FFFFFFFF" } };
    cellRefObj.alignment = { wrapText: true, vertical: "top", horizontal: "left" };
  });
  sheet.getCell("A21").value = "";
  sheet.getCell("I21").value = "";
  for (let rowNumber = 21; rowNumber <= 28; rowNumber += 1) sheet.getRow(rowNumber).height = 28;

  sheet.mergeCells("A30:H31");
  sheet.mergeCells("I30:P30");
  sheet.mergeCells("I31:P32");
  sheet.getCell("A30").value = "Formatos aceptados: 5 12 11 3 / 1. 5 / 1-5 / 1. 5-12. Tambien puedes llenar C1, C2... en la tabla avanzada.";
  sheet.getCell("I30").value = "Estado de importacion";
  sheet.getCell("A30").font = { color: { argb: "FF8EA6C9" } };
  sheet.getCell("I30").font = { bold: true, color: { argb: "FF58A6FF" } };
  sheet.getCell("I31").value = "Pendiente";
  sheet.getCell("I31").font = { color: { argb: "FFFFFFFF" } };
  sheet.getCell("I31").alignment = { wrapText: true, vertical: "top" };

  sheet.mergeCells("A33:P33");
  sheet.getCell("A33").value = "TABLA AVANZADA / HISTORIAL: usa esta zona si necesitas pegar muchas filas como antes.";
  sheet.getCell("A33").font = { bold: true, color: { argb: "FF8EA6C9" } };

  const dataRows = rows.length ? rows : defaultBandejaRows();
  sheet.getRow(TECHNICAL_HEADER_ROW).values = BANDEJA_HEADERS;
  sheet.getRow(TECHNICAL_HEADER_ROW).font = { bold: true, color: { argb: "FFFFFFFF" } };
  sheet.getRow(TECHNICAL_HEADER_ROW).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
  sheet.getRow(TECHNICAL_HEADER_ROW).alignment = { wrapText: true, vertical: "middle", horizontal: "center" };
  dataRows.forEach((values, index) => {
    if (text(values[10]).toUpperCase() === "NOMBRE STUD") {
      values[0] = "NO";
    }
    sheet.getRow(TECHNICAL_HEADER_ROW + index + 1).values = values;
    sheet.getRow(TECHNICAL_HEADER_ROW + index + 1).alignment = { wrapText: true, vertical: "top" };
  });

  sheet.columns.forEach((column, index) => {
    if (index >= 16) column.width = index < 75 ? 8 : 20;
  });
  sheet.getColumn(12).alignment = { wrapText: true, vertical: "top" };
  sheet.getColumn(15).alignment = { wrapText: true, vertical: "top" };
  sheet.autoFilter = {
    from: { row: TECHNICAL_HEADER_ROW, column: 1 },
    to: { row: Math.max(TECHNICAL_HEADER_ROW + dataRows.length, TECHNICAL_HEADER_ROW + 1), column: BANDEJA_HEADERS.length },
  };

  return sheet;
}

function extractBandejaRows(workbook) {
  const sheet = workbook.getWorksheet(SHEET_NAME);
  if (!sheet) return [];
  const headerRow = findHeaderRow(sheet);
  if (!headerRow) return [];
  const rows = [];
  for (let rowNumber = headerRow + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    let values = BANDEJA_HEADERS.map((_, index) => text(row.getCell(index + 1).value));
    const processMarkerIndex = values.slice(0, 5).findIndex((value) => ["si", "no"].includes(text(value).toLowerCase()));
    if (processMarkerIndex > 0) {
      values = values.slice(processMarkerIndex);
    }
    if (values.some(Boolean)) rows.push(values);
  }
  return rows;
}

function readFormPayload(sheet) {
  const procesar = text(sheet.getCell("I6").value);
  if (!yes(procesar)) return null;

  const payload = {
    procesar,
    fecha: text(sheet.getCell("A6").value),
    grupo: text(sheet.getCell("E6").value),
    diaria: yes(sheet.getCell("A11").value),
    semanal: yes(sheet.getCell("A12").value),
    mensual: yes(sheet.getCell("A13").value),
    eventoDiaria: text(sheet.getCell("G11").value),
    eventoSemanal: text(sheet.getCell("G12").value),
    eventoMensual: text(sheet.getCell("G13").value),
    index1: Number(text(sheet.getCell("B16").value)) || 0,
    stud1: text(sheet.getCell("D16").value),
    pegado1: text(sheet.getCell("A21").value),
    index2: Number(text(sheet.getCell("J16").value)) || 0,
    stud2: text(sheet.getCell("L16").value),
    pegado2: text(sheet.getCell("I21").value),
  };

  for (let index = 1; index <= MAX_RACES; index += 1) {
    payload[`C${index}`] = "";
    payload[`D${index}`] = "";
  }

  return payload;
}

function setFormStatus(sheet, status, destinations, notes) {
  sheet.getCell("I31").value = `${status}${destinations ? ` | ${destinations}` : ""}\n${notes || ""}`;
  sheet.getCell("I31").font = {
    bold: status === "OK",
    color: { argb: status === "OK" ? "FF22C55E" : "FFF87171" },
  };
  sheet.getCell("I31").alignment = { wrapText: true, vertical: "top" };
}

function importPayload(payload, data, overrides) {
  const targetEventIds = targetEventIdsFromRow(payload, overrides);
  if (!payload.fecha || !targetEventIds.length) {
    return { ok: false, destinations: "", notes: "Falta fecha o no hay campanas destino activas.", importedParticipants: 0 };
  }
  if (!payload.stud1) {
    return { ok: false, destinations: targetEventIds.join(", "), notes: "Falta Stud 1.", importedParticipants: 0 };
  }

  const raceCount = Math.max(...targetEventIds.map((eventId) => eventRaceCount(eventId, data, 12)), 12);
  const manual1 = readRaceColumns(payload, "C");
  const manual2 = readRaceColumns(payload, "D");
  const parsed1 = parseBulkPickPayload(payload.pegado1, raceCount);
  const parsed2 = parseBulkPickPayload(payload.pegado2, raceCount);
  const firstPicks = manual1.some(Boolean)
    ? manual1.slice(0, raceCount)
    : (payload.pegado1 ? parsed1.first : parsed2.first);
  const secondPicks = manual2.some(Boolean)
    ? manual2.slice(0, raceCount)
    : (payload.pegado2 ? parsed2.first : parsed1.second);
  const detectedSecondParticipant = manual2.some(Boolean) || secondPicks.some(Boolean);

  if (detectedSecondParticipant && !payload.stud2) {
    return {
      ok: false,
      destinations: targetEventIds.join(", "),
      notes: `Se detectaron picks para 2 participantes (${parsed1.meta?.format || "formato doble"}). Selecciona Stud 2 antes de guardar.`,
      importedParticipants: 0,
    };
  }

  const baseIndex = payload.index1 || nextParticipantIndex(overrides, targetEventIds);
  const participants = [
    {
      index: baseIndex,
      name: payload.stud1,
      picks: firstPicks,
    },
  ];

  if (payload.stud2) {
    participants.push({
      index: payload.index2 || baseIndex + 1,
      name: payload.stud2,
      picks: secondPicks,
    });
  }

  const missing = participants.flatMap((participant) => (
    participant.picks.slice(0, raceCount).map((pick, index) => (pick ? null : `${participant.name} C${index + 1}`)).filter(Boolean)
  ));
  if (missing.length) {
    return {
      ok: false,
      destinations: targetEventIds.join(", "),
      notes: `Faltan picks: ${missing.slice(0, 12).join(", ")}${missing.length > 12 ? "..." : ""}`,
      importedParticipants: 0,
    };
  }

  targetEventIds.forEach((eventId) => {
    participants.forEach((participant) => {
      upsertParticipantInOverrides(overrides, eventId, {
        index: participant.index,
        name: participant.name,
        picks: participant.picks.slice(0, eventRaceCount(eventId, data, raceCount)),
      });
    });
  });

  return {
    ok: true,
    destinations: targetEventIds.join(", "),
    notes: `${participants.length} stud(s) guardados en ${targetEventIds.length} destino(s).`,
    importedParticipants: participants.length * targetEventIds.length,
  };
}

async function createInputTemplate(filePath = DEFAULT_INPUT) {
  const workbook = new ExcelJS.Workbook();
  addBandejaPicksSheet(workbook);

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

async function importPicksFromExcel(filePath = DEFAULT_INPUT) {
  if (!fs.existsSync(filePath)) {
    if (path.extname(filePath).toLowerCase() === ".xlsm") {
      console.log(`No existe el libro macro-habilitado: ${filePath}`);
      console.log("Ejecuta npm run excel:build y vuelve a ejecutar npm run excel:picks.");
      return { createdTemplate: false, importedRows: 0, importedParticipants: 0 };
    }
    await createInputTemplate(filePath);
    console.log(`Se creo el libro con la hoja ${SHEET_NAME}: ${filePath}`);
    console.log("Completa Bandeja Picks y vuelve a ejecutar npm run excel:picks.");
    return { createdTemplate: true, importedRows: 0 };
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.getWorksheet(SHEET_NAME);
  if (!sheet) throw new Error(`No existe la hoja "${SHEET_NAME}" en ${filePath}`);

  const data = loadData();
  const overrides = loadOverrides();
  const headerRow = findHeaderRow(sheet);
  const headerMap = headerRow ? parseHeaderMap(sheet, headerRow) : new Map();
  let importedRows = 0;
  let importedParticipants = 0;
  const messages = [];

  const formPayload = readFormPayload(sheet);
  if (formPayload) {
    const result = importPayload(formPayload, data, overrides);
    setFormStatus(sheet, result.ok ? "OK" : "ERROR", result.destinations, result.notes);
    messages.push({ source: "panel", status: result.ok ? "OK" : "ERROR", destinations: result.destinations, notes: result.notes });
    if (result.ok) {
      importedRows += 1;
      importedParticipants += result.importedParticipants;
    }
  }

  for (let rowNumber = (headerRow || TECHNICAL_HEADER_ROW) + 1; rowNumber <= sheet.rowCount; rowNumber += 1) {
    const row = sheet.getRow(rowNumber);
    const payload = rowPayload(row, headerMap);
    if (!yes(payload.procesar)) continue;

    const result = importPayload(payload, data, overrides);
    setStatus(row, headerMap, result.ok ? "OK" : "ERROR", result.destinations, result.notes);
    messages.push({ source: `fila ${rowNumber}`, status: result.ok ? "OK" : "ERROR", destinations: result.destinations, notes: result.notes });
    if (result.ok) {
      importedRows += 1;
      importedParticipants += result.importedParticipants;
    }
  }

  if (importedRows > 0) saveOverrides(overrides);
  if (path.extname(filePath).toLowerCase() === ".xlsm") {
    console.log("Libro .xlsm preservado: el estado visual se actualiza al regenerar el maestro.");
  } else {
    await workbook.xlsx.writeFile(filePath);
  }
  console.log(`Filas importadas: ${importedRows}`);
  console.log(`Participantes/destinos guardados: ${importedParticipants}`);
  return { createdTemplate: false, importedRows, importedParticipants, messages };
}

if (require.main === module) {
  const outArg = process.argv.find((arg) => arg.startsWith("--file="));
  const statusArg = process.argv.find((arg) => arg.startsWith("--status-file="));
  const filePath = outArg ? path.resolve(outArg.slice("--file=".length)) : DEFAULT_INPUT;
  const statusPath = statusArg ? path.resolve(statusArg.slice("--status-file=".length)) : "";
  importPicksFromExcel(filePath).then((result) => {
    if (statusPath) {
      fs.mkdirSync(path.dirname(statusPath), { recursive: true });
      fs.writeFileSync(statusPath, JSON.stringify({
        ok: result.importedRows > 0,
        importedRows: result.importedRows || 0,
        importedParticipants: result.importedParticipants || 0,
        messages: result.messages || [],
      }, null, 2), "utf8");
    }
  }).catch((error) => {
    if (statusPath) {
      fs.mkdirSync(path.dirname(statusPath), { recursive: true });
      fs.writeFileSync(statusPath, JSON.stringify({
        ok: false,
        error: error.message,
        messages: [{ source: "proceso", status: "ERROR", notes: error.message }],
      }, null, 2), "utf8");
    }
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  addBandejaPicksSheet,
  createInputTemplate,
  extractBandejaRows,
  importPicksFromExcel,
  SHEET_NAME,
};
