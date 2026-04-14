const state = {
  data: null,
  currentView: "daily",
  adminUnlocked: false,
  currentAdminUser: null,
  adminTab: "registry",
  campaignsTab: "daily",
  dailyEventId: null,
  weeklyCampaignId: null,
  weeklyTab: "total",
  monthlyTab: "total",
  adminOpsMode: "semanal",
  adminOpsEventId: null,
  adminOpsManualSelection: false,
  adminForecastEdit: null,
  adminForecastNextIndex: null,
  adminForecastSecondStudVisible: false,
  adminRegistryEdit: null,
  adminRegistryGroupEdit: null,
  adminUserEdit: null,
  adminRegistryFilterGroup: "",
  campaignDetail: null,
  campaignFilterDate: "",
  prizesFilterDate: "",
  prizesShowInactive: false,
  adminCalendarTrack: "valparaiso",
  adminCalendarMonth: "",
  adminProgramDate: "",
  adminProgramTrack: "valparaiso",
  adminResultRace: null,
  adminResultCopySourceId: "",
  automationCapture: {
    groupId: "",
    kinds: {
      daily: true,
      weekly: true,
      monthly: true,
    },
    assets: {
      forecastBanner: true,
      dailyRanking: true,
      weeklyTotal: true,
      monthlyTotal: true,
      resultsLedger: true,
    },
  },
  campaignEditors: {
    daily: null,
    weekly: null,
    monthly: null,
  },
  adminTargetSelections: {
    operationDate: "",
    groupId: "",
    programTrackId: "",
    daily: [],
    weekly: [],
    monthly: [],
    scopeKey: "",
    selectionTouched: false,
  },
  resultOperationDate: "",
  teletrakImport: {
    lastDate: "",
    tracks: [],
    selectedTrackId: "",
  },
};

let loadDashboard = async function loadDashboardBootstrap() {};
let renderPicksTable = function renderPicksTableBootstrap() { return ""; };
let renderDailyContent = function renderDailyContentBootstrap() {};
let renderWeeklyContent = function renderWeeklyContentBootstrap() {};
let renderMonthlyContent = function renderMonthlyContentBootstrap() {};
let renderEventForms = function renderEventFormsBootstrap() { return ""; };
let renderResultsForm = function renderResultsFormBootstrap() { return ""; };
let bindEventForms = function bindEventFormsBootstrap() {};

const navItems = [
  { id: "admin", label: "ADMINISTRADOR" },
  { id: "daily", label: "DIARIA" },
  { id: "weekly", label: "SEMANAL" },
  { id: "monthly", label: "MENSUAL" },
];

const CALENDAR_MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const CALENDAR_TRACKS = [
  { id: "chs", label: "Club Hipico de Santiago", badge: "🟩" },
  { id: "hipodromo-chile", label: "Hipodromo Chile", badge: "🟧" },
  { id: "valparaiso", label: "Valparaiso Sporting", badge: "🟩" },
  { id: "concepcion", label: "C. H. Concepcion", badge: "⬜" },
];

const CALENDAR_SCHEDULE_2026 = {
  chs: {
    Enero: [2, 9, 12, 16, 23, 26, 30],
    Febrero: [6, 9, 13, 20, 23, 27],
    Marzo: [1, 6, 9, 13, 20, 23, 27],
    Abril: [2, 6, 10, 12, 17, 20, 24],
    Mayo: [1, 4, 8, 15, 18, 22, 25, 29, 31],
    Junio: [5, 12, 15, 19, 21, 26, 29],
    Julio: [3, 10, 13, 17, 24, 27, 31],
    Agosto: [2, 7, 10, 14, 16, 21, 24, 28, 30],
    Septiembre: [4, 7, 11, 13, 21, 25],
    Octubre: [2, 5, 9, 11, 16, 19, 23, 30],
    Noviembre: [1, 6, 13, 16, 20, 27, 29],
    Diciembre: [4, 11, 14, 18, 21, 28],
  },
  "hipodromo-chile": {
    Enero: [3, 10, 15, 17, 24, 29, 31],
    Febrero: [5, 7, 14, 19, 21, 26, 28],
    Marzo: [5, 7, 14, 19, 21, 26, 28],
    Abril: [4, 9, 11, 16, 18, 25, 30],
    Mayo: [2, 7, 9, 16, 21, 23, 28, 30],
    Junio: [4, 6, 13, 18, 20, 25, 27],
    Julio: [2, 4, 11, 16, 18, 25, 30],
    Agosto: [1, 6, 8, 15, 20, 22, 27, 29],
    Septiembre: [3, 5, 10, 12, 19, 24, 26],
    Octubre: [3, 10, 15, 17, 22, 24, 29, 31],
    Noviembre: [5, 7, 14, 19, 21, 26, 28],
    Diciembre: [3, 5, 12, 19, 26, 31],
  },
  valparaiso: {
    Enero: [4, 7, 11, 14, 19, 21],
    Febrero: [1, 4, 16, 18, 22, 25],
    Marzo: [2, 4, 11, 16, 18, 25, 30],
    Abril: [1, 8, 13, 15, 22, 27, 29],
    Mayo: [3, 6, 11, 13, 20, 27],
    Junio: [1, 3, 8, 10, 17, 22, 24],
    Julio: [1, 6, 8, 15, 20, 22, 29],
    Agosto: [3, 5, 12, 17, 19, 26, 31],
    Septiembre: [2, 9, 14, 16, 23, 28],
    Octubre: [1, 7, 12, 14, 21, 26, 28],
    Noviembre: [2, 4, 9, 11, 18, 23, 25, 30],
    Diciembre: [2, 7, 9, 16, 23, 30],
  },
  concepcion: {
    Enero: [8, 13, 20, 22, 27],
    Febrero: [3, 10, 12, 17, 24],
    Marzo: [3, 10, 12, 17, 24, 31],
    Abril: [7, 14, 21, 23, 28],
    Mayo: [5, 12, 14, 19, 26],
    Junio: [2, 9, 11, 16, 23, 30],
    Julio: [7, 9, 14, 21, 28],
    Agosto: [4, 11, 13, 18, 25],
    Septiembre: [1, 8, 15, 17, 22, 29],
    Octubre: [6, 8, 13, 20, 27],
    Noviembre: [3, 10, 12, 17, 24],
    Diciembre: [1, 10, 15, 22, 29],
  },
};

const MONTHLY_HIPODROMO_TO_CALENDAR_TRACK = {
  "Club Hipico": "chs",
  "Hipodromo Chile": "hipodromo-chile",
  Sporting: "valparaiso",
  Concepcion: "concepcion",
};

const mainNav = document.getElementById("mainNav");
const adminView = document.getElementById("view-admin");
const dailyView = document.getElementById("view-daily");
const weeklyView = document.getElementById("view-weekly");
const monthlyView = document.getElementById("view-monthly");
const toast = document.getElementById("toast");

document.getElementById("refreshButton").addEventListener("click", loadDashboard);

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 2600);
}

function getCaptureApiFinal() {
  return window.htmlToImage || window.htmlToImageLib || null;
}

function getCaptureDimensionFinal(node, dimension) {
  if (!node) return dimension === "width" ? 1080 : 320;
  const rect = node.getBoundingClientRect();
  const ownValues = dimension === "width"
    ? [node.scrollWidth, node.offsetWidth, rect.width]
    : [node.scrollHeight, node.offsetHeight, rect.height];
  const descendantValue = Array.from(node.querySelectorAll("*")).reduce((max, child) => {
    const childRect = child.getBoundingClientRect();
    return Math.max(max, dimension === "width" ? childRect.right - rect.left : childRect.bottom - rect.top);
  }, 0);
  return Math.ceil(Math.max(...ownValues.filter(Boolean), descendantValue, dimension === "width" ? 1080 : 320));
}

async function captureElementAsFileFinal(node, fileName = "captura", options = {}) {
  const captureApi = getCaptureApiFinal();
  if (!captureApi?.toBlob || !node) {
    throw new Error("La captura de imagen no esta disponible.");
  }
  const blob = await captureApi.toBlob(node, {
    cacheBust: true,
    pixelRatio: options.pixelRatio || 2,
    backgroundColor: options.backgroundColor || "#edf3fb",
    width: options.width || getCaptureDimensionFinal(node, "width"),
    height: options.height || getCaptureDimensionFinal(node, "height"),
  });
  if (!blob) {
    throw new Error("No se pudo generar la imagen.");
  }
  return new File([blob], `${fileName}.png`, { type: "image/png" });
}

function buildPicksExportNodeFinal(panel, options = {}) {
  const title = panel.querySelector("h3")?.textContent?.trim() || "Pronosticos registrados";
  const copy = panel.querySelector(".panel-head p")?.textContent?.trim() || "";
  const legend = panel.querySelector(".picks-legend");
  const table = panel.querySelector("table");
  if (!table) return null;
  const chunkLabel = options.chunkLabel ? ` · ${options.chunkLabel}` : "";
  const exportRoot = document.createElement("div");
  exportRoot.style.cssText = [
      "position:fixed",
      "left:-100000px",
      "top:0",
      "padding:28px",
      "background:#f6f9ff",
      "width:max-content",
      "box-sizing:border-box",
      "z-index:-1",
    ].join(";");
  exportRoot.innerHTML = `
      <section style="border:1px solid rgba(116,136,164,0.18); background:linear-gradient(180deg,#ffffff,#f5f8fd); border-radius:26px; padding:34px; box-shadow:0 20px 60px rgba(27,43,77,0.12); width:max-content;">
        <div style="display:grid; gap:8px; margin-bottom:14px">
          <h3 style="margin:0; font-size:44px; line-height:1.05; color:#17233c;">${title}${chunkLabel}</h3>
          <p style="margin:0; font-size:24px; color:#4f6280;">${copy}</p>
        </div>
        ${legend ? `<div style="margin-bottom:14px">${legend.outerHTML}</div>` : ""}
        <div data-picks-export-wrap style="overflow:visible; width:max-content; position:relative">
        ${table.outerHTML}
      </div>
    </section>
  `;
    const exportSection = exportRoot.querySelector("section");
    const exportTable = exportRoot.querySelector("table");
  if (exportSection) {
    exportSection.style.color = "#17233c";
  }
    if (exportTable) {
      exportTable.style.fontSize = "26px";
      exportTable.style.color = "#17233c";
      exportTable.style.borderCollapse = "separate";
      exportTable.style.borderSpacing = "0 6px";
      exportTable.style.width = "max-content";
      exportTable.style.minWidth = "max-content";
      exportTable.querySelectorAll("th").forEach((cell) => {
        cell.style.color = "#24340d";
        cell.style.fontWeight = "800";
        cell.style.fontSize = "24px";
        cell.style.padding = "18px 16px";
        cell.style.whiteSpace = "nowrap";
      });
      exportTable.querySelectorAll("td").forEach((cell) => {
        cell.style.color = "#111b2f";
        cell.style.padding = "16px 12px";
        cell.style.verticalAlign = "top";
        cell.style.whiteSpace = "nowrap";
      });
      exportTable.querySelectorAll("strong").forEach((node) => {
        node.style.color = "#111b2f";
        node.style.fontWeight = "800";
      });
      exportTable.querySelectorAll("small").forEach((node) => {
        node.style.color = "#394861";
        node.style.fontSize = "18px";
        node.style.fontWeight = "700";
        node.style.opacity = "1";
      });
      exportTable.querySelectorAll("tr").forEach((row) => {
        const cells = Array.from(row.children);
        cells.forEach((cell, index) => {
          if (index === 0) {
            cell.style.minWidth = "96px";
            cell.style.textAlign = "center";
          } else if (index === 1) {
            cell.style.minWidth = "240px";
          } else if (index === 2) {
            cell.style.minWidth = "132px";
            cell.style.textAlign = "center";
          } else {
            cell.style.minWidth = "214px";
          }
        });
      });
      exportTable.querySelectorAll("tbody tr td:nth-child(1)").forEach((cell) => {
        cell.style.fontSize = "24px";
        cell.style.fontWeight = "800";
        cell.style.color = "#0f1a2d";
      });
      exportTable.querySelectorAll("tbody tr td:nth-child(2) strong").forEach((node) => {
        node.style.fontSize = "24px";
        node.style.lineHeight = "1.1";
        node.style.color = "#0f1a2d";
      });
      exportTable.querySelectorAll("tbody tr td:nth-child(3) strong").forEach((node) => {
        node.style.fontSize = "28px";
        node.style.lineHeight = "1";
        node.style.color = "#425317";
      });
      exportTable.querySelectorAll(".score-cell").forEach((cell) => {
        cell.style.minHeight = "126px";
        cell.style.padding = "16px 16px 14px";
        cell.style.borderRadius = "20px";
        cell.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.8), 0 1px 2px rgba(20,30,48,0.05)";
      });
      exportTable.querySelectorAll(".score-cell strong").forEach((node) => {
        node.style.fontSize = "34px";
        node.style.lineHeight = "1";
      });
      exportTable.querySelectorAll(".score-cell span").forEach((node) => {
        node.style.fontSize = "20px";
        node.style.lineHeight = "1.22";
        node.style.fontWeight = node.style.fontWeight || "700";
        node.style.color = "#1d2a41";
      });
      exportTable.querySelectorAll(".score-cell.score-low, .score-cell.score-cell-compact").forEach((cell) => {
        cell.style.background = cell.style.background || "rgba(252,253,255,0.98)";
      });
    }
    return exportRoot;
  }

function buildPicksExportNodesFinal(panel, studsPerImage = 15, racesPerImage = 6) {
  const table = panel.querySelector("table");
  if (!table) return [];
  const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
  const headCells = Array.from(table.querySelectorAll("thead th"));
  const totalColumns = headCells.length;
  const fixedColumns = Math.min(3, totalColumns);
  const raceColumnCount = Math.max(0, totalColumns - fixedColumns);
  if (!bodyRows.length) return [];
  if (bodyRows.length <= studsPerImage && raceColumnCount <= racesPerImage) {
    const single = buildPicksExportNodeFinal(panel, { chunkLabel: "Parte 1 · C1-C" + Math.max(1, raceColumnCount) });
    return single ? [single] : [];
  }
  const chunks = [];
  for (let rowStart = 0; rowStart < bodyRows.length; rowStart += studsPerImage) {
    const rowEnd = Math.min(bodyRows.length, rowStart + studsPerImage);
    for (let raceStart = 0; raceStart < raceColumnCount; raceStart += racesPerImage) {
      const raceEnd = Math.min(raceColumnCount, raceStart + racesPerImage);
      const exportNode = buildPicksExportNodeFinal(panel, {
        chunkLabel: `Parte ${chunks.length + 1} · Stud ${rowStart + 1}-${rowEnd} · C${raceStart + 1}-C${raceEnd}`,
      });
      if (!exportNode) continue;
      const exportTable = exportNode.querySelector("table");
      if (!exportTable) {
        chunks.push(exportNode);
        continue;
      }
      const keepIndexes = new Set();
      for (let fixedIndex = 0; fixedIndex < fixedColumns; fixedIndex += 1) {
        keepIndexes.add(fixedIndex);
      }
      for (let raceIndex = raceStart; raceIndex < raceEnd; raceIndex += 1) {
        keepIndexes.add(fixedColumns + raceIndex);
      }
      exportTable.querySelectorAll("tr").forEach((row) => {
        Array.from(row.children).forEach((cell, cellIndex) => {
          if (!keepIndexes.has(cellIndex)) {
            cell.remove();
          }
        });
      });
      const exportBodyRows = Array.from(exportTable.querySelectorAll("tbody tr"));
      exportBodyRows.forEach((row, index) => {
        if (index < rowStart || index >= rowEnd) {
          row.remove();
        }
      });
      chunks.push(exportNode);
    }
  }
  return chunks;
}

async function shareOrDownloadFilesFinal(files) {
  if (navigator.share && navigator.canShare?.({ files })) {
    try {
      await navigator.share({ files, title: "Pollas Hipicas" });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  files.forEach((file) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });
  showToast("Tu navegador no pudo compartir la imagen. Se descargo el PNG.");
}

async function copyImageFileFinal(file) {
  if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
    await shareOrDownloadFilesFinal([file]);
    return;
  }
  await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })]);
  showToast("Imagen copiada al portapapeles.");
}

function bindPanelImageExports(root = document) {
  root.querySelectorAll("[data-export-panel-image]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";
    button.addEventListener("click", async () => {
      const mode = button.dataset.exportMode || "share";
      const panel = button.closest("[data-capture-panel]");
      if (!panel) {
        return showToast("No se encontro la tabla para exportar.");
      }
        try {
          const exportName = String(button.dataset.exportName || "pronosticos").toLowerCase().replace(/[^a-z0-9]+/gi, "-");
          let files = [];
          if (panel.dataset.capturePanel === "picks") {
            const exportNodes = buildPicksExportNodesFinal(panel, 15);
            if (!exportNodes.length) throw new Error("No se pudo preparar la tabla de pronosticos.");
            for (let index = 0; index < exportNodes.length; index += 1) {
              const exportNode = exportNodes[index];
              document.body.appendChild(exportNode);
              try {
                const captureTarget = exportNode.firstElementChild || exportNode;
                const partName = exportNodes.length > 1 ? `${exportName}-parte-${index + 1}` : exportName;
                const file = await captureElementAsFileFinal(captureTarget, partName, {
                  pixelRatio: 4,
                  backgroundColor: "#edf3fb",
                  width: Math.ceil(captureTarget.scrollWidth || captureTarget.offsetWidth || 3200),
                  height: Math.ceil(captureTarget.scrollHeight || captureTarget.offsetHeight || 1800),
                });
                files.push(file);
              } finally {
                exportNode.remove();
              }
            }
          } else {
            const file = await captureElementAsFileFinal(panel, exportName);
            files = [file];
          }
          if (mode === "copy") {
            if (files.length === 1) {
              await copyImageFileFinal(files[0]);
            } else {
              await shareOrDownloadFilesFinal(files);
              showToast("Se generaron varias imagenes. Se descargaron para revisar cada parte.");
            }
          } else {
            await shareOrDownloadFilesFinal(files);
          }
        } catch (error) {
          showToast(error.message || "No se pudo exportar la imagen.");
        }
    });
  });
}

function bindWhatsAppExport() {
  document.querySelectorAll("[data-export-whatsapp]").forEach((button) => {
    if (button.dataset.boundWhatsapp === "true") return;
    button.dataset.boundWhatsapp = "true";
    button.addEventListener("click", async () => {
      const eventId = button.dataset.eventId;
      if (!eventId) {
        return showToast("No se encontro el evento para exportar.");
      }

      // Buscar el evento en todas las campañas
      const event = findEventById(eventId);
      if (!event) {
        return showToast("No se encontro el evento para exportar.");
      }

      // Debug: verificar estructura del evento
      console.log('📱 Evento encontrado:', {
        id: event.id,
        hasParticipants: !!event.participants,
        participantCount: event.participants?.length || 0,
        firstParticipantPicks: event.participants?.[0]?.picks?.length || 0,
        races: event.races,
        eventKeys: Object.keys(event)
      });
      
      // Debug: mostrar algunas propiedades del evento para entender su estructura
      if (event) {
        console.log('🔍 Contenido del evento:', {
          id: event.id,
          date: event.date,
          operationDate: event.operationDate,
          trackId: event.trackId,
          programTrackId: event.programTrackId,
          trackName: event.trackName,
          viewLabel: event.viewLabel,
          sheetName: event.sheetName,
          campaign: event.campaign,
          races: event.races,
          participants: event.participants?.length
        });
      }

      if (!event.participants || event.participants.length === 0) {
        return showToast("El evento no tiene participantes cargados.");
      }

      try {
        // Importar módulo WhatsApp dinámicamente
        await import("../exports/whatsapp-pronosticos.js");
        const WhatsAppPicksExporter = window.WhatsAppPicksExporter;

        if (!WhatsAppPicksExporter) {
          throw new Error("No se pudo cargar el módulo de WhatsApp.");
        }

        // Detectar tema según la vista actual o el tipo de campaña
        let theme = 'daily';
        if (state.currentView === 'weekly') theme = 'weekly';
        else if (state.currentView === 'monthly') theme = 'monthly';
        else if (event.campaign?.kind) {
          theme = event.campaign.kind;
        }

        // Debug: verificar propiedades del evento para encontrar programa
        console.log('🔍 Propiedades del evento para programa:', {
          date: event.date,
          operationDate: event.operationDate,
          trackId: event.trackId,
          programTrackId: event.programTrackId,
          trackName: event.trackName,
          viewLabel: event.viewLabel,
          sheetName: event.sheetName,
          campaign: event.campaign?.name,
          races: event.races
        });

        // Extraer fecha del título si no está en el evento
        const eventDate = event.date || event.operationDate || event.viewLabel || event.sheetName || '';
        const dateMatch = eventDate.match(/(\d{4}-\d{2}-\d{2})/);
        const extractedDate = dateMatch ? dateMatch[1] : null;
        
        console.log('📅 Fecha extraída:', extractedDate);

        // Obtener programa para nombres de caballos
        let program = null;
        if (typeof getProgramForEventFinal === 'function' && extractedDate) {
          // Crear un evento fake con la fecha extraída para buscar el programa
          const fakeEvent = {
            date: extractedDate,
            races: event.races,
            campaign: event.campaign
          };
          program = getProgramForEventFinal(fakeEvent, '');
        }

        console.log('📱 Exportando WhatsApp:', { 
          eventId, 
          theme, 
          view: state.currentView, 
          hasProgram: !!program,
          programTrackId: program?.trackId,
          extractedDate
        });

        // Extraer datos del evento con tema y programa
        const exportData = WhatsAppPicksExporter.extractEventData(event, theme, program);
        
        console.log('📊 Datos extraídos:', {
          title: exportData.title,
          races: exportData.races.length,
          studs: exportData.studs.length,
          firstStudPicks: exportData.studs[0]?.picks?.length || 0,
          firstPick: exportData.studs[0]?.picks?.[0]
        });

        // Generar imagen con tema
        const exporter = new WhatsAppPicksExporter({ theme });
        const blob = await exporter.generateImage(exportData);

        // Generar nombre de archivo
        const fileName = `pronosticos-${theme}-${exportData.date}-${(exportData.track || 'hipodromo').replace(/[^a-z0-9]/gi, "-").toLowerCase()}`;

        // Compartir o descargar
        await exporter.shareImage(blob, fileName);
      } catch (error) {
        console.error("Error exportando WhatsApp:", error);
        showToast(error.message || "No se pudo generar la imagen para WhatsApp.");
      }
    });
  });
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

const ADMIN_SESSION_KEY = "pollas-hipicas-admin-session";

function loadPersistedAdminSession() {
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (error) {
    return {};
  }
}

function persistAdminSession() {
  if (!state.data) return;
  try {
    window.localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
      currentView: state.currentView,
      adminUnlocked: Boolean(state.adminUnlocked),
      currentAdminUser: state.currentAdminUser || null,
      adminTab: state.adminTab,
      campaignsTab: state.campaignsTab,
    }));
  } catch (error) {
    // no-op
  }
}

function clearPersistedAdminSession() {
  try {
    window.localStorage.removeItem(ADMIN_SESSION_KEY);
  } catch (error) {
    // no-op
  }
}

const bootPersistedAdminSession = loadPersistedAdminSession();
if (bootPersistedAdminSession.currentView && ["admin", "daily", "weekly", "monthly"].includes(bootPersistedAdminSession.currentView)) {
  state.currentView = bootPersistedAdminSession.currentView;
}
if (bootPersistedAdminSession.adminTab) {
  state.adminTab = bootPersistedAdminSession.adminTab;
}
if (bootPersistedAdminSession.campaignsTab) {
  state.campaignsTab = bootPersistedAdminSession.campaignsTab;
}
if (bootPersistedAdminSession.adminUnlocked) {
  state.adminUnlocked = true;
  state.currentAdminUser = bootPersistedAdminSession.currentAdminUser || null;
  state.currentView = "admin";
}

function findEventById(eventId) {
  // Buscar en todos los tipos de eventos
  const allEvents = [
    ...safeArray(state.data?.diaria?.events),
    ...safeArray(state.data?.semanal?.events),
    ...safeArray(state.data?.mensual?.events),
  ];
  return allEvents.find((item) => item.id === eventId) || null;
}

function toNumeric(value) {
  if (typeof value === "number") return value;
  const parsed = Number(String(value || "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDividend(value) {
  const num = toNumeric(value);
  if (num === null) return "-";
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: Number.isInteger(num) ? 0 : 1,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatScoreValue(value, scoringMode = "dividend") {
  const num = toNumeric(value);
  if (num === null) return "-";
  if (scoringMode === "points") {
    return new Intl.NumberFormat("es-CL", { maximumFractionDigits: 0 }).format(Math.round(num));
  }
  return formatDividend(num);
}

function formatCurrencyNumber(value) {
  const num = Number(value || 0);
  return `$${new Intl.NumberFormat("es-CL", {
    maximumFractionDigits: 0,
  }).format(num)}`;
}

function formatDateTime(value) {
  if (!value) return "Sin fecha";
  return new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function getCalendarTrackMeta(trackId) {
  return CALENDAR_TRACKS.find((track) => track.id === trackId) || CALENDAR_TRACKS[0];
}

function getCalendarMonthFromDate(dateValue) {
  if (!dateValue) return "";
  const date = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return CALENDAR_MONTHS[date.getMonth()] || "";
}

function getCalendarEntries(trackId, monthFilter = "") {
  const trackSchedule = CALENDAR_SCHEDULE_2026[trackId] || {};
  return CALENDAR_MONTHS
    .map((month) => ({ month, days: safeArray(trackSchedule[month]) }))
    .filter((entry) => !monthFilter || entry.month === monthFilter);
}

function getCalendarTrackIdsForMonthlySelection(selectedHipodromos = []) {
  return safeArray(selectedHipodromos)
    .map((value) => MONTHLY_HIPODROMO_TO_CALENDAR_TRACK[value])
    .filter(Boolean);
}

function buildMonthlyCalendarEntries(campaignId, draft = {}) {
  const selectedHipodromos = safeArray(draft.hipodromos);
  const selectedTrackIds = getCalendarTrackIdsForMonthlySelection(selectedHipodromos);
  if (!draft.startDate || !draft.endDate || !selectedTrackIds.length) return [];
  return selectedTrackIds.flatMap((trackId) => {
    const trackMeta = getCalendarTrackMeta(trackId);
    return getCalendarEntries(trackId)
      .flatMap((entry) => entry.days.map((day) => {
        const monthIndex = CALENDAR_MONTHS.indexOf(entry.month);
        const date = new Date(2026, monthIndex, day);
        const isoDate = Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
        if (!isoDate || !isDateWithinRange(isoDate, draft.startDate, draft.endDate)) return null;
        return {
          key: `calendar-${trackId}-${isoDate}`,
          date: isoDate,
          label: `${trackMeta.label} · ${isoDate}`,
        };
      }))
      .filter(Boolean);
  }).sort((a, b) => a.date.localeCompare(b.date, "es"));
}

function getUpcomingCalendarDates(entries, fromDateValue) {
  const baseDate = fromDateValue ? new Date(`${fromDateValue}T00:00:00`) : new Date();
  return entries
    .flatMap((entry) => entry.days.map((day) => {
      const monthIndex = CALENDAR_MONTHS.indexOf(entry.month);
      const date = new Date(2026, monthIndex, day);
      return { month: entry.month, day, date };
    }))
    .filter((item) => !Number.isNaN(item.date.getTime()) && item.date >= baseDate)
    .sort((a, b) => a.date - b.date)
    .slice(0, 4);
}

function renderCalendarAdminPanel(referenceDate = toLocalDateInputValue()) {
  const trackId = CALENDAR_SCHEDULE_2026[state.adminCalendarTrack] ? state.adminCalendarTrack : CALENDAR_TRACKS[0].id;
  const monthFilter = state.adminCalendarMonth || "";
  const trackMeta = getCalendarTrackMeta(trackId);
  const entries = getCalendarEntries(trackId, monthFilter);
  const totalJornadas = entries.reduce((sum, entry) => sum + entry.days.length, 0);
  const activeMonths = entries.filter((entry) => entry.days.length).length;
  const currentMonth = getCalendarMonthFromDate(referenceDate);
  const monthHint = monthFilter || currentMonth || "Todo el año";
  const upcoming = getUpcomingCalendarDates(getCalendarEntries(trackId), referenceDate);
  const summaryCards = [
    { label: "Hipodromo", value: `${trackMeta.badge} ${trackMeta.label}` },
    { label: "Mes visible", value: monthHint },
    { label: "Jornadas", value: totalJornadas },
    { label: "Meses con reunion", value: activeMonths },
  ];
  const rows = entries.map((entry) => [
    entry.month,
    entry.days.length,
    entry.days.length ? entry.days.join(", ") : "-",
  ]);
  return `<section class="panel"><div class="panel-head"><h3>Calendario 2026</h3><p>Malla anual por hipodromo para armar campañas, revisar jornadas y anticipar fechas de reunion.</p></div><div class="toolbar"><div class="field" style="min-width:260px"><label>Hipodromo</label><select id="calendarTrackFilter">${CALENDAR_TRACKS.map((track) => `<option value="${track.id}"${track.id === trackId ? " selected" : ""}>${track.badge} ${track.label}</option>`).join("")}</select></div><div class="field" style="min-width:220px"><label>Mes</label><select id="calendarMonthFilter"><option value="">Todo el año</option>${CALENDAR_MONTHS.map((month) => `<option value="${month}"${month === monthFilter ? " selected" : ""}>${month}</option>`).join("")}</select></div><span class="hint">Base 2026 cargada manualmente para consulta rápida dentro del administrador.</span></div><div class="cards two">${summaryCards.map((item) => `<article class="mini-card"><span class="label">${item.label}</span><strong>${item.value}</strong></article>`).join("")}</div></section><section class="grid-2"><section class="panel"><div class="panel-head"><h3>Jornadas por mes</h3><p>Días oficiales informados para ${trackMeta.label}.</p></div>${setTable(["Mes", "Cantidad", "Dias"], rows)}</section><section class="panel"><div class="panel-head"><h3>Proximas jornadas</h3><p>Lectura rápida desde la fecha operativa actual.</p></div>${upcoming.length ? `<div class="stack">${upcoming.map((item) => `<article class="mini-card"><span class="label">${item.month}</span><strong>${String(item.day).padStart(2, "0")} de ${item.month}</strong></article>`).join("")}</div>` : '<div class="empty">No quedan jornadas futuras para el filtro elegido.</div>'}<div class="result-metrics"><article><span>Referencia</span><strong>${referenceDate || "Hoy"}</strong></article><article><span>Filtro</span><strong>${monthFilter || "Anual"}</strong></article></div><p class="hint">El grupo asociado de una campaña no cambia este calendario: aquí solo revisas en qué días corre cada hipódromo.</p></section></section>`;
}

function getProgramStorageKey(date, trackId) {
  return `${String(date || "").trim()}::${String(trackId || "").trim()}`;
}

function getProgramForDateTrack(date, trackId) {
  return state.data?.programs?.[getProgramStorageKey(date, trackId)] || null;
}

function getProgramTrackOptionsForDate(date) {
  const programs = state.data?.programs || {};
  return Object.values(programs)
    .filter((program) => String(program?.date || "") === String(date || ""))
    .map((program) => ({
      trackId: String(program.trackId || "").trim(),
      trackName: String(program.trackName || getCalendarTrackMeta(program.trackId)?.label || program.trackId || "").trim(),
      raceCount: Object.keys(program.races || {}).length,
    }))
    .filter((item, index, array) => item.trackId && array.findIndex((entry) => entry.trackId === item.trackId) === index)
    .sort((a, b) => a.trackName.localeCompare(b.trackName, "es"));
}

function getResolvedProgramTrackId(operationDate, selectedTrackId = "") {
  const options = getProgramTrackOptionsForDate(operationDate);
  if (!options.length) return "";
  if (selectedTrackId && options.some((item) => item.trackId === selectedTrackId)) return selectedTrackId;
  if (options.length === 1) return options[0].trackId;
  return "";
}

function getProgramForEventFinal(event, preferredTrackId = "") {
  const eventDate = String(event?.date || event?.operationDate || "").trim();
  if (!eventDate) return null;
  const options = getProgramTrackOptionsForDate(eventDate);
  if (!options.length) return null;
  const selectedTrackId = String(preferredTrackId || event?.programTrackId || event?.trackId || "").trim();
  if (selectedTrackId && options.some((item) => item.trackId === selectedTrackId)) {
    return getProgramForDateTrack(eventDate, selectedTrackId);
  }
  const campaignTracks = safeArray(event?.campaign?.hipodromos)
    .map((hipodromo) => MONTHLY_HIPODROMO_TO_CALENDAR_TRACK[hipodromo] || hipodromo)
    .filter(Boolean);
  const matchedTrackId = campaignTracks.find((trackId) => options.some((item) => item.trackId === trackId));
  if (matchedTrackId) {
    return getProgramForDateTrack(eventDate, matchedTrackId);
  }
  const searchText = normalizeText([
    event?.viewLabel,
    event?.sheetName,
    event?.title,
    event?.campaign?.name,
    safeArray(event?.campaign?.hipodromos).join(" "),
  ].filter(Boolean).join(" "));
  const matchedByName = options.find((item) => {
    const trackText = normalizeText(`${item.trackName || ""} ${item.trackId || ""}`);
    return searchText && (searchText.includes(trackText) || trackText.includes(searchText) || searchText.includes(normalizeText(item.trackName || "")));
  });
  if (matchedByName) {
    return getProgramForDateTrack(eventDate, matchedByName.trackId);
  }
  const matchedByRaceCount = options.find((item) => Number(item.raceCount) === Number(event?.races || 0));
  if (matchedByRaceCount) {
    return getProgramForDateTrack(eventDate, matchedByRaceCount.trackId);
  }
  if (options.length === 1) {
    return getProgramForDateTrack(eventDate, options[0].trackId);
  }
  return null;
}

function getCampaignProgramTrackId(campaign, eventDate = "", fallbackTrackId = "") {
  const options = eventDate ? getProgramTrackOptionsForDate(eventDate) : [];
  const explicitTrackId = String(fallbackTrackId || campaign?.programTrackId || campaign?.trackId || "").trim();
  if (explicitTrackId && (!options.length || options.some((item) => item.trackId === explicitTrackId))) {
    return explicitTrackId;
  }
  const candidates = safeArray(campaign?.hipodromos)
    .map((hipodromo) => MONTHLY_HIPODROMO_TO_CALENDAR_TRACK[hipodromo] || hipodromo)
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  const matchedCandidate = candidates.find((trackId) => !options.length || options.some((item) => item.trackId === trackId));
  if (matchedCandidate) return matchedCandidate;
  if (eventDate) {
    return getResolvedProgramTrackId(eventDate, explicitTrackId);
  }
  return "";
}

function getRunnerNameFromProgram(program, raceNumber, horseNumber) {
  if (!program || !raceNumber || !horseNumber) return "";
  const race = program.races?.[String(raceNumber)] || null;
  const normalizeRunnerNumber = (value) => String(value || "").trim().replace(/^0+(\d)/, "$1").toUpperCase();
  const targetNumber = normalizeRunnerNumber(horseNumber);
  const target = safeArray(race?.entries).find((entry) => {
    const entryNumber = normalizeRunnerNumber(entry.number);
    return entryNumber === targetNumber
      || String(Number(entry.number) || "").trim() === String(Number(horseNumber) || "").trim();
  });
  return String(target?.name || "").trim();
}

function parseProgramBulkEntries(rawText) {
  const races = {};
  String(rawText || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line) => {
      const parts = line.split(/[;,\t|]/).map((part) => String(part || "").trim());
      if (parts.length < 3) return;
      const race = String(Number(parts[0]) || "").trim();
      const number = String(parts[1] || "").trim();
      const name = String(parts[2] || "").trim();
      const jockey = String(parts[3] || "").trim();
      if (!race || !number || !name) return;
      if (!races[race]) {
        races[race] = {
          race: Number(race),
          label: `Carrera ${race}`,
          entries: [],
        };
      }
      races[race].entries.push({ number, name, jockey });
    });
  return races;
}

function renderProgramTable(program) {
  if (!program) {
    return '<div class="empty">Todavia no hay programa guardado para esa fecha e hipodromo.</div>';
  }
  const rows = Object.values(program.races || {})
    .sort((a, b) => Number(a.race) - Number(b.race))
    .flatMap((race) => safeArray(race.entries).map((entry) => [
      race.race,
      entry.number || "-",
      entry.name || "-",
      entry.jockey || "-",
    ]));
  return setTable(["Carrera", "Numero", "Ejemplar", "Jinete"], rows);
}

function renderProgramAdminPanel() {
  const programDate = state.adminProgramDate || toLocalDateInputValue();
  const trackId = state.adminProgramTrack || CALENDAR_TRACKS[0].id;
  const trackMeta = getCalendarTrackMeta(trackId);
  const program = getProgramForDateTrack(programDate, trackId);
  const savedCount = getProgramTrackOptionsForDate(programDate).length;
  return `<section class="panel"><div class="panel-head"><h3>Programa de carreras</h3><p>Aqui guardas el programa del dia por fecha e hipodromo, y luego Pronostico usa esos ejemplares para mostrar el nombre debajo del numero.</p></div><div class="result-metrics"><article><span>Fecha</span><strong>${programDate || "-"}</strong></article><article><span>Hipodromos cargados</span><strong>${savedCount}</strong></article><article><span>Jornadas guardadas</span><strong>${Object.keys(program?.races || {}).length}</strong></article></div></section><section class="grid-2"><section class="panel"><div class="panel-head"><h3>Cargar programa</h3><p>Importa desde Teletrak o pega una linea por ejemplar con formato: carrera;numero;ejemplar;jinete</p></div><form id="programForm" class="editor-form"><div class="form-grid"><div class="field"><label>Fecha</label><input name="date" type="date" value="${programDate}" /></div><div class="field"><label>Hipodromo</label><select name="trackId">${CALENDAR_TRACKS.map((track) => `<option value="${track.id}"${track.id === trackId ? " selected" : ""}>${track.badge} ${track.label}</option>`).join("")}</select></div></div><div class="field"><label>Programa en bloque</label><textarea name="bulkProgram" rows="14" placeholder="1;1;Larrykane;Jinete A&#10;1;2;The Great Johnny;Jinete B&#10;2;1;Otro Caballo;Jinete C">${program ? Object.values(program.races || {}).sort((a, b) => Number(a.race) - Number(b.race)).flatMap((race) => safeArray(race.entries).map((entry) => [race.race, entry.number, entry.name, entry.jockey].filter(Boolean).join(";"))).join("&#10;") : ""}</textarea></div><div class="actions"><span class="hint">Teletrak se usa como fuente principal cuando la reunion esta viva para esa fecha. Si no responde o quieres corregir algo, puedes editar este bloque manualmente.</span><button class="ghost-button" type="button" id="importProgramTeletrakButton">Importar desde Teletrak</button><button class="primary-button" type="submit">Guardar programa</button>${program ? '<button class="ghost-button" type="button" id="deleteProgramButton">Eliminar programa</button>' : ""}</div></form></section><section class="panel"><div class="panel-head"><h3>${trackMeta.label} · ${programDate}</h3><p>Programa actualmente guardado para esta combinacion.${program?.source === "teletrak" ? ` Fuente: Teletrak${program?.sourceUrl ? ` · <a href="${program.sourceUrl}" target="_blank" rel="noreferrer">abrir origen</a>` : ""}.` : ""}</p></div>${renderProgramTable(program)}</section></section>`;
}

function renderNav() {
  mainNav.innerHTML = navItems
    .map((item) => `<button class="nav-button${state.currentView === item.id ? " active" : ""}" data-nav="${item.id}">${item.label}</button>`)
    .join("");
  mainNav.querySelectorAll("[data-nav]").forEach((button) => {
    button.addEventListener("click", () => {
      state.currentView = button.dataset.nav;
      persistAdminSession();
      render();
    });
  });
}

function setTable(columns, rows) {
  if (!rows.length) {
    return `<div class="table-wrap"><table><tbody><tr><td class="empty">No hay datos disponibles.</td></tr></tbody></table></div>`;
  }
  return `<div class="table-wrap"><table><thead><tr>${columns.map((column) => `<th>${column}</th>`).join("")}</tr></thead><tbody>${rows
    .map((row) => `<tr>${row.map((cell) => `<td>${cell ?? ""}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function renderHero(title, copy, stats) {
  return `<section class="hero" style="padding:12px 14px; gap:10px; grid-template-columns:1.08fr 0.92fr;"><div style="display:grid; gap:5px;"><p class="eyebrow" style="margin-bottom:0;">Vista actual</p><h2 style="font-size:clamp(1.02rem,1.35vw,1.42rem); line-height:1.04;">${title}</h2><p class="hero-copy" style="font-size:0.78rem; max-width:720px;">${copy}</p></div><div class="hero-stats" style="gap:8px;">${stats
      .map((item) => `<article class="stat-card"><span class="label">${item.label}</span><strong>${item.value}</strong></article>`)
      .join("")}</div></section>`;
}

function getScoringLabel(scoringMode = "dividend") {
  return scoringMode === "points" ? "Por puntos" : "Por dividendos";
}

function getMaxPickScore(event) {
  const scores = safeArray(event?.participants).flatMap((participant) => safeArray(participant.picks).map((pick) => toNumeric(pick.score) || 0));
  return Math.max(0, ...scores);
}

function getScoreToneClass(score, maxScore) {
  const numeric = toNumeric(score) || 0;
  if (numeric <= 0) return "score-cell-empty";
  if (!maxScore || numeric >= maxScore) return "score-cell-max";
  const ratio = numeric / maxScore;
  if (ratio >= 0.72) return "score-cell-high";
  if (ratio >= 0.38) return "score-cell-mid";
  return "score-cell-low";
}

function normalizeHexColor(value, fallback) {
  const text = String(value || "").trim();
  const hex = /^#?[0-9a-f]{6}$/i.test(text) ? (text.startsWith("#") ? text : `#${text}`) : "";
  return hex || fallback;
}

function hexToRgb(hex) {
  const normalized = normalizeHexColor(hex, "#000000").replace("#", "");
  const int = parseInt(normalized, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((value) => Math.max(0, Math.min(255, Math.round(value))).toString(16).padStart(2, "0")).join("")}`;
}

function mixHexColors(sourceHex, targetHex, ratio) {
  const source = hexToRgb(sourceHex);
  const target = hexToRgb(targetHex);
  return rgbToHex({
    r: source.r + (target.r - source.r) * ratio,
    g: source.g + (target.g - source.g) * ratio,
    b: source.b + (target.b - source.b) * ratio,
  });
}

function hexToRgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function getThemeBaseColor(theme = "daily") {
  const defaults = {
    daily: "#c56a2d",
    weekly: "#2d6aa5",
    monthly: "#2d7d57",
  };
  return normalizeHexColor(state.data?.settings?.themes?.[theme], defaults[theme] || defaults.daily);
}

function getOfficialBannerTheme(theme = "daily") {
  const accent = getThemeBaseColor(theme);
  const dark = mixHexColors(accent, "#102331", 0.35);
  const light = mixHexColors(accent, "#ffffff", 0.18);
  const textColor = theme === "monthly" ? "#f6fff8" : "#f6fbff";
  return {
    style: `background:linear-gradient(135deg, ${hexToRgba(dark, 0.98)}, ${hexToRgba(light, 0.92)}); color:${textColor}; border:1px solid ${hexToRgba(accent, 0.28)}; box-shadow:0 24px 48px ${hexToRgba(dark, 0.22)};`,
    pillStyle: `background:rgba(255,255,255,0.12); color:${textColor}; border:1px solid rgba(255,255,255,0.18);`,
    metaStyle: `background:rgba(255,255,255,0.10); border:1px solid rgba(255,255,255,0.16); color:${textColor};`,
  };
}

function renderOfficialBanner(kicker, title, subtitle, chips = [], theme = "daily", metaItems = []) {
  const bannerTheme = getOfficialBannerTheme(theme);
  const visibleMeta = safeArray(metaItems)
    .slice(0, 4)
    .filter((item) => item && item.value !== undefined && item.value !== null && String(item.value).trim() !== "");
  return `<section class="hero hero-poster hero-poster-compact" style="${bannerTheme.style}; min-height:0; padding:8px 10px; gap:6px; grid-template-columns:1fr;"><div class="hero-poster-copy" style="max-width:100%; gap:4px;"><p class="eyebrow" style="color:inherit;opacity:0.8; margin-bottom:0;">${kicker}</p><h2 style="color:inherit; font-size:clamp(0.84rem,1vw,1.08rem); line-height:1.02;">${title}</h2><p class="hero-copy" style="color:inherit;opacity:0.88; max-width:620px; font-size:0.66rem;">${subtitle}</p><div class="hero-pills">${chips.map((chip) => `<span class="hero-pill" style="${bannerTheme.pillStyle}; padding:3px 7px; font-size:0.62rem;">${chip}</span>`).join("")}</div>${visibleMeta.length ? `<div class="hero-inline-stats">${visibleMeta.map((item) => `<article class="hero-inline-stat" style="${bannerTheme.metaStyle};"><span class="label" style="color:inherit;opacity:0.68">${item.label}</span><strong style="color:inherit;">${item.value}</strong></article>`).join("")}</div>` : ""}</div></section>`;
}

function getViewAccentPalette(theme = "daily") {
  const accent = getThemeBaseColor(theme);
  const accentText = mixHexColors(accent, "#102331", 0.4);
  return {
    accent,
    accentSoft: hexToRgba(accent, 0.10),
    accentSoft2: hexToRgba(accent, 0.18),
    accentText,
    border: hexToRgba(accent, 0.18),
    surface: hexToRgba(mixHexColors(accent, "#ffffff", 0.92), 0.98),
    surfaceAlt: hexToRgba(mixHexColors(accent, "#ffffff", 0.86), 0.98),
  };
}

function sortRankingEntriesFinal(entries) {
  return safeArray(entries)
    .slice()
    .sort((a, b) => {
      const left = toNumeric(a?.points ?? a?.totalPoints) || 0;
      const right = toNumeric(b?.points ?? b?.totalPoints) || 0;
      return right - left || String(a?.name || "").localeCompare(String(b?.name || ""), "es");
    });
}

function getTrackSummaryForDatesFinal(dates = []) {
  const tracks = new Map();
  safeArray(dates).forEach((date) => {
    getProgramTrackOptionsForDate(date).forEach((program) => {
      tracks.set(program.trackId, program.trackName);
    });
  });
  const names = Array.from(tracks.values());
  if (!names.length) return "Sin hipodromo";
  return names.length === 1 ? names[0] : `${names.length} hipodromos`;
}

function getPrizeSummaryLabelFinal(kind, campaign) {
  const summary = buildCampaignPrizeSummary(kind, campaign, state.data?.settings?.prizes || {});
  if (!summary || !summary.prizePool) return "Premios por definir";
  return `Pozo ${formatCurrencyNumber(summary.prizePool)}`;
}

function buildCampaignContextMetaFinal(kind, campaign, event = null, scoringMode = "dividend") {
  const groupLabel = getRegistryGroupLabel(campaign?.groupId);
  const trackLabel = kind === "monthly"
    ? (safeArray(campaign?.hipodromos).join(", ") || "Sin hipodromo")
    : getTrackSummaryForDatesFinal([event?.date].filter(Boolean));
  const prizeLabel = getPrizeSummaryLabelFinal(kind, campaign);
  const participants = safeArray(event?.participants).length || getCampaignRegisteredParticipants(kind, campaign).length || 0;
  return {
    chips: [
      `Grupo: ${groupLabel}`,
      `Premios: ${prizeLabel}`,
      `Hipodromo: ${trackLabel}`,
      getScoringLabel(scoringMode),
    ],
    meta: [
      { label: "Grupo", value: groupLabel },
      { label: "Premios", value: prizeLabel },
      { label: "Hipodromo", value: trackLabel },
      { label: "Participantes", value: participants || "-" },
    ],
  };
}

function renderCompactContextHeaderFinal(title, subtitle, theme = "daily", chips = [], metaItems = []) {
  const accent = theme === "weekly"
    ? "#2d6aa5"
    : theme === "monthly"
      ? "#2d7d57"
      : "#c56a2d";
  return `<section class="panel" style="padding:8px 10px; border-left:4px solid ${accent}; background:linear-gradient(180deg, rgba(255,255,255,0.98), rgba(248,251,255,0.98));"><div class="panel-head"><div><p class="eyebrow" style="color:${accent};opacity:0.9; margin-bottom:0;">Detalle</p><h3 style="margin:0; font-size:clamp(0.82rem,0.9vw,0.92rem)">${title}</h3><p style="margin:2px 0 0; color:#5f7394; font-size:0.68rem;">${subtitle}</p></div></div>${chips.length ? `<div class="hero-pills" style="margin-top:5px; gap:4px;">${chips.map((chip) => `<span class="hero-pill" style="background:${accent}12; color:${accent}; border:1px solid ${accent}2b; padding:3px 7px; font-size:0.62rem;">${chip}</span>`).join("")}</div>` : ""}</section>`;
}

function renderLeaderboardSpotlight(entries, scoringMode, title = "Tabla oficial", subtitle = "Asi va la jornada.", theme = "daily", options = {}) {
  const rows = sortRankingEntriesFinal(entries);
  const palette = getViewAccentPalette(theme);
  if (!rows.length) {
    return `<section class="panel panel-spotlight" style="border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt});"><div class="panel-head"><h3>${title}</h3><p>${subtitle}</p></div><div class="empty">Todavia no hay posiciones para mostrar.</div></section>`;
  }
  const leaderScore = toNumeric(rows[0]?.points ?? rows[0]?.totalPoints) || 0;
  const getGapCopy = (entry, index) => {
    const currentScore = toNumeric(entry?.points ?? entry?.totalPoints) || 0;
    const gap = Math.max(0, leaderScore - currentScore);
    if (index === 0) return "Lider actual";
    return formatScoreValue(gap, scoringMode);
  };
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const renderUpcoming = (entry) => {
    const picks = options.event ? getUpcomingPickPreviewFinal(options.event, entry?.name, 3) : [];
    if (!picks.length) return "";
    return `<div class="leader-upcoming" style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px">${picks.map((pick) => `<span style="display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border-radius:999px; background:${palette.surface}; border:1px solid ${palette.border}; color:${palette.accentText}; font-size:12px; font-weight:800"><small style="font-size:11px; opacity:.72">C${pick.race}</small><strong style="font-size:14px; color:${palette.accentText}">${pick.horse}</strong></span>`).join("")}</div>`;
  };
  return `<section class="panel panel-spotlight" style="border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt});"><div class="panel-head"><h3>${title}</h3><p>${subtitle}</p></div><div class="podium">${podium.map((entry, index) => `<article class="podium-card podium-card-${index + 1}" style="border:1px solid ${palette.border}; background:${index === 0 ? palette.accentSoft2 : palette.accentSoft}; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.28);"><span class="podium-place" style="background:${palette.accent}; color:#fff">${index + 1}</span><strong>${entry.name}</strong><span class="podium-total" style="color:${palette.accentText}">${formatScoreValue(entry.points ?? entry.totalPoints, scoringMode)}</span><p>${index === 0 ? "Lider actual" : `Dif. ${getGapCopy(entry, index)}`}</p>${renderUpcoming(entry)}</article>`).join("")}</div>${rest.length ? `<div class="leader-list leader-list-grid">${rest.map((entry, index) => `<div class="leader-row" style="border:1px solid ${palette.border}; background:${index % 2 === 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.85)"}"><span style="background:${palette.accentSoft}; color:${palette.accentText}; border:1px solid ${palette.border}">${index + 4}</span><strong>${entry.name}</strong><div class="leader-meta"><em>${formatScoreValue(entry.points ?? entry.totalPoints, scoringMode)}</em><small>Dif. ${getGapCopy(entry, index + 3)}</small></div>${renderUpcoming(entry)}</div>`).join("")}</div>` : ""}</section>`;
}

function renderResultsLedger(event, title = "Resultados oficiales", subtitle = "Lectura rapida de la jornada.", theme = "daily") {
  const results = safeArray(event?.results).slice().sort((a, b) => Number(a.race) - Number(b.race));
  const palette = getViewAccentPalette(theme);
  if (!results.length) {
    return `<section class="panel panel-results-ledger" style="border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt});"><div class="panel-head"><h3>${title}</h3><p>${subtitle}</p></div><div class="empty">Todavia no hay resultados cargados.</div></section>`;
  }
  return `<section class="panel panel-results-ledger" style="border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt});"><div class="panel-head"><h3>${title}</h3><p>${subtitle}</p></div><div class="results-ledger">${results.map((item, index) => `<article class="result-race-card" style="border:1px solid ${palette.border}; background:${index % 2 === 0 ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.90)"}; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.26);"><div class="result-race-head"><span class="label" style="background:${palette.accentSoft}; color:${palette.accentText}; border:1px solid ${palette.border}">Carrera ${item.race}</span></div><div class="result-podium"><div style="border-bottom:1px solid ${palette.border}"><span>1ro</span><strong>${item.primero || "-"}</strong><em style="color:${palette.accentText}">${formatDividend(item.ganador)}</em></div><div style="border-bottom:1px solid ${palette.border}"><span>2do</span><strong>${item.segundo || "-"}</strong><em style="color:${palette.accentText}">${formatDividend(item.divSegundo)}</em></div><div><span>3ro</span><strong>${item.tercero || "-"}</strong><em style="color:${palette.accentText}">${formatDividend(item.divTercero)}</em></div></div></article>`).join("")}</div></section>`;
}

function renderRaceFocusCard(event, title = "Caballos mas jugados", subtitle = "Que ejemplares concentran mas pronosticos en la proxima carrera.") {
  const race = getFocusRace(event);
  const distribution = getDistribution(event, race);
  return `<section class="panel panel-focus"><div class="panel-head"><h3>${title}</h3><p>${subtitle}</p></div><div class="focus-race">C${race}</div>${distribution.length ? `<div class="focus-grid">${distribution.map((item) => `<article><strong>${item.horse}</strong><span>${item.count} picks</span></article>`).join("")}</div>` : `<div class="empty">Sin picks en la carrera seleccionada.</div>`}</section>`;
}

function eventById(list, id) {
  return list.find((item) => item.id === id) || list[0] || null;
}

function getNextPendingRace(event) {
  if (!event) return null;
  const next = Array.from({ length: event.races }, (_, index) => String(index + 1)).find((race) => {
    const result = event.results.find((item) => String(item.race) === race);
    return !result || !result.primero;
  });
  return next || null;
}

function isEventFinished(event) {
  return !getNextPendingRace(event);
}

function getFocusRace(event) {
  return getNextPendingRace(event) || "1";
}

function getDistribution(event, raceNumber) {
  if (!event) return [];
  const idx = Number(raceNumber) - 1;
  const map = new Map();
  event.participants.forEach((participant) => {
    const horse = participant.picks[idx]?.horse;
    if (!horse) return;
    map.set(horse, (map.get(horse) || 0) + 1);
  });
  return Array.from(map.entries())
    .map(([horse, count]) => ({ horse, count }))
    .sort((a, b) => b.count - a.count || a.horse.localeCompare(b.horse, "es"))
    .slice(0, 8);
}

function aggregateEvents(events, title, id) {
  const map = new Map();
  safeArray(events).forEach((event) => {
    event.participants.forEach((participant) => {
      const current = map.get(participant.name) || { name: participant.name, totalPoints: 0, firsts: 0, seconds: 0, thirds: 0, hits: 0 };
      participant.picks.forEach((pick) => {
        const score = toNumeric(pick.score) || 0;
        current.totalPoints += score;
        if (score > 0) current.hits += 1;
        const result = event.results.find((item) => String(item.race) === String(pick.raceLabel));
        if (!result) return;
        if (pick.horse === result.primero) current.firsts += 1;
        else if (pick.horse === result.segundo) current.seconds += 1;
        else if (pick.horse === result.tercero) current.thirds += 1;
      });
      map.set(participant.name, current);
    });
  });
  return { id, title, participants: Array.from(map.values()).sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name, "es")) };
}

function getWeeklyEvents() {
  return state.data.semanal.events.filter((event) => safeArray(state.data.settings.weekly.activeDays).includes(event.sheetName));
}

function getMonthlyEvents() {
  const ids = safeArray(state.data.settings.monthly.selectedEventIds);
  return ids.length ? state.data.mensual.events.filter((event) => ids.includes(event.id)) : state.data.mensual.events;
}

function getAdminOpsEvents() {
  return state.adminOpsMode === "mensual" ? state.data.mensual.events : state.data.semanal.events;
}

function getCampaigns(kind) {
  return safeArray((state.data.settings.campaigns || {})[kind]);
}

function getEnabledCampaigns(kind) {
  return getCampaigns(kind).filter((campaign) => campaign.enabled !== false);
}

function normalizeIdPart(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function getUpcomingPickPreviewFinal(event, participantName, limit = 3) {
  if (!event || !participantName) return [];
  const participant = safeArray(event.participants).find((item) => normalizeText(item?.name) === normalizeText(participantName));
  if (!participant) return [];
  const nextPending = Number(getNextPendingRace(event) || 1);
  const picks = safeArray(participant.picks);
  return Array.from({ length: limit }, (_, offset) => {
    const race = nextPending + offset;
    const pick = picks[race - 1];
    if (!pick || !pick.horse) return null;
    return {
      race,
      horse: String(pick.horse || "").trim() || "-",
    };
  }).filter(Boolean);
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function createEmptyEvent(id, label, type = "semanal", races = 12) {
  const raceHeaders = Array.from({ length: races }, (_, index) => ({
    number: index + 1,
    label: String(index + 1),
  }));
  return {
    id,
    type,
    sheetName: label,
    title: label,
    races,
    raceHeaders,
    participants: [],
    results: [],
    leaderboard: [],
  };
}

function toLocalDateInputValue(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDailyCampaignEvents(currentDate = toLocalDateInputValue()) {
  const eventMap = new Map(state.data.semanal.events.map((event) => [event.id, event]));
  return getCampaigns("daily")
    .filter((campaign) => campaign.enabled !== false)
    .filter((campaign) => String(campaign.date || "") === currentDate)
    .map((campaign) => eventMap.get(campaign.eventId) || createEmptyEvent(campaign.eventId || `campaign-${campaign.id}`, campaign.name || campaign.date || "Diaria"))
    .filter(Boolean);
}

renderPicksTable = function renderPicksTableV3(event, title = "Pronosticos registrados", copy = "Detalle por carrera. La carga rapida ahora vive en Administrador > Pronostico.", options = {}) {
  const scoringMode = event?.scoring?.mode || "dividend";
  const theme = options.theme || (normalizeText(title).includes("mensual") ? "monthly" : normalizeText(title).includes("semanal") ? "weekly" : "daily");
  const palette = getViewAccentPalette(theme);
  const rows = safeArray(event.participants);
  const maxScore = getMaxPickScore(event);
  const program = options.program || getProgramForEventFinal({ ...event, campaign: options.campaign }, options.programTrackId || "");
  const showEdit = state.currentView === "admin" && state.adminUnlocked && state.adminTab === "forecasts";
  if (!rows.length) {
    return `<section class="panel panel-picks" style="border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt});"><div class="panel-head"><h3>${title}</h3><p>${copy}</p></div><div class="empty">Todavía no hay pronósticos registrados.</div></section>`;
  }
  const pickTone = (score) => {
    if (!maxScore) return { bg: "rgba(240,244,249,0.96)", fg: "#5a6a80", border: palette.border };
    const ratio = score / maxScore;
    if (ratio >= 0.72) return { bg: palette.accentSoft2, fg: palette.accentText, border: palette.border };
    if (ratio >= 0.38) return { bg: palette.accentSoft, fg: palette.accentText, border: palette.border };
    return { bg: "rgba(240,244,249,0.96)", fg: "#5a6a80", border: "rgba(154,168,190,0.22)" };
  };
  const renderPickCell = (pick, raceNumber) => {
    const score = toNumeric(pick?.score) || 0;
    const tone = pickTone(score);
    const horse = String(pick?.horse || "-").trim() || "-";
    const runnerName = program ? getRunnerNameFromProgram(program, raceNumber, horse) : "";
    const runnerCopy = runnerName ? `<small style="display:block; font-size:12px; line-height:1.2; opacity:0.82; margin-top:3px">${runnerName}</small>` : `<small style="display:block; font-size:12px; line-height:1.2; opacity:0.64; margin-top:3px">${program ? "Sin nombre para ese numero" : "Programa no cargado"}</small>`;
    return `<div class="score-cell score-cell-compact ${getScoreToneClass(score, maxScore)}" style="min-height:64px; padding:10px 10px; border:1px solid ${tone.border}; background:${tone.bg}; color:${tone.fg}; display:flex; flex-direction:column; justify-content:center; align-items:flex-start; gap:2px; border-radius:14px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.5);"><strong style="font-size:17px; line-height:1">${horse}</strong>${runnerCopy}<span style="font-weight:700; font-size:12px; opacity:0.92; margin-top:3px">${formatScoreValue(score, scoringMode)}</span></div>`;
  };
  return `<section class="panel panel-picks" style="border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt});"><div class="panel-head"><h3>${title}</h3><p>${copy}</p></div><div class="picks-legend"><span class="legend-dot legend-max"></span><span>Golpe fuerte</span><span class="legend-dot legend-high"></span><span>Suma alta</span><span class="legend-dot legend-mid"></span><span>Suma media</span><span class="legend-dot legend-low"></span><span>Suma baja</span></div><div class="table-wrap picks-wrap"><table class="picks-table picks-table-compact"><thead><tr><th style="background:${palette.accentSoft}; color:${palette.accentText}">N</th><th style="background:${palette.accentSoft}; color:${palette.accentText}">Stud</th><th style="background:${palette.accentSoft}; color:${palette.accentText}">Total</th>${Array.from({ length: event.races }, (_, index) => `<th style="background:${palette.accentSoft}; color:${palette.accentText}">C${index + 1}</th>`).join("")}${showEdit ? `<th style="background:${palette.accentSoft}; color:${palette.accentText}">Acciones</th>` : ""}</tr></thead><tbody>${rows.map((participant, index) => `<tr style="background:${index % 2 === 0 ? "rgba(255,255,255,0.68)" : "rgba(255,255,255,0.92)"}"><td><strong>${participant.index}</strong></td><td><strong>${participant.name}</strong></td><td><strong style="color:${palette.accentText}">${formatScoreValue(participant.points, scoringMode)}</strong></td>${safeArray(participant.picks).map((pick, raceIndex) => `<td>${renderPickCell(pick, raceIndex + 1)}</td>`).join("")}${showEdit ? `<td><div class="table-actions"><button type="button" class="ghost-button" data-edit-forecast="${event.id}" data-edit-index="${participant.index}">Editar</button><button type="button" class="ghost-button" data-delete-forecast="${event.id}" data-delete-index="${participant.index}">Eliminar</button></div></td>` : ""}</tr>`).join("")}</tbody></table></div></section>`;
}

function getWeekdayNameFromDate(dateValue) {
  if (!dateValue) return "";
  const [year, month, day] = String(dateValue).split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
  return ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"][date.getDay()] || "";
}

function isDateWithinRange(dateValue, startDate, endDate) {
  if (!dateValue) return false;
  if (startDate && dateValue < startDate) return false;
  if (endDate && dateValue > endDate) return false;
  return true;
}

function resolveCampaignTargetIds(selection) {
  const ids = [];
  const warnings = [];
  const operationDate = String(selection.operationDate || "");
  const weekday = getWeekdayNameFromDate(operationDate);

  if (selection.dailyCampaignId) {
    const campaign = getCampaigns("daily").find((item) => item.id === selection.dailyCampaignId);
    if (campaign?.eventId && campaign?.date === operationDate) {
      ids.push(campaign.eventId);
    } else if (campaign) {
      warnings.push(`La diaria "${campaign.name}" no corresponde a la fecha ${operationDate}.`);
    }
  }

  if (selection.weeklyCampaignId) {
    const campaign = getCampaigns("weekly").find((item) => item.id === selection.weeklyCampaignId);
    if (campaign) {
      const activeDays = safeArray(campaign.activeDays).length ? safeArray(campaign.activeDays) : safeArray(campaign.eventNames);
      if (!isDateWithinRange(operationDate, campaign.startDate, campaign.endDate)) {
        warnings.push(`La semanal "${campaign.name}" esta fuera de rango para la fecha ${operationDate}.`);
      } else if (activeDays.length && !activeDays.includes(weekday)) {
        warnings.push(`La semanal "${campaign.name}" no juega el ${weekday || "dia seleccionado"}.`);
      } else {
        const eventNames = safeArray(campaign.eventNames);
        const eventIds = safeArray(campaign.eventIds);
        const matchIndex = eventNames.findIndex((name) => name === weekday);
        if (matchIndex >= 0 && eventIds[matchIndex]) {
          ids.push(eventIds[matchIndex]);
        } else if (eventIds.length === 1) {
          ids.push(eventIds[0]);
        } else if (weekday && eventIds.length) {
          warnings.push(`La semanal "${campaign.name}" no tiene jornada configurada para ${weekday}.`);
        }
      }
    }
  }

  if (selection.monthlyCampaignId) {
    const campaign = getCampaigns("monthly").find((item) => item.id === selection.monthlyCampaignId);
    if (campaign) {
      if (!isDateWithinRange(operationDate, campaign.startDate, campaign.endDate)) {
        warnings.push(`La mensual "${campaign.name}" esta fuera de rango para la fecha ${operationDate}.`);
      } else {
        const eventIds = safeArray(campaign.eventIds);
        if (eventIds.length === 1) ids.push(eventIds[0]);
        else if (eventIds.length > 1) ids.push(eventIds[0]);
      }
    }
  }

  return {
    ids: Array.from(new Set(ids.filter(Boolean))),
    warnings,
  };
}

function getCampaignDisplayStatus(kind, campaign, referenceDate = toLocalDateInputValue()) {
  if (campaign.enabled === false) return "Desactivada";
  if (kind === "daily") {
    if (!campaign.date) return "Activa";
    if (campaign.date < referenceDate) return "Vencida";
    if (campaign.date > referenceDate) return "Programada";
    return "Activa";
  }
  if (kind === "weekly" || kind === "monthly") {
    if (campaign.startDate && referenceDate < campaign.startDate) return "Programada";
    if (campaign.endDate && referenceDate > campaign.endDate) return "Vencida";
    return "Activa";
  }
  return "Activa";
}

function getActiveCampaignsForReference(kind, referenceDate = toLocalDateInputValue()) {
  return getCampaigns(kind).filter((campaign) => getCampaignDisplayStatus(kind, campaign, referenceDate) === "Activa");
}

function getCampaignsForReferenceDate(kind, referenceDate = toLocalDateInputValue()) {
  if (!referenceDate) return getCampaigns(kind);
  return getCampaigns(kind).filter((campaign) => getCampaignDisplayStatus(kind, campaign, referenceDate) === "Activa");
}

function getCampaignEventIds(kind, campaign) {
  if (!campaign) return [];
  if (kind === "daily") {
    return [campaign.eventId || `campaign-${campaign.id}`];
  }
  if (kind === "weekly") {
    return safeArray(campaign.eventIds).length
      ? safeArray(campaign.eventIds)
      : safeArray(campaign.activeDays).map((day) => `${campaign.id}-${normalizeIdPart(day)}`);
  }
  if (kind === "monthly") {
    return safeArray(campaign.eventIds).length ? safeArray(campaign.eventIds) : [`${campaign.id}-general`];
  }
  return [];
}

function getCampaignEventsForAdmin(kind, campaign) {
  const eventIds = getCampaignEventIds(kind, campaign);
  if (!eventIds.length) return [];

  if (kind === "daily") {
    const weeklyEventMap = new Map(safeArray(state.data?.semanal?.events).map((event) => [event.id, event]));
    return eventIds.map((eventId) => {
      const baseEvent = weeklyEventMap.get(eventId)
        || createEmptyEvent(eventId, campaign.eventName || campaign.date || campaign.name || "Diaria", "semanal", campaign.raceCount || 12);
      const eventDate = String(campaign.date || baseEvent.date || "").trim();
      return {
        ...baseEvent,
        date: eventDate,
        operationDate: eventDate,
        campaign,
        campaignId: campaign.id,
        programTrackId: getCampaignProgramTrackId(campaign, eventDate, baseEvent.programTrackId || ""),
        title: campaign.name || baseEvent.title || baseEvent.sheetName,
        viewLabel: campaign.name || baseEvent.title || baseEvent.sheetName,
      };
    });
  }

  if (kind === "weekly") {
    const weeklyEventMap = new Map(getWeeklyEvents().map((event) => [event.id, event]));
    const eventNames = safeArray(campaign.eventNames);
    const eventDates = safeArray(campaign.eventDates);
    return eventIds.map((eventId, index) => {
      const baseEvent = weeklyEventMap.get(eventId) || createEmptyEvent(
        eventId,
        eventNames[index] || `${campaign.name || "Semanal"} ${index + 1}`,
        "semanal",
        campaign.raceCountsByEvent?.[eventId] || campaign.raceCount || 12,
      );
      const eventDate = String(eventDates[index] || baseEvent.date || "").trim();
      return {
        ...baseEvent,
        date: eventDate,
        operationDate: eventDate,
        campaign,
        campaignId: campaign.id,
        programTrackId: getCampaignProgramTrackId(campaign, eventDate, baseEvent.programTrackId || ""),
      };
    });
  }

  const monthlyEventMap = new Map(getMonthlyEvents().map((event) => [event.id, event]));
  const eventNames = safeArray(campaign.eventNames);
  const eventDates = safeArray(campaign.eventDates);
  return eventIds.map((eventId, index) => {
    const baseEvent = monthlyEventMap.get(eventId) || createEmptyEvent(
      eventId,
      eventNames[index] || campaign.name || `Mensual ${index + 1}`,
      "mensual",
      campaign.raceCountsByEvent?.[eventId] || campaign.raceCount || 12,
    );
    const eventDate = String(eventDates[index] || baseEvent.date || "").trim();
    return {
      ...baseEvent,
      date: eventDate,
      operationDate: eventDate,
      campaign,
      campaignId: campaign.id,
      programTrackId: getCampaignProgramTrackId(campaign, eventDate, baseEvent.programTrackId || ""),
    };
  });
}

function getCampaignEligibleParticipants(kind, campaign) {
  const modeKey = kind === "daily" ? "diaria" : kind === "weekly" ? "semanal" : "mensual";
  return safeArray(state.data?.registry)
    .filter((participant) => participant?.[modeKey])
    .filter((participant) => !campaign?.groupId || String(participant.group || "").trim() === String(campaign.groupId || "").trim())
    .map((participant) => String(participant.name || "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "es"));
}

function getCampaignParticipantSummaries(kind, campaign) {
  const entryModes = campaign?.entryModes || {};
  const summaries = new Map();
  getCampaignRegisteredParticipants(kind, campaign).forEach((name) => {
    summaries.set(name, {
      name,
      entryMode: entryModes[name] || "individual",
      daysWithPicks: 0,
      totalPicks: 0,
      totalScore: 0,
    });
  });

  getCampaignEventsForAdmin(kind, campaign).forEach((event) => {
    safeArray(event.participants).forEach((participant) => {
      const name = String(participant.name || "").trim();
      if (!name) return;
      const current = summaries.get(name) || {
        name,
        entryMode: entryModes[name] || "individual",
        daysWithPicks: 0,
        totalPicks: 0,
        totalScore: 0,
      };
      current.daysWithPicks += 1;
      current.totalPicks += safeArray(participant.picks).filter((pick) => String(pick?.horse || "").trim()).length;
      current.totalScore += toNumeric(participant.points) || 0;
      summaries.set(name, current);
    });
  });

  return Array.from(summaries.values()).sort((a, b) => {
    if (b.daysWithPicks !== a.daysWithPicks) return b.daysWithPicks - a.daysWithPicks;
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    return a.name.localeCompare(b.name, "es");
  });
}

function getAutomationSettings() {
  const automation = state.data?.settings?.automation || {};
  return {
    filterDate: automation.filterDate || toLocalDateInputValue(),
    groupId: String(automation.groupId || ""),
    includeDaily: automation.includeDaily !== false,
    includeWeekly: automation.includeWeekly !== false,
    includeMonthly: automation.includeMonthly !== false,
    selectedCaptureKeys: safeArray(automation.selectedCaptureKeys).map((value) => String(value || "")),
  };
}

function getAutomationIncludedKinds(settings = getAutomationSettings()) {
  return [
    settings.includeDaily ? "daily" : null,
    settings.includeWeekly ? "weekly" : null,
    settings.includeMonthly ? "monthly" : null,
  ].filter(Boolean);
}

function campaignMatchesAutomationGroup(campaign, groupId) {
  if (!groupId) return true;
  return String(campaign?.groupId || "").trim() === String(groupId || "").trim();
}

function getAutomationCampaigns(kind, referenceDate, groupId) {
  return getCampaignsForReferenceDate(kind, referenceDate).filter((campaign) => campaignMatchesAutomationGroup(campaign, groupId));
}

function buildAutomationCaptureItems(referenceDate, groupId, includedKinds = getAutomationIncludedKinds()) {
  const items = [];
  includedKinds.forEach((kind) => {
    getAutomationCampaigns(kind, referenceDate, groupId).forEach((campaign) => {
      const events = getCampaignEventsForAdmin(kind, campaign);
      const selectedEvent = safeArray(events).find((event) => String(event?.date || "") === String(referenceDate || ""));
      const campaignLabel = campaign.name || (kind === "daily" ? campaign.date : kind === "weekly" ? "Semanal" : "Mensual");
      const groupLabel = getRegistryGroupLabel(campaign.groupId);
      const kindLabel = kind === "daily" ? "Diaria" : kind === "weekly" ? "Semanal" : "Mensual";
      const themeTone = kind === "daily" ? "warm" : kind === "weekly" ? "cool" : "fresh";
      if (kind !== "daily") {
        items.push({
          key: `${kind}:${campaign.id}:ranking-total`,
          campaignId: campaign.id,
          kind,
          type: "ranking-total",
          label: `Ranking total · ${campaignLabel}`,
          subtitle: `${kindLabel} hasta ${referenceDate} · ${groupLabel}`,
          themeTone,
          recommended: true,
        });
      }
      safeArray(kind === "daily" ? events.filter((event) => String(event?.date || "") === String(referenceDate || "")) : selectedEvent ? [selectedEvent] : []).forEach((event) => {
        const eventLabel = getEventLabelFinal(event);
        items.push({
          key: `${kind}:${campaign.id}:${event.id}:forecast-board`,
          campaignId: campaign.id,
          eventId: event.id,
          kind,
          type: "forecast-board",
          label: `Pronosticos + banner · ${campaignLabel}`,
          subtitle: `${eventLabel} · ${groupLabel}`,
          themeTone,
          recommended: kind === "daily",
        });
        items.push({
          key: `${kind}:${campaign.id}:${event.id}:ranking-day`,
          campaignId: campaign.id,
          eventId: event.id,
          kind,
          type: "ranking-day",
          label: `Ranking jornada · ${campaignLabel}`,
          subtitle: `${eventLabel} · ${groupLabel}`,
          themeTone,
          recommended: true,
        });
        items.push({
          key: `${kind}:${campaign.id}:${event.id}:results-board`,
          campaignId: campaign.id,
          eventId: event.id,
          kind,
          type: "results-board",
          label: `Resultados del dia`,
          subtitle: `${getTrackSummaryForDatesFinal([event?.date].filter(Boolean))} · ${event?.races || 0} carreras · ${event?.date || "-"}`,
          themeTone,
          recommended: true,
        });
      });
    });
  });
  return items;
}

function getAutomationCaptureWidth(item, referenceDate) {
  const { campaign, filteredEvents, selectedEvent } = getAutomationScopedEvents(item, referenceDate);
  const theme = item?.kind || "daily";
  if (item?.type === "forecast-board") {
    const races = Math.max(1, Number(selectedEvent?.races) || 12);
    return Math.min(3800, Math.max(1850, 520 + (races * 148)));
  }
  if (item?.type === "results-board") {
    const { columns } = buildDetailedResultsColumnsAndRows(selectedEvent?.results);
    return Math.min(3200, Math.max(1500, 420 + (safeArray(columns).length * 128)));
  }
  if (item?.type === "ranking-day") {
    const entries = safeArray(selectedEvent?.leaderboard);
    return entries.length > 3 ? 1560 : 1320;
  }
  if (item?.type === "ranking-total") {
    const labels = safeArray(filteredEvents).map((event) => theme === "monthly" ? getEventLabelFinal(event) : event.sheetName);
    return Math.min(2800, Math.max(1480, 520 + (labels.length * 170)));
  }
  return 1080;
}

function renderAutomationCaptureCards(referenceDate, groupId, settings = getAutomationSettings()) {
  const items = buildAutomationCaptureItems(referenceDate, groupId, getAutomationIncludedKinds(settings));
  if (!items.length) {
    return `<section class="panel"><div class="panel-head"><h3>Capturas disponibles</h3><p>La cola se arma segun fecha, grupo y tipos de polla.</p></div><div class="empty">No hay piezas disponibles con este filtro. Revisa la fecha, el grupo o si existen campanas activas.</div></section>`;
  }
  const selected = new Set(settings.selectedCaptureKeys);
  const summary = {
    total: items.length,
    daily: items.filter((item) => item.kind === "daily").length,
    weekly: items.filter((item) => item.kind === "weekly").length,
    monthly: items.filter((item) => item.kind === "monthly").length,
    selected: items.filter((item) => selected.has(item.key)).length,
  };
  const grouped = {
    daily: items.filter((item) => item.kind === "daily"),
    weekly: items.filter((item) => item.kind === "weekly"),
    monthly: items.filter((item) => item.kind === "monthly"),
  };
  const sectionTone = {
    daily: "border-color:#f59e0b33;background:linear-gradient(180deg,#fff8ee,#fffdf9);",
    weekly: "border-color:#3b82f633;background:linear-gradient(180deg,#eff6ff,#f8fbff);",
    monthly: "border-color:#10b98133;background:linear-gradient(180deg,#ecfdf5,#f8fffb);",
  };
  const renderCards = (kind, title, itemsForKind) => {
    if (!itemsForKind.length) return "";
    return `<section class="panel" style="${sectionTone[kind]}"><div class="panel-head"><h3>${title}</h3><p>${itemsForKind.length} piezas listas para marcar y exportar.</p></div><div class="check-grid">${itemsForKind.map((item) => `<label class="check-chip wide" style="${item.themeTone === "warm" ? "border-color:#f59e0b33;background:#fff7ed;" : item.themeTone === "cool" ? "border-color:#3b82f633;background:#eff6ff;" : "border-color:#10b98133;background:#ecfdf5;"}"><input type="checkbox" name="selectedCaptureKeys" value="${item.key}"${selected.has(item.key) ? " checked" : ""} /> <strong>${item.label}</strong><span class="hint">${item.subtitle}${item.recommended ? " · recomendada" : ""}</span></label>`).join("")}</div></section>`;
  };
  return `<section class="panel" style="border:1px solid #dbe4f1;background:linear-gradient(180deg,#ffffff,#f7faff);"><div class="panel-head"><h3>Capturas disponibles</h3><p>Marca las piezas que quieres generar o enviar al grupo. Se filtran por fecha, grupo y tipo de polla.</p></div><div class="result-metrics"><article><span>Total piezas</span><strong>${summary.total}</strong></article><article><span>Seleccionadas</span><strong>${summary.selected}</strong></article><article><span>Diaria</span><strong>${summary.daily}</strong></article><article><span>Semanal</span><strong>${summary.weekly}</strong></article><article><span>Mensual</span><strong>${summary.monthly}</strong></article></div><form id="automationCaptureForm" class="stack"><div class="stack">${renderCards("daily", "Diaria", grouped.daily)}${renderCards("weekly", "Semanal", grouped.weekly)}${renderCards("monthly", "Mensual", grouped.monthly)}</div><div class="actions"><span class="hint">La cola queda lista para capturar vistas completas, con banner, ranking, resultados y grupo visibles para el usuario final.</span><button class="primary-button" type="submit">Guardar seleccion de capturas</button><button type="button" class="ghost-button" id="automationSelectRecommended">Marcar recomendadas</button><button type="button" class="ghost-button" id="automationSelectAll">Marcar todas</button><button type="button" class="ghost-button" id="automationClearAll">Limpiar seleccion</button></div></form></section>`;
}

function renderAutomationPreviewPanel(referenceDate, groupId, selectedKeys = [], settings = getAutomationSettings()) {
  const items = buildAutomationCaptureItems(referenceDate, groupId, getAutomationIncludedKinds(settings));
  const selectedSet = new Set(safeArray(selectedKeys).map((value) => String(value || "")));
  const selectedItems = items.filter((item) => selectedSet.has(item.key));
  if (!selectedItems.length) {
    return `<section class="panel"><div class="panel-head"><h3>Vista previa</h3><p>Aqui veras las piezas antes de exportarlas.</p></div><div class="empty">Marca una o mas imagenes para ver su vista previa.</div></section>`;
  }
  return `<section class="panel"><div class="panel-head"><h3>Vista previa</h3><p>Estas ya son las piezas reales que vamos a exportar en PNG.</p></div><div class="actions" style="margin:0 0 16px"><span class="hint">Puedes compartir la seleccion completa como una sola imagen larga o copiarla como PNG al portapapeles.</span><button type="button" class="ghost-button" id="automationShareSelected">Compartir</button><button type="button" class="ghost-button" id="automationCopySelected">Copiar imagen</button></div><div class="stack">${selectedItems.map((item) => { const previewWidth = getAutomationCaptureWidth(item, referenceDate); return `<article class="panel" style="padding:16px; border:1px solid #dbe4f1"><div class="panel-head"><div><h4 style="margin:0">${item.label}</h4><p>${item.subtitle}</p></div><div class="actions"><button type="button" class="ghost-button" data-share-capture="${item.key}">Compartir</button><button type="button" class="ghost-button" data-copy-capture="${item.key}">Copiar</button></div></div><div style="overflow:auto; border:1px dashed #d9e3f0; border-radius:18px; padding:16px; background:linear-gradient(180deg,#f8fbff,#eef4fb)"><div style="width:${previewWidth}px; margin:0 auto" data-capture-preview="${item.key}">${renderAutomationCapturePiece(item, referenceDate)}</div></div></article>`; }).join("")}</div></section>`;
}

function buildAutomationShareText(items = []) {
  if (!items.length) return "No hay capturas seleccionadas.";
  return items.map((item, index) => `${index + 1}. ${item.label}\n${item.subtitle}`).join("\n\n");
}

function getAutomationCampaignByItem(item) {
  return getEnabledCampaigns(item?.kind || "").find((campaign) => campaign.id === item?.campaignId) || null;
}

function getAutomationScopedEvents(item, referenceDate) {
  const campaign = getAutomationCampaignByItem(item);
  const events = safeArray(getCampaignEventsForAdmin(item?.kind || "", campaign))
    .slice()
    .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")) || String(a.sheetName || "").localeCompare(String(b.sheetName || ""), "es"));
  const selectedEvent = events.find((event) => event.id === item?.eventId) || null;
  const filteredEvents = events.filter((event) => !referenceDate || String(event.date || "") <= String(referenceDate));
  return {
    campaign,
    events,
    filteredEvents: filteredEvents.length ? filteredEvents : events,
    selectedEvent: selectedEvent || filteredEvents[filteredEvents.length - 1] || events[0] || null,
  };
}

function renderAutomationCapturePiece(item, referenceDate) {
  const theme = item?.kind || "daily";
  const { campaign, filteredEvents, selectedEvent } = getAutomationScopedEvents(item, referenceDate);
  const scoringMode = selectedEvent?.scoring?.mode || campaign?.scoring?.mode || (theme === "weekly" ? "points" : "dividend");
  if (item?.type === "ranking-total") {
    const labels = safeArray(filteredEvents).map((event) => theme === "monthly" ? getEventLabelFinal(event) : event.sheetName);
    const rows = buildAccumulatedRowsFinal(filteredEvents, labels);
    const statusMap = theme === "weekly" ? buildWeeklyStatusMapFinal(campaign, rows, labels) : new Map();
    const context = buildCampaignContextMetaFinal(theme, campaign, filteredEvents[0], scoringMode);
    return `${renderOfficialBanner(
      theme === "monthly" ? "Mensual" : "Semanal",
      item.label,
      `Acumulado hasta ${referenceDate}. Pieza lista para compartir al grupo.`,
      [`Corte: ${referenceDate}`, getScoringLabel(scoringMode), `${safeArray(filteredEvents).length} jornadas`],
      theme,
      context.meta,
    )}${renderAutomationAccumulatedBoard(item.label, `Tabla total acumulada hasta ${referenceDate}.`, rows, labels, scoringMode, statusMap, theme)}`;
  }
  if (!selectedEvent) {
    return `<section class="panel"><div class="empty">No hay jornada disponible para esta captura.</div></section>`;
  }
  const eventTitle = theme === "daily"
    ? (selectedEvent.viewLabel || getEventViewLabel(selectedEvent))
    : theme === "monthly"
      ? `${campaign?.name || item.label} · ${selectedEvent.date || getEventLabelFinal(selectedEvent)}`
      : `${campaign?.name || item.label} · ${selectedEvent.sheetName}`;
  const context = buildCampaignContextMetaFinal(theme, campaign, selectedEvent, scoringMode);
  if (item?.type === "forecast-board") {
    const programTrackId = getCampaignProgramTrackId(campaign, selectedEvent.date, selectedEvent.trackId || selectedEvent.programTrackId || "");
    const resolvedProgram = getProgramForEventFinal(
      {
        ...selectedEvent,
        campaign,
        programTrackId,
      },
      programTrackId,
    );
    return `${renderOfficialBanner(
        theme === "daily" ? "Diaria" : theme === "weekly" ? "Semanal" : "Mensual",
        eventTitle,
        "Pronosticos completos con banner incluido para compartir tal cual al grupo.",
        [selectedEvent.date || getEventLabelFinal(selectedEvent), getScoringLabel(scoringMode), `${selectedEvent.races} carreras`],
        theme,
        context.meta,
      )}${renderAutomationForecastBoard(
        "Pronosticos registrados",
        "Tabla completa con ejemplares, stud y total.",
        selectedEvent,
        scoringMode,
        theme,
        {
          campaign,
          programTrackId,
          program: resolvedProgram,
        },
      )}`;
  }
  if (item?.type === "ranking-day") {
      return `${renderCompactContextHeaderFinal(
        eventTitle,
        `Ranking de la jornada ${selectedEvent.date || getEventLabelFinal(selectedEvent)} listo para compartir.`,
        theme,
        [selectedEvent.date || getEventLabelFinal(selectedEvent), getScoringLabel(scoringMode), `${selectedEvent.races} carreras`],
        context.meta,
      )}${renderAutomationLeaderboardBoard(
        item.label,
        "Ordenado del puntaje mas alto al mas bajo.",
        selectedEvent.leaderboard,
        scoringMode,
        theme,
      )}`;
  }
  if (item?.type === "results-board") {
      const trackLabel = getTrackSummaryForDatesFinal([selectedEvent?.date].filter(Boolean));
      return `${renderAutomationResultsBoard(
        "Resultados del dia",
        `${trackLabel} · ${selectedEvent.races} carreras · ${selectedEvent.date || getEventLabelFinal(selectedEvent)}`,
        selectedEvent,
        theme,
      )}`;
  }
  return `<section class="panel"><div class="empty">Tipo de captura no soportado.</div></section>`;
}

function renderAutomationAccumulatedBoard(title, subtitle, rows, labels, scoringMode, statusMap = new Map(), theme = "weekly") {
  const palette = getViewAccentPalette(theme);
  if (!rows.length) {
    return `<section style="margin-top:18px; border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt}); border-radius:28px; padding:18px 22px; box-shadow:0 20px 60px rgba(27,43,77,0.12)"><div style="display:grid; gap:6px; margin-bottom:12px"><h3 style="margin:0; color:${palette.accentText}">${title}</h3><p style="margin:0; color:#5f7394">${subtitle}</p></div><div style="padding:24px; border-radius:20px; background:rgba(255,255,255,0.82); color:#5f7394">Todavia no hay posiciones para mostrar.</div></section>`;
  }
  const leaderScore = toNumeric(rows[0]?.totalPoints) || 0;
  return `<section style="margin-top:18px; border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt}); border-radius:28px; padding:18px 22px; box-shadow:0 20px 60px rgba(27,43,77,0.12)"><div style="display:grid; gap:6px; margin-bottom:12px"><h3 style="margin:0; color:${palette.accentText}">${title}</h3><p style="margin:0; color:#5f7394">${subtitle}</p></div><div style="overflow:hidden; border-radius:22px; background:rgba(255,255,255,0.82); border:1px solid rgba(26,42,78,0.08)"><table style="width:100%; border-collapse:collapse; font-family:Manrope, sans-serif"><tbody><tr>${[`#`, `Stud`, ...labels, `Total`, `Dif.`, ...(statusMap.size ? [`Estado`] : [])].map((label) => `<td style="padding:12px 14px; text-align:left; background:${palette.accentSoft}; color:${palette.accentText}; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; border-bottom:1px solid rgba(26,45,88,0.08)">${label}</td>`).join("")}</tr>${rows.map((row, index) => {
    const gap = Math.max(0, leaderScore - (toNumeric(row.totalPoints) || 0));
    const status = statusMap.get(row.name);
    const rowBackground = index === 0 ? palette.accentSoft2 : index % 2 === 0 ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.94)";
    const statusHtml = status
      ? `<span style="display:inline-flex; align-items:center; padding:6px 12px; border-radius:999px; font-size:12px; font-weight:700; background:${status.tone === "pass" ? "rgba(29,174,96,0.12)" : "rgba(230,87,64,0.12)"}; color:${status.tone === "pass" ? "#1d7f4c" : "#b24a35"}">${status.label}</span>`
      : "-";
    return `<tr style="background:${rowBackground}"><td style="padding:12px 14px; border-bottom:1px solid rgba(26,45,88,0.08); color:${palette.accentText}; font-weight:800">${index + 1}</td><td style="padding:12px 14px; border-bottom:1px solid rgba(26,45,88,0.08); font-weight:800">${row.name}</td>${labels.map((label) => `<td style="padding:12px 14px; border-bottom:1px solid rgba(26,45,88,0.08)">${formatScoreValue(row.breakdown[label] || 0, scoringMode)}</td>`).join("")}<td style="padding:12px 14px; border-bottom:1px solid rgba(26,45,88,0.08); color:${palette.accentText}; font-weight:800">${formatScoreValue(row.totalPoints, scoringMode)}</td><td style="padding:12px 14px; border-bottom:1px solid rgba(26,45,88,0.08)">${index === 0 ? "Lider" : formatScoreValue(gap, scoringMode)}</td>${statusMap.size ? `<td style="padding:12px 14px; border-bottom:1px solid rgba(26,45,88,0.08)">${statusHtml}</td>` : ""}</tr>`;
  }).join("")}</tbody></table></div></section>`;
}

function renderAutomationLeaderboardBoard(title, subtitle, entries, scoringMode, theme = "daily") {
  const palette = getViewAccentPalette(theme);
  const rows = sortRankingEntriesFinal(entries);
  if (!rows.length) {
    return `<section style="margin-top:18px; border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt}); border-radius:28px; padding:18px 22px; box-shadow:0 20px 60px rgba(27,43,77,0.12)"><div style="display:grid; gap:6px; margin-bottom:12px"><h3 style="margin:0; color:${palette.accentText}">${title}</h3><p style="margin:0; color:#5f7394">${subtitle}</p></div><div style="padding:24px; border-radius:20px; background:rgba(255,255,255,0.82); color:#5f7394">Todavia no hay posiciones para mostrar.</div></section>`;
  }
  const leaderScore = toNumeric(rows[0]?.points ?? rows[0]?.totalPoints) || 0;
  const getGapCopy = (entry, index) => {
    const currentScore = toNumeric(entry?.points ?? entry?.totalPoints) || 0;
    const gap = Math.max(0, leaderScore - currentScore);
    if (index === 0) return "Lider actual";
    return `Dif. ${formatScoreValue(gap, scoringMode)}`;
  };
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  return `<section style="margin-top:18px; border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt}); border-radius:28px; padding:18px 22px; box-shadow:0 20px 60px rgba(27,43,77,0.12)"><div style="display:grid; gap:6px; margin-bottom:12px"><h3 style="margin:0; color:${palette.accentText}">${title}</h3><p style="margin:0; color:#5f7394">${subtitle}</p></div><div style="display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:16px; margin-bottom:16px">${podium.map((entry, index) => `<article style="border:1px solid ${palette.border}; background:${index === 0 ? palette.accentSoft2 : palette.accentSoft}; box-shadow:inset 0 0 0 1px rgba(255,255,255,0.28); border-radius:24px; padding:20px; min-height:188px; display:grid; align-content:space-between"><span style="display:inline-flex; width:42px; height:42px; border-radius:999px; align-items:center; justify-content:center; background:${palette.accent}; color:#fff; font-weight:900; font-size:18px">${index + 1}</span><strong style="font-size:32px; line-height:1.05; color:${palette.accentText}">${entry.name}</strong><div style="display:grid; gap:8px"><span style="font-size:34px; font-weight:900; color:${palette.accentText}">${formatScoreValue(entry.points ?? entry.totalPoints, scoringMode)}</span><p style="margin:0; color:#49627f; font-weight:700">${index === 0 ? "Lider actual" : getGapCopy(entry, index)}</p></div></article>`).join("")}</div>${rest.length ? `<div style="display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px">${rest.map((entry, index) => `<div style="display:grid; grid-template-columns:64px 1fr auto; gap:12px; align-items:center; padding:16px 18px; border-radius:20px; border:1px solid ${palette.border}; background:${index % 2 === 0 ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.85)"}"><span style="display:inline-flex; align-items:center; justify-content:center; width:48px; height:48px; border-radius:16px; background:${palette.accentSoft}; color:${palette.accentText}; border:1px solid ${palette.border}; font-size:18px; font-weight:900">${index + 4}</span><div style="display:grid; gap:4px"><strong style="font-size:22px; color:#18233c">${entry.name}</strong><small style="font-size:14px; color:#5f7394">${getGapCopy(entry, index + 3)}</small></div><div style="display:grid; gap:4px; text-align:right"><strong style="font-size:24px; color:${palette.accentText}">${formatScoreValue(entry.points ?? entry.totalPoints, scoringMode)}</strong></div></div>`).join("")}</div>` : ""}</section>`;
}

function buildDetailedResultsColumnsAndRows(results = []) {
  const sortedResults = safeArray(results).slice().sort((a, b) => Number(a.race) - Number(b.race));
  const showTieFirst = sortedResults.some((item) => item.empatePrimero || item.empatePrimeroGanador || item.empatePrimeroDivSegundo || item.empatePrimeroDivTercero);
  const showTieSecond = sortedResults.some((item) => item.empateSegundo || item.empateSegundoDivSegundo || item.empateSegundoDivTercero);
  const showTieThird = sortedResults.some((item) => item.empateTercero || item.empateTerceroDivTercero);
  const columns = [
    "C",
    "1°",
    "Div Gan",
    "Div 2°",
    "Div 3°",
    "2°",
    "Div 2°",
    "Div 3°",
    "3°",
    "Div 3°",
  ];
  if (showTieFirst) {
    columns.push("Emp 1°", "Emp 1° Gan", "Emp 1° Div 2°", "Emp 1° Div 3°");
  }
  if (showTieSecond) {
    columns.push("Emp 2°", "Emp 2° Div 2°", "Emp 2° Div 3°");
  }
  if (showTieThird) {
    columns.push("Emp 3°", "Emp 3° Div 3°");
  }
  columns.push("Fav", "Retiros");
  const rows = sortedResults.map((item) => {
    const row = [
      item.race,
      item.primero || "-",
      item.ganador || "-",
      item.divSegundoPrimero ?? item.divSegundo ?? "-",
      item.divTerceroPrimero ?? item.divTercero ?? "-",
      item.segundo || "-",
      item.divSegundo || "-",
      item.divTerceroSegundo ?? item.divTercero ?? "-",
      item.tercero || "-",
      item.divTercero || "-",
    ];
    if (showTieFirst) {
      row.push(
        item.empatePrimero || "-",
        item.empatePrimeroGanador ?? "-",
        item.empatePrimeroDivSegundo ?? "-",
        item.empatePrimeroDivTercero ?? "-",
      );
    }
    if (showTieSecond) {
      row.push(
        item.empateSegundo || "-",
        item.empateSegundoDivSegundo ?? "-",
        item.empateSegundoDivTercero ?? "-",
      );
    }
    if (showTieThird) {
      row.push(
        item.empateTercero || "-",
        item.empateTerceroDivTercero ?? "-",
      );
    }
    row.push(
      item.favorito || "-",
      safeArray(item.retiros).join(", ") || [item.retiro1, item.retiro2].filter(Boolean).join(", ") || "-",
    );
    return row;
  });
  return { columns, rows };
}

function renderAutomationResultsBoard(title, subtitle, event, theme = "daily") {
  const palette = getViewAccentPalette(theme);
  const { columns, rows } = buildDetailedResultsColumnsAndRows(event?.results);
  if (!rows.length) {
    return `<section style="margin-top:18px; border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt}); border-radius:28px; padding:18px 22px; box-shadow:0 20px 60px rgba(27,43,77,0.12)"><div style="display:grid; gap:6px; margin-bottom:12px"><h3 style="margin:0; color:${palette.accentText}">${title}</h3><p style="margin:0; color:#5f7394">${subtitle}</p></div><div style="padding:24px; border-radius:20px; background:rgba(255,255,255,0.82); color:#5f7394">Todavia no hay resultados cargados.</div></section>`;
  }
  return `<section style="margin-top:18px; border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt}); border-radius:28px; padding:18px 22px; box-shadow:0 20px 60px rgba(27,43,77,0.12)"><div style="display:grid; gap:6px; margin-bottom:12px"><h3 style="margin:0; color:${palette.accentText}">${title}</h3><p style="margin:0; color:#5f7394">${subtitle}</p></div><div class="table-wrap" style="border-radius:22px; overflow:hidden; border:1px solid rgba(26,42,78,0.08); background:rgba(255,255,255,0.82)"><table style="width:100%; border-collapse:collapse; font-family:Manrope, sans-serif"><thead><tr>${columns.map((label) => `<th style="padding:12px 14px; text-align:left; background:${palette.accentSoft}; color:${palette.accentText}; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; border-bottom:1px solid rgba(26,45,88,0.08)">${label}</th>`).join("")}</tr></thead><tbody>${rows.map((row, index) => `<tr style="background:${index % 2 === 0 ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.94)"}">${row.map((cell, cellIndex) => `<td style="padding:12px 14px; border-bottom:1px solid rgba(26,45,88,0.08);${cellIndex === 0 ? ` font-weight:800; color:${palette.accentText};` : ""}">${cell ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div></section>`;
}

function renderAutomationForecastBoard(title, subtitle, event, scoringMode, theme = "daily", options = {}) {
  const palette = getViewAccentPalette(theme);
  const rows = safeArray(event?.participants);
  const maxScore = getMaxPickScore(event);
  const program =
    options.program
    || getProgramForEventFinal({ ...event, campaign: options.campaign }, options.programTrackId || "")
    || (event?.date ? getProgramForDateTrack(event.date, getResolvedProgramTrackId(event.date, options.programTrackId || event?.programTrackId || event?.trackId || "")) : null);
  if (!rows.length) {
    return `<section style="margin-top:18px; border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt}); border-radius:28px; padding:18px 22px; box-shadow:0 20px 60px rgba(27,43,77,0.12)"><div style="display:grid; gap:6px; margin-bottom:12px"><h3 style="margin:0; color:${palette.accentText}">${title}</h3><p style="margin:0; color:#5f7394">${subtitle}</p></div><div style="padding:24px; border-radius:20px; background:rgba(255,255,255,0.82); color:#5f7394">Todavia no hay pronosticos registrados.</div></section>`;
  }
  const pickTone = (score) => {
    if (!maxScore) return { bg: "rgba(240,244,249,0.96)", fg: "#5a6a80", border: palette.border };
    const ratio = score / maxScore;
    if (ratio >= 0.72) return { bg: palette.accentSoft2, fg: palette.accentText, border: palette.border };
    if (ratio >= 0.38) return { bg: palette.accentSoft, fg: palette.accentText, border: palette.border };
    return { bg: "rgba(240,244,249,0.96)", fg: "#5a6a80", border: "rgba(154,168,190,0.22)" };
  };
  const renderPickCell = (pick, raceNumber) => {
    const score = toNumeric(pick?.score) || 0;
    const tone = pickTone(score);
    const horse = String(pick?.horse || "-").trim() || "-";
    const runnerName = program ? getRunnerNameFromProgram(program, raceNumber, horse) : "";
    const runnerCopy = runnerName || (program ? "Sin nombre para ese numero" : "Programa no cargado");
    return `<article style="min-height:144px; padding:14px; border:1px solid ${tone.border}; background:${tone.bg}; color:${tone.fg}; display:grid; align-content:start; gap:8px; border-radius:18px; box-shadow:inset 0 1px 0 rgba(255,255,255,0.5)">
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px">
        <span style="display:inline-flex; align-items:center; justify-content:center; min-width:44px; height:44px; padding:0 12px; border-radius:14px; background:rgba(255,255,255,0.55); color:${tone.fg}; font-size:20px; font-weight:900">${horse}</span>
        <span style="font-size:12px; font-weight:800; color:${palette.accentText}; letter-spacing:.08em">C${raceNumber}</span>
      </div>
      <strong style="font-size:15px; line-height:1.28; min-height:40px; color:${palette.accentText}">${runnerCopy}</strong>
      <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; margin-top:auto">
        <span style="font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; opacity:.72">Puntaje</span>
        <strong style="font-weight:900; font-size:16px; opacity:0.98">${formatScoreValue(score, scoringMode)}</strong>
      </div>
    </article>`;
  };
  return `<section style="margin-top:18px; border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt}); border-radius:28px; padding:18px 22px; box-shadow:0 20px 60px rgba(27,43,77,0.12)">
    <div style="display:grid; gap:6px; margin-bottom:12px"><h3 style="margin:0; color:${palette.accentText}">${title}</h3><p style="margin:0; color:#5f7394">${subtitle}</p></div>
    <div style="display:grid; gap:8px; margin-bottom:16px; color:#5f7394; font-size:13px"><div style="display:flex; gap:14px; flex-wrap:wrap"><span style="display:inline-flex; align-items:center; gap:8px"><span style="width:12px; height:12px; border-radius:999px; background:${palette.accent}"></span>Golpe fuerte</span><span style="display:inline-flex; align-items:center; gap:8px"><span style="width:12px; height:12px; border-radius:999px; background:${palette.accentSoft2}"></span>Suma alta</span><span style="display:inline-flex; align-items:center; gap:8px"><span style="width:12px; height:12px; border-radius:999px; background:${palette.accentSoft}"></span>Suma media</span><span style="display:inline-flex; align-items:center; gap:8px"><span style="width:12px; height:12px; border-radius:999px; background:rgba(240,244,249,0.96)"></span>Suma baja</span></div></div>
    <div style="display:grid; gap:18px">
      ${rows.map((participant, rowIndex) => `<section style="border:1px solid rgba(26,42,78,0.08); border-radius:24px; background:${rowIndex % 2 === 0 ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.92)"}; overflow:hidden">
        <div style="display:grid; grid-template-columns:88px minmax(240px, 1.2fr) 120px; gap:0; align-items:stretch; border-bottom:1px solid rgba(26,45,88,0.08)">
          <div style="padding:16px 14px; text-align:center; background:${palette.accentSoft}"><span style="display:block; font-size:12px; text-transform:uppercase; letter-spacing:.08em; font-weight:800; color:${palette.accentText}; opacity:.8">N</span><strong style="display:block; font-size:28px; color:${palette.accentText}">${participant.index}</strong></div>
          <div style="padding:16px 18px"><span style="display:block; font-size:12px; text-transform:uppercase; letter-spacing:.08em; font-weight:800; color:${palette.accentText}; opacity:.8">Stud</span><strong style="display:block; font-size:28px; line-height:1.1; color:#18233c">${participant.name}</strong></div>
          <div style="padding:16px 18px; text-align:center; background:${palette.accentSoft}"><span style="display:block; font-size:12px; text-transform:uppercase; letter-spacing:.08em; font-weight:800; color:${palette.accentText}; opacity:.8">Total</span><strong style="display:block; font-size:28px; color:${palette.accentText}">${formatScoreValue(participant.points, scoringMode)}</strong></div>
        </div>
        <div style="display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:14px; padding:16px">
          ${safeArray(participant.picks).map((pick, index) => renderPickCell(pick, index + 1)).join("")}
        </div>
      </section>`).join("")}
    </div>
  </section>`;
}

function getCampaignRegisteredParticipants(kind, campaign) {
  const eventNames = new Set();
  safeArray(campaign?.registeredParticipants).forEach((name) => {
    const normalized = String(name || "").trim();
    if (normalized) eventNames.add(normalized);
  });
  getCampaignEventsForAdmin(kind, campaign).forEach((event) => {
    safeArray(event.participants).forEach((participant) => {
      const name = String(participant.name || "").trim();
      if (name) eventNames.add(name);
    });
  });
  Object.keys(campaign?.entryModes || {}).forEach((name) => {
    const normalized = String(name || "").trim();
    if (normalized) eventNames.add(normalized);
  });
  return Array.from(eventNames).sort((a, b) => a.localeCompare(b, "es"));
}

function buildCampaignPrizeSummary(kind, campaign, prizeSettings) {
  const payout = {
    ...(prizeSettings?.payout || {}),
    ...((campaign && campaign.payout) || {}),
  };
  const registeredParticipants = getCampaignRegisteredParticipants(kind, campaign);
  const entryModes = campaign?.entryModes || {};
  const isDaily = kind === "daily";
  const basePrizeConfig = isDaily ? (prizeSettings?.daily || {}) : kind === "weekly" ? (prizeSettings?.weekly || {}) : (prizeSettings?.monthly || {});
  const defaultEntryValue = Number(campaign?.entryValue) || Number(basePrizeConfig?.entryPrice) || Number(basePrizeConfig?.singlePrice) || 0;
  const promoEnabled = campaign?.promoEnabled === true || (isDaily && basePrizeConfig?.promoEnabled && campaign?.promoEnabled !== false);
  const promoQuantity = Math.max(1, Number(campaign?.promoQuantity) || Number(basePrizeConfig?.promoQuantity) || 2);
  const promoPrice = Number(campaign?.promoPrice) || Number(basePrizeConfig?.promoPrice) || 0;
  const promoUnitPrice = promoEnabled ? promoPrice / promoQuantity : defaultEntryValue;

  const individualCount = registeredParticipants.filter((name) => (entryModes[name] || "individual") !== "promo").length;
  const promoCount = registeredParticipants.filter((name) => (entryModes[name] || "individual") === "promo").length;
  const grossPot = (individualCount * defaultEntryValue) + (promoCount * promoUnitPrice);
  const adminPct = Number(payout.adminPct) || 0;
  const adminAmount = grossPot * (adminPct / 100);
  const prizePool = Math.max(0, grossPot - adminAmount);
  const firstPct = Number(payout.firstPct) || 0;
  const secondPct = Number(payout.secondPct) || 0;
  const thirdPct = Number(payout.thirdPct) || 0;

  return {
    participants: registeredParticipants.length,
    individualCount,
    promoCount,
    promoEnabled,
    individualValue: defaultEntryValue,
    promoValue: promoPrice,
    promoQuantity,
    grossPot,
    adminPct,
    adminAmount,
    prizePool,
    firstPct,
    secondPct,
    thirdPct,
    firstPrize: prizePool * (firstPct / 100),
    secondPrize: prizePool * (secondPct / 100),
    thirdPrize: prizePool * (thirdPct / 100),
  };
}

function getPrizeKindLabel(kind) {
  return kind === "daily" ? "Diarias" : kind === "weekly" ? "Semanales" : "Mensuales";
}

function getPrizeCampaignsForFilter(kind, referenceDate = toLocalDateInputValue(), showInactive = false) {
  const campaigns = getCampaigns(kind);
  if (showInactive) return campaigns;
  return campaigns.filter((campaign) => getCampaignDisplayStatus(kind, campaign, referenceDate) === "Activa");
}

function renderPrizeCampaignCard(kind, campaign, prizeSettings, referenceDate) {
  const summary = buildCampaignPrizeSummary(kind, campaign, prizeSettings);
  const status = getCampaignDisplayStatus(kind, campaign, referenceDate);
  const kindLabel = getPrizeKindLabel(kind);
  const modeLabel = getCompetitionModeOptions().find(([value]) => value === String(campaign.competitionMode || campaign.format || ""))?.[1] || "Individual";
  const groupLabel = getRegistryGroupLabel(campaign.groupId);
  const periodLabel = kind === "daily"
    ? `${campaign.date || "-"}`
    : kind === "weekly"
      ? `${campaign.startDate || "-"} a ${campaign.endDate || "-"}`
      : `${campaign.startDate || "-"} a ${campaign.endDate || "-"}`;
  const participationLabel = `${summary.participants} studs · ${summary.individualCount} individuales${summary.promoEnabled ? ` · ${summary.promoCount} promo${summary.promoCount === 1 ? "" : "s"}` : ""}`;
  const promoLabel = summary.promoEnabled
    ? `Promo ${formatCurrencyNumber(summary.promoValue)}${summary.promoQuantity ? ` / ${summary.promoQuantity}` : ""}`
    : "Promo desactivada";
  return `<article class="mini-card campaign-card prize-card">
    <div class="toolbar-group"><span class="label">${status}</span><span class="label">${kindLabel}</span></div>
    <strong>${campaign.name || "Sin nombre"}</strong>
    <p class="hint">${periodLabel} · ${groupLabel} · ${modeLabel}${campaign.entryValue ? ` · valor ${formatCurrencyNumber(campaign.entryValue)}` : ""}${campaign.scoring?.doubleLastRace ? " · ultima x2" : ""}</p>
    <div class="result-metrics">
      <article><span>Participacion</span><strong>${summary.participants}</strong><p>${participationLabel}</p></article>
      <article><span>Pozo bruto</span><strong>${formatCurrencyNumber(summary.grossPot)}</strong><p>Recaudado segun inscritos reales. ${promoLabel}</p></article>
      <article><span>Administracion</span><strong>${summary.adminPct}%</strong><p>${formatCurrencyNumber(summary.adminAmount)}</p></article>
      <article><span>Pozo premios</span><strong>${formatCurrencyNumber(summary.prizePool)}</strong><p>Pozo bruto menos administracion.</p></article>
    </div>
    <form class="editor-form" data-campaign-prize-form="${kind}" data-campaign-id="${campaign.id}">
      <div class="panel-head"><h4>Reparto de esta campana</h4><p>Aqui defines cuanto se descuenta para administracion y como se reparte el pozo neto entre 1°, 2° y 3° lugar.</p></div>
      <div class="form-grid">
        <div class="field"><label>Administracion (%)</label><input name="adminPct" type="number" min="0" max="100" step="1" value="${summary.adminPct}" /></div>
        <div class="field"><label>1er lugar (%)</label><input name="firstPct" type="number" min="0" max="100" step="1" value="${summary.firstPct}" /></div>
      </div>
      <div class="form-grid">
        <div class="field"><label>2do lugar (%)</label><input name="secondPct" type="number" min="0" max="100" step="1" value="${summary.secondPct}" /></div>
        <div class="field"><label>3er lugar (%)</label><input name="thirdPct" type="number" min="0" max="100" step="1" value="${summary.thirdPct}" /></div>
      </div>
      <div class="result-metrics">
        <article><span>1er lugar (${summary.firstPct}%)</span><strong>${formatCurrencyNumber(summary.firstPrize)}</strong></article>
        <article><span>2do lugar (${summary.secondPct}%)</span><strong>${formatCurrencyNumber(summary.secondPrize)}</strong></article>
        <article><span>3er lugar (${summary.thirdPct}%)</span><strong>${formatCurrencyNumber(summary.thirdPrize)}</strong></article>
        <article><span>Referencia</span><strong>${groupLabel}</strong><p>Grupo asociado de la campana.</p></article>
      </div>
      <div class="actions">
        <span class="hint">Si el total de premios da menos de 100%, el resto del pozo neto queda sin repartir.</span>
        <button class="primary-button" type="submit">Guardar reparto</button>
      </div>
    </form>
  </article>`;
}

function renderPrizeCampaignSection(kind, referenceDate, showInactive, prizeSettings) {
  const allCampaigns = getCampaigns(kind);
  const activeCampaigns = allCampaigns.filter((campaign) => getCampaignDisplayStatus(kind, campaign, referenceDate) === "Activa");
  const visibleCampaigns = getPrizeCampaignsForFilter(kind, referenceDate, showInactive);
  const title = getPrizeKindLabel(kind);
  const emptyCopy = showInactive
    ? `No hay campanas ${title.toLowerCase()} para mostrar con el filtro actual.`
    : `No hay campanas ${title.toLowerCase()} activas para la fecha seleccionada.`;
  return `<section class="panel"><div class="panel-head"><div><h3>Campanas ${title.toLowerCase()}</h3><p>Revisa el pozo, la participacion y el reparto por posicion.</p></div><div class="toolbar-group"><span class="label">${activeCampaigns.length} activas</span><span class="label">${allCampaigns.length} total</span></div></div>${visibleCampaigns.length ? `<div class="cards">${visibleCampaigns.map((campaign) => renderPrizeCampaignCard(kind, campaign, prizeSettings, referenceDate)).join("")}</div>` : `<div class="empty-state">${emptyCopy}</div>`}</section>`;
}

function renderCampaignDetailPanel(kind, campaign) {
  const eventSummaries = getCampaignEventsForAdmin(kind, campaign);
  const participants = getCampaignParticipantSummaries(kind, campaign);
  const scoringMode = campaign?.scoring?.mode || "dividend";
  const totalPicks = participants.reduce((sum, participant) => sum + participant.totalPicks, 0);
  const totalLoaded = participants.filter((participant) => participant.daysWithPicks > 0).length;
  const rows = participants.map((participant) => {
    const allowPromo = campaign?.promoEnabled === true || (kind === "daily" && campaign?.promoEnabled !== false);
    return [
    participant.name,
    `<select name="entryMode::${participant.name}"><option value="individual"${participant.entryMode === "individual" ? " selected" : ""}>Individual</option>${allowPromo ? `<option value="promo"${participant.entryMode === "promo" ? " selected" : ""}>Promo</option>` : ""}</select>`,
    participant.daysWithPicks || 0,
    participant.totalPicks || 0,
    formatScoreValue(participant.totalScore, scoringMode),
  ];
  });

  return `<section class="panel"><div class="panel-head"><h3>Detalle operativo · ${campaign.name || "Campana"}</h3><p>Aqui revisas inscritos reales, pronosticos cargados y quien corre como promo o individual.</p></div><div class="result-metrics"><article><span>Jornadas</span><strong>${eventSummaries.length}</strong></article><article><span>Participantes</span><strong>${participants.length}</strong></article><article><span>Con pronostico</span><strong>${totalLoaded}</strong></article><article><span>Picks cargados</span><strong>${totalPicks}</strong></article></div><form class="editor-form" data-campaign-entry-form="${kind}" data-campaign-id="${campaign.id}"><div class="panel-head"><h4>Cobro por participante</h4><p>Define rapidamente quien va individual y quien entra con promo dentro de esta campana.</p></div>${setTable(["Participante", "Cobro", "Jornadas", "Picks", "Total"], rows)}<div class="actions"><span class="hint">Si no cambias nada, todos quedan como individual. Esto sirve para dejar trazado el tipo de entrada por stud.</span><button class="primary-button" type="submit">Guardar promo / individual</button></div></form><div class="stack">${eventSummaries.map((event) => renderPicksTable(event, `Pronosticos · ${getEventLabelFinal(event)}`, "Asi va quedando cada jornada de esta campana.")).join("") || '<div class="empty">Todavia no hay jornadas con pronosticos cargados.</div>'}</div></section>`;
}

function renderCampaignAdminList(kind, campaigns) {
  if (!campaigns.length) {
    return `<div class="empty-state">No hay campanas activas para la fecha de hoy.</div>`;
  }
  return `<div class="cards">${campaigns.map((campaign) => {
    const status = getCampaignDisplayStatus(kind, campaign);
    const perEventSummary = Object.entries(campaign.raceCountsByEvent || {})
      .map(([id, count], index) => `${safeArray(campaign.eventNames)[index] || id}: ${count}`)
      .join(" Â· ");
    const modeLabel = getCompetitionModeOptions().find(([value]) => value === String(campaign.competitionMode || campaign.format || ""))?.[1] || "Individual";
    const groupLabel = getRegistryGroupLabel(campaign.groupId);
    const valueLabel = Number(campaign.entryValue) > 0 ? ` Â· valor ${formatCurrencyNumber(campaign.entryValue)}` : "";
    const expanded = state.campaignDetail?.kind === kind && state.campaignDetail?.id === campaign.id;
    const detail = kind === "daily"
      ? `${campaign.date || "-"} Â· ${campaign.raceCount || 12} carreras Â· ${groupLabel} Â· ${modeLabel}${valueLabel}${campaign.promoEnabled !== false ? " Â· promo 2x" : ""}${campaign.scoring?.doubleLastRace ? " Â· ultima x2" : ""}`
      : kind === "weekly"
        ? `${campaign.startDate || "-"} a ${campaign.endDate || "-"} Â· ${safeArray(campaign.eventNames).join(", ") || "-"}${perEventSummary ? ` Â· ${perEventSummary}` : ""} Â· ${groupLabel} Â· ${modeLabel}${valueLabel}${campaign.scoring?.doubleLastRace ? " Â· ultima x2" : ""}`
        : `${safeArray(campaign.hipodromos).join(", ") || "-"} Â· ${campaign.startDate || "-"} a ${campaign.endDate || "-"}${perEventSummary ? ` Â· ${perEventSummary}` : ` Â· ${campaign.raceCount || 12} carreras`} Â· ${groupLabel} Â· ${modeLabel}${valueLabel}${campaign.scoring?.doubleLastRace ? " Â· ultima x2" : ""}`;
    return `<article class="mini-card campaign-card"><span class="label">${status}</span><strong>${campaign.name || "Sin nombre"}</strong><p class="hint">${detail}</p><div class="toolbar-group"><button class="ghost-button" data-toggle-campaign-detail="${kind}" data-campaign-id="${campaign.id}">${expanded ? "Ocultar" : "Ver mas"}</button><button class="ghost-button" data-edit-campaign="${kind}" data-campaign-id="${campaign.id}">Editar</button><button class="ghost-button" data-campaign-action="${campaign.enabled === false ? "activate" : "deactivate"}" data-campaign-kind="${kind}" data-campaign-id="${campaign.id}">${campaign.enabled === false ? "Activar" : "Desactivar"}</button><button class="ghost-button" data-campaign-action="clear-data" data-campaign-kind="${kind}" data-campaign-id="${campaign.id}">Limpiar datos</button><button class="ghost-button" data-campaign-action="delete" data-campaign-kind="${kind}" data-campaign-id="${campaign.id}">Eliminar</button></div>${expanded ? renderCampaignDetailPanel(kind, campaign) : ""}</article>`;
  }).join("")}</div>`;
}

function renderScoringFields(prefix = "") {
  return `<div class="field"><label>Tipo de puntuacion</label><select name="${prefix}scoringMode" data-scoring-mode><option value="dividend">Por dividendo</option><option value="points">Por puntos</option></select></div><div class="check-grid" data-dividend-fields><label class="check-chip"><input type="checkbox" name="${prefix}doubleLastRace" checked /> Ultima carrera x2 en dividendos</label></div><div class="form-grid" data-points-fields hidden><div class="field"><label>Puntos 1Â°</label><input name="${prefix}pointsFirst" type="number" min="0" value="10" /></div><div class="field"><label>Puntos 2Â°</label><input name="${prefix}pointsSecond" type="number" min="0" value="5" /></div><div class="field"><label>Puntos 3Â°</label><input name="${prefix}pointsThird" type="number" min="0" value="1" /></div><div class="field"><label>Exclusivo 1Â°</label><input name="${prefix}pointsExclusiveFirst" type="number" min="0" value="20" /></div></div><p class="hint">Si eliges "por puntos", se usan estos valores. Si eliges "por dividendo", se usa ganador + segundo + tercero para el 1Â°, segundo + tercero para el 2Â° y solo tercero para el 3Â°. La opcion de ultima x2 solo aplica en dividendo.</p>`;
}

function readScoringFromForm(form) {
  return {
    mode: form.get("scoringMode") === "points" ? "points" : "dividend",
    doubleLastRace: form.get("doubleLastRace") === "on",
    points: {
      first: Number(form.get("pointsFirst")) || 10,
      second: Number(form.get("pointsSecond")) || 5,
      third: Number(form.get("pointsThird")) || 1,
      exclusiveFirst: Number(form.get("pointsExclusiveFirst")) || 20,
    },
  };
}

function renderCompetitionModeFields(prefix = "", draft = {}) {
  const mode = String(draft.competitionMode || draft.format || "individual");
  return `<div class="field"><label>Modalidad de competencia</label><select name="${prefix}competitionMode">${getCompetitionModeOptions().map(([value, label]) => `<option value="${value}"${value === mode ? " selected" : ""}>${label}</option>`).join("")}</select></div><div class="form-grid"><div class="field"><label>Clasificados totales</label><input name="${prefix}qualifiersCount" type="number" min="0" value="${Number(draft.qualifiersCount) || 0}" /></div><div class="field"><label>Clasificados por grupo</label><input name="${prefix}qualifiersPerGroup" type="number" min="0" value="${Number(draft.qualifiersPerGroup) || 0}" /></div><div class="field"><label>Eliminados por jornada</label><input name="${prefix}eliminatePerDay" type="number" min="0" value="${Number(draft.eliminatePerDay) || 0}" /></div></div><p class="hint">La modalidad define el tipo de competencia. Los campos de clasificacion, grupos o eliminacion se usan segun corresponda.</p>`;
}

function renderDailyCampaignFields(draft = {}) {
  const mode = String(draft.competitionMode || "individual");
  const promoEnabled = draft.promoEnabled !== false;
  const promoPrice = Number(draft.promoPrice) || 0;
  return `<div class="field"><label>Modalidad de competencia</label><select name="competitionMode">${getCompetitionModeOptions().map(([value, label]) => `<option value="${value}"${value === mode ? " selected" : ""}>${label}</option>`).join("")}</select></div><p class="hint">Individual significa una semanal simple: todos compiten en la misma tabla, sin grupos, sin llaves y sin eliminacion.</p><div class="check-grid"><label class="check-chip"><input type="checkbox" name="promoEnabled"${promoEnabled ? " checked" : ""} /> Activar promocion 2x</label></div><div class="field" data-promo-price-field><label>Valor promo 2x</label><input name="promoPrice" type="number" min="0" step="100" value="${promoPrice}" placeholder="Ej. 9000" /></div><p class="hint">La diaria no necesita campos de clasificacion ni eliminacion. Aqui defines modalidad, si permite promo 2x y cuanto cuesta esa promo.</p>`;
}

function renderCampaignPromoFields(draft = {}) {
  const promoEnabled = draft.promoEnabled === true;
  const promoPrice = Number(draft.promoPrice) || 0;
  return `<div class="check-grid"><label class="check-chip"><input type="checkbox" name="promoEnabled"${promoEnabled ? " checked" : ""} /> Activar promocion 2x</label></div><div class="field" data-promo-price-field><label>Valor promo 2x</label><input name="promoPrice" type="number" min="0" step="100" value="${promoPrice}" placeholder="Ej. 18000" /></div><p class="hint">Si activas promo 2x, luego en el detalle de la campana podras marcar quien entra individual y quien entra con promo.</p>`;
}

function bindScoringFieldVisibility(form) {
  const select = form?.querySelector("[data-scoring-mode]");
  if (!select) return;
  const sync = () => {
    const isPoints = select.value === "points";
    form.querySelectorAll("[data-points-fields]").forEach((block) => {
      block.hidden = !isPoints;
    });
    form.querySelectorAll("[data-dividend-fields]").forEach((block) => {
      block.hidden = isPoints;
    });
  };
  select.addEventListener("change", sync);
  sync();
}

function bindCampaignPromoVisibility(form) {
  const promoInput = form?.querySelector('[name="promoEnabled"]');
  if (!promoInput) return;
  const sync = () => {
    form.querySelectorAll("[data-promo-price-field]").forEach((block) => {
      block.hidden = !promoInput.checked;
      block.style.display = promoInput.checked ? "" : "none";
    });
  };
  promoInput.addEventListener("change", sync);
  sync();
}

function bindWeeklyCompetitionVisibility(form) {
  const formatSelect = form?.querySelector('[name="format"]');
  const finalStageInput = form?.querySelector('[name="hasFinalStage"]');
  const finalDayInputs = Array.from(form?.querySelectorAll('input[name="finalDays"]') || []);
  if (!formatSelect) return;

  const sync = () => {
    const mode = String(formatSelect.value || "individual");
    const description = form.querySelector("[data-weekly-mode-description]");
    const hasFinalSupport = ["round-robin", "groups", "final-qualification", "pairs"].includes(mode);
    if (description) {
      description.textContent = getCompetitionModeDescription(mode);
    }
    form.querySelectorAll("[data-weekly-visible]").forEach((block) => {
      const modes = String(block.dataset.weeklyVisible || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      const isVisible = modes.length ? modes.includes(mode) : false;
      block.hidden = !isVisible;
      block.style.display = isVisible ? "" : "none";
    });

    form.querySelectorAll("[data-weekly-final-toggle]").forEach((block) => {
      block.hidden = !hasFinalSupport;
      block.style.display = hasFinalSupport ? "" : "none";
    });

    const hasFinalStage = hasFinalSupport && finalStageInput?.checked;
    form.querySelectorAll("[data-weekly-final-only]").forEach((block) => {
      block.hidden = !hasFinalStage;
      block.style.display = hasFinalStage ? "" : "none";
    });

    const finalInfo = form.querySelector("[data-weekly-final-summary]");
    if (finalInfo) {
      finalInfo.textContent = hasFinalStage
        ? "Aqui eliges si la final se juega solo el Sabado, solo el Domingo o ambos dias."
        : "Sin final, la fase regular puede ocupar todos los dias que marques.";
    }

    if (!hasFinalSupport && finalStageInput) {
      finalStageInput.checked = false;
    }

    const weekendDays = new Set(["Sabado", "Domingo"]);
    const dayInputs = Array.from(form.querySelectorAll('input[name="activeDays"]'));
    dayInputs.forEach((input) => {
      if (!hasFinalStage) return;
      if (weekendDays.has(input.value)) {
        input.checked = false;
      }
    });
    finalDayInputs.forEach((input) => {
      input.disabled = !hasFinalStage;
      if (!hasFinalStage) {
        input.checked = false;
      }
    });
    if (hasFinalStage && !finalDayInputs.some((input) => input.checked)) {
      finalDayInputs.forEach((input) => {
        input.checked = true;
      });
    }
    if (mode === "round-robin" && !hasFinalStage && !dayInputs.some((input) => input.checked)) {
      dayInputs.forEach((input) => {
        input.checked = true;
      });
    }
  };

  formatSelect.addEventListener("change", sync);
  finalStageInput?.addEventListener("change", sync);
  sync();
}

function parseRetirosInput(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNameLines(value) {
  return Array.from(new Set(
    String(value || "")
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean),
  ));
}

function serializeNameLines(values) {
  return safeArray(values).join("\n");
}

function parseGroupDefinitions(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line, index) => {
      const raw = line.trim();
      if (!raw) return null;
      const [labelPart, membersPart] = raw.includes(":") ? raw.split(/:(.+)/) : [`Grupo ${index + 1}`, raw];
      const members = String(membersPart || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
      if (!members.length) return null;
      return {
        name: String(labelPart || `Grupo ${index + 1}`).trim(),
        members,
      };
    })
    .filter(Boolean);
}

function serializeGroupDefinitions(groups) {
  return safeArray(groups)
    .map((group, index) => `${group.name || `Grupo ${index + 1}`}: ${safeArray(group.members).join(", ")}`)
    .join("\n");
}

function getRegistryGroups() {
  const grouped = new Map();
  safeArray(state.data?.registry)
    .filter((item) => item?.group)
    .forEach((item) => {
      const key = String(item.group || "").trim();
      if (!key) return;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(String(item.name || "").trim());
    });
  return Array.from(grouped.entries())
    .map(([name, members]) => ({
      name,
      members: members.filter(Boolean),
    }))
    .filter((group) => group.members.length);
}

function getRegistryGroupOptions() {
  const configured = safeArray(state.data?.settings?.registryGroups);
  if (configured.length) {
    return configured
      .filter((group) => group?.enabled !== false)
      .map((group) => ({
        id: String(group.id || "").trim(),
        name: String(group.name || group.id || "").trim(),
      }))
      .filter((group) => group.id);
  }
  return getRegistryGroups().map((group) => ({
    id: String(group.name || "").trim(),
    name: String(group.name || "").trim(),
  }));
}

function getRegistryGroupLabel(groupId) {
  const id = String(groupId || "").trim();
  if (!id) return "Sin grupo";
  return getRegistryGroupOptions().find((group) => group.id === id)?.name || id;
}

function getSelectedCampaignGroupIds() {
  const groups = new Set();
  ["daily", "weekly", "monthly"].forEach((kind) => {
    safeArray(state.adminTargetSelections?.[kind]).forEach((campaignId) => {
      const campaign = getCampaigns(kind).find((item) => item.id === campaignId);
      const groupId = String(campaign?.groupId || "").trim();
      if (groupId) groups.add(groupId);
    });
  });
  return Array.from(groups);
}

function getEligibleRegistryRoster() {
  const groupIds = getSelectedCampaignGroupIds();
  if (groupIds.length > 1) return [];
  return safeArray(state.data?.registry).filter((item) => {
    const enabled = item?.diaria || item?.semanal || item?.mensual;
    if (!enabled) return false;
    if (!groupIds.length) return true;
    return groupIds.includes(String(item.group || "").trim());
  });
}

function getForecastCampaignMatches(operationDate, selectedGroupId = "") {
  const requestedGroupId = String(selectedGroupId || "").trim();
  return ["daily", "weekly", "monthly"].flatMap((kind) =>
    getCampaignMatchesByDate(kind, operationDate).map((match) => {
      const campaign = getCampaigns(kind).find((item) => item.id === match.id) || null;
      return {
        ...match,
        campaign,
        campaignKind: kind,
        groupId: String(campaign?.groupId || "").trim(),
      };
    }),
  ).filter((match) => !requestedGroupId || match.groupId === requestedGroupId);
}

function getForecastScopeKey(groupId) {
  return String(groupId || "").trim() || "__all__";
}

function getForecastResolvedGroupId(matches, selectedGroupId = "") {
  const requestedGroupId = String(selectedGroupId || "").trim();
  if (requestedGroupId) return requestedGroupId;
  const scopeKeys = Array.from(new Set(matches.map((match) => getForecastScopeKey(match.groupId))));
  if (!scopeKeys.length) return "";
  if (scopeKeys.length === 1) {
    return scopeKeys[0] === "__all__" ? "" : scopeKeys[0];
  }
  return null;
}

function getForecastSelectionSnapshot(operationDate = toLocalDateInputValue(), selectedGroupId = state.adminTargetSelections.groupId || "") {
  const scopeKey = `${String(operationDate || "").trim()}::${String(selectedGroupId || "").trim()}`;
  if (state.adminTargetSelections.scopeKey !== scopeKey) {
    state.adminTargetSelections.scopeKey = scopeKey;
    state.adminTargetSelections.selectionTouched = false;
    state.adminTargetSelections.daily = [];
    state.adminTargetSelections.weekly = [];
    state.adminTargetSelections.monthly = [];
  }
  const matches = getForecastCampaignMatches(operationDate, selectedGroupId);
  const matchesByKind = {
    daily: matches.filter((match) => match.campaignKind === "daily"),
    weekly: matches.filter((match) => match.campaignKind === "weekly"),
    monthly: matches.filter((match) => match.campaignKind === "monthly"),
  };
  ["daily", "weekly", "monthly"].forEach((kind) => {
    const validIds = matchesByKind[kind].map((match) => match.campaign?.id).filter(Boolean);
    let selectedIds = safeArray(state.adminTargetSelections[kind]).filter((id) => validIds.includes(id));
    if (!selectedIds.length && validIds.length && !state.adminTargetSelections.selectionTouched) {
      selectedIds = validIds.slice();
    }
    state.adminTargetSelections[kind] = selectedIds;
  });
  const selectedMatches = matches.filter((match) => safeArray(state.adminTargetSelections[match.campaignKind]).includes(match.campaign?.id));
  const resolvedGroupId = getForecastResolvedGroupId(matches, selectedGroupId);
  const rosterSourceMatches = selectedMatches.length ? selectedMatches : matches;
  const rosterNames = resolvedGroupId === null
    ? []
    : Array.from(new Set(rosterSourceMatches.flatMap((match) => {
        const fixedNames = safeArray(match?.campaign?.registeredParticipants).map((name) => String(name || "").trim()).filter(Boolean);
        if (fixedNames.length) {
          return fixedNames;
        }
        return getCampaignEligibleParticipants(match.campaignKind, match.campaign);
      }))).sort((a, b) => a.localeCompare(b, "es"));
  const roster = rosterNames.map((name) => ({ name }));
  const targetEventIds = resolvedGroupId === null
    ? []
    : Array.from(new Set(selectedMatches.flatMap((match) => safeArray(match.eventIds)).filter(Boolean)));
  const warnings = [];
  if (!matches.length) {
    warnings.push("No hay campañas vigentes para la fecha y grupo elegidos.");
  } else if (resolvedGroupId === null) {
    warnings.push("La fecha tiene campañas de grupos distintos. Elige un grupo para cargar pronósticos.");
  } else if (!selectedMatches.length) {
    warnings.push("Marca al menos una campaña destino para guardar este pronóstico.");
  }
  return {
    operationDate,
    selectedGroupId: String(selectedGroupId || "").trim(),
    resolvedGroupId,
    matches,
    selectedMatches,
    roster,
    targetEventIds,
    warnings,
  };
}

function getForecastUsedParticipantNames(selectedMatches = []) {
  const participantSets = safeArray(selectedMatches).map((match) => {
      const names = new Set();
      safeArray(match?.eventIds).forEach((eventId) => {
        const currentEvent = findEventById(eventId);
        safeArray(currentEvent?.participants).forEach((participant) => {
          const name = String(participant?.name || "").trim();
          if (name) names.add(name);
        });
      });
      return names;
    });
  if (!participantSets.length) {
    return new Set();
  }
  if (participantSets.some((set) => set.size === 0)) {
    return new Set();
  }
  const [firstSet, ...restSets] = participantSets;
  return new Set(
    Array.from(firstSet).filter((name) => restSets.every((set) => set.has(name))),
  );
}

function getForecastOperationEvent(operationDate = toLocalDateInputValue(), selectedGroupId = state.adminTargetSelections.groupId || "") {
  const snapshot = getForecastSelectionSnapshot(operationDate, selectedGroupId);
  const candidateEventId = safeArray(snapshot.targetEventIds).find((eventId) => eventId === state.adminOpsEventId) || snapshot.targetEventIds[0] || "";
  const currentEvent = findEventById(candidateEventId);
  if (currentEvent) {
    return {
      event: currentEvent,
      snapshot,
    };
  }
  const firstMatch = snapshot.matches[0];
  const fallbackEventId = safeArray(firstMatch?.eventIds)[0];
  const fallbackRaceCount = Number(firstMatch?.campaign?.raceCount) || 12;
  if (!fallbackEventId) {
    return {
      event: null,
      snapshot,
    };
  }
  return {
    event: createEmptyEvent(
      fallbackEventId,
      firstMatch?.label || firstMatch?.campaign?.name || "Operacion",
      firstMatch?.campaignKind === "monthly" ? "mensual" : "semanal",
      fallbackRaceCount,
    ),
    snapshot,
  };
}

function getCompetitionModeOptions() {
  return [
    ["individual", "Individual"],
    ["pairs", "Parejas"],
    ["round-robin", "Todos contra todos"],
    ["final-qualification", "Clasificacion a final"],
    ["groups", "Por grupos"],
    ["head-to-head", "Duelo / mano a mano"],
    ["progressive-elimination", "Eliminacion progresiva"],
  ];
}

function getCompetitionModeDescription(mode) {
  const descriptions = {
    individual: "Tabla simple de acumulado. Todos suman en la misma clasificacion, sin grupos, sin llaves y sin etapa final.",
    pairs: "Los participantes compiten en duplas. Cada pareja suma junto y, si quieres, puede cerrar con una final.",
    "round-robin": "Todos compiten en una tabla general durante la fase regular. A diferencia del individual, aqui si puedes usar clasificacion a final.",
    "final-qualification": "Primero juegan todos la fase regular y luego solo pasan algunos a una final que puedes jugar en Sabado, Domingo o ambos.",
    groups: "La semanal se divide en grupos competitivos. Desde cada grupo clasifican algunos a la fase final si la activas.",
    "head-to-head": "Cruces uno contra uno. Cada participante o pareja se enfrenta a otro y avanza el mejor puntaje.",
    "progressive-elimination": "Todos parten juntos, pero en cada jornada se eliminan los peores acumulados segun la regla que definas.",
  };
  return descriptions[mode] || "";
}

function parsePairDefinitions(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line, index) => {
      const raw = line.trim();
      if (!raw) return null;
      const [labelPart, membersPart] = raw.includes(":") ? raw.split(/:(.+)/) : [`Pareja ${index + 1}`, raw];
      const members = String(membersPart || "")
        .split(/\s*(?:\+|,|\/| y )\s*/i)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 2);
      if (members.length < 2) return null;
      return {
        name: String(labelPart || `Pareja ${index + 1}`).trim(),
        members,
      };
    })
    .filter(Boolean);
}

function serializePairDefinitions(pairs) {
  return safeArray(pairs)
    .map((pair, index) => `${pair.name || `Pareja ${index + 1}`}: ${safeArray(pair.members).join(" + ")}`)
    .join("\n");
}

function renderWeeklyCompetitionFields(draft = {}) {
  return `<div class="stack"><div class="field"><label>Clasificados a la final</label><textarea name="finalists" rows="5" placeholder="SIN FE&#10;ALF&#10;SERVIFRENOS">${serializeNameLines(draft.finalists)}</textarea><p class="hint">Un participante por lÃ­nea. Si es dÃ­a de final y aquÃ­ hay nombres, solo ellos podrÃ¡n enviar pronÃ³stico.</p></div><div class="field"><label>Grupos</label><textarea name="groups" rows="5" placeholder="Grupo A: SIN FE, ALF, SERVIFRENOS, SIN FIA&#10;Grupo B: STUD 5, STUD 6, STUD 7, STUD 8">${serializeGroupDefinitions(draft.groups)}</textarea><p class="hint">Formato sugerido: Grupo A: nombre, nombre, nombre. Si la campaÃ±a es por grupos, un stud debe pertenecer a un grupo para poder cargar.</p></div><div class="field"><label>Parejas</label><textarea name="pairs" rows="5" placeholder="Pareja 1: SIN FE + SIN FIA&#10;Pareja 2: ALF + SERVIFRENOS">${serializePairDefinitions(draft.pairs)}</textarea><p class="hint">Formato sugerido: Pareja 1: Stud A + Stud B. Si la campaÃ±a es en parejas, solo se podrÃ¡n cargar studs que estÃ©n en una pareja registrada.</p></div></div>`;
}

function getWeeklyEligibilityErrors(names, targetEventIds, operationDate) {
  const weekday = getWeekdayNameFromDate(operationDate);
  const errors = [];
  const relevantCampaigns = getCampaigns("weekly").filter((campaign) =>
    campaign.enabled !== false
    && isDateWithinRange(operationDate, campaign.startDate, campaign.endDate)
    && safeArray(campaign.eventIds).some((eventId) => targetEventIds.includes(eventId)),
  );

  safeArray(names).forEach((rawName) => {
    const name = String(rawName || "").trim();
    if (!name) return;
    relevantCampaigns.forEach((campaign) => {
      const finalists = safeArray(campaign.finalists);
      const groupMembers = safeArray(campaign.groups).flatMap((group) => safeArray(group.members));
      const pairMembers = safeArray(campaign.pairs).flatMap((pair) => safeArray(pair.members));
      const isFinalDay = safeArray(campaign.finalDays).includes(weekday);

      if (isFinalDay && finalists.length && !finalists.includes(name)) {
        errors.push(`"${name}" no estÃ¡ clasificado para la final de ${campaign.name}.`);
      }
      if (campaign.format === "grupos" && groupMembers.length && !groupMembers.includes(name)) {
        errors.push(`"${name}" no pertenece a ningÃºn grupo de ${campaign.name}.`);
      }
      if ((campaign.format === "parejas" || campaign.pairMode) && pairMembers.length && !pairMembers.includes(name)) {
        errors.push(`"${name}" no pertenece a ninguna pareja de ${campaign.name}.`);
      }
    });
  });

  return Array.from(new Set(errors));
}

async function applyCampaignAction(kind, id, action) {
  const response = await fetch(`/api/admin/campaigns/${kind}/${id}/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  const data = await response.json();
  if (!response.ok) return showToast(data.detail || data.error || "No se pudo aplicar la accion.");
  state.data = data;
  render();
  showToast(
    action === "delete"
      ? "Campana eliminada."
      : action === "clear-data"
        ? "Datos de la campana limpiados."
        : action === "activate"
          ? "Campana activada."
          : "Campana desactivada.",
  );
}

function getOperationSources() {
  if (state.adminOpsMode === "mensual") {
    return getCampaigns("monthly")
      .filter((campaign) => campaign.enabled !== false)
      .map((campaign) => {
      const eventIds = safeArray(campaign.eventIds).length ? safeArray(campaign.eventIds) : [`${campaign.id}-general`];
      return {
        id: campaign.id,
        kind: "monthly",
        label: campaign.name,
        type: "mensual",
        primaryEventId: eventIds[0],
        eventIds,
        raceCount: campaign.raceCount || 12,
      };
    });
  }

  const daily = getCampaigns("daily")
    .filter((campaign) => campaign.enabled !== false)
    .map((campaign) => ({
    id: campaign.id,
    kind: "daily",
    label: `[Diaria] ${campaign.name}`,
    type: "semanal",
    primaryEventId: campaign.eventId || `campaign-${campaign.id}`,
    eventIds: [campaign.eventId || `campaign-${campaign.id}`],
    raceCount: campaign.raceCount || 12,
  }));

  const weekly = getCampaigns("weekly")
    .filter((campaign) => campaign.enabled !== false)
    .map((campaign) => {
    const eventIds = safeArray(campaign.eventIds).length
      ? safeArray(campaign.eventIds)
      : safeArray(campaign.activeDays).map((day) => `${campaign.id}-${normalizeIdPart(day)}`);
    return {
      id: campaign.id,
      kind: "weekly",
      label: `[Semanal] ${campaign.name}`,
      type: "semanal",
      primaryEventId: eventIds[0] || `campaign-${campaign.id}`,
      eventIds,
      raceCount: campaign.raceCount || 12,
    };
  });

  // Agregar eventos importados automáticamente para que aparezcan en Admin > Resultados
  const operationDate = state.adminTargetSelections.operationDate || toLocalDateInputValue();
  const importedPrefix = `imported-${operationDate}`;
  const importedEvents = Object.entries(state.data.events || {})
    .filter(([eventId, eventData]) => {
      return eventId.startsWith(importedPrefix) && eventData.meta?.autoImported;
    })
    .map(([eventId, eventData]) => {
      const meta = eventData.meta || {};
      const results = eventData.results || {};
      return {
        id: eventId,
        kind: "daily",
        label: `📥 ${meta.trackName || 'Resultados Importados'} - ${operationDate}`,
        type: "semanal",
        primaryEventId: eventId,
        eventIds: [eventId],
        raceCount: meta.raceCount || Object.keys(results).length || 12,
        autoImported: true,
      };
    });

  // Si no hay campañas pero hay eventos importados, usar solo los importados
  const sources = [...daily, ...weekly];
  if (sources.length === 0 && importedEvents.length > 0) {
    return importedEvents;
  }

  // Si hay campañas Y eventos importados, agregar los importados como opción adicional
  return [...sources, ...importedEvents];
}

function getOperationEvent(source) {
  if (!source) return null;
  const event = getAdminOpsEvents().find((item) => item.id === source.primaryEventId);
  return event || createEmptyEvent(source.primaryEventId, source.label, source.type, source.raceCount || 12);
}

function getOperationEventForDate(source, operationDate) {
  if (!source) return null;
  if (!operationDate) return getOperationEvent(source);
  const match = getCampaignMatchesByDate(source.kind, operationDate).find((item) => item.id === source.id);
  
  // Si no hay campaña match, buscar en eventos importados por fecha
  if (!match) {
    const importedEventId = `imported-${operationDate}`;
    const importedEvents = Object.entries(state.data.events || {})
      .filter(([eventId]) => eventId.startsWith(importedEventId))
      .map(([eventId, eventData]) => {
        const meta = eventData.meta || {};
        const results = eventData.results || {};
        return {
          id: eventId,
          sheetName: `${meta.trackName || 'Importado'} - ${operationDate}`,
          title: meta.trackName || eventId,
          races: meta.raceCount || Object.keys(results).length,
          results: Object.values(results).sort((a, b) => Number(a.race) - Number(b.race)),
          participants: eventData.participants || [],
          meta: meta,
        };
      });
    
    // Si hay eventos importados para esta fecha, devolver el primero con más resultados
    if (importedEvents.length > 0) {
      return importedEvents.sort((a, b) => b.results.length - a.results.length)[0];
    }
    
    return createEmptyEvent(
      source.primaryEventId,
      `Sin resultados para ${operationDate}`,
      source.type,
      source.raceCount || 12,
    );
  }
  
  const matchedEventId = safeArray(match.eventIds)[0] || source.primaryEventId;
  const matchedEvent = getAdminOpsEvents().find((item) => item.id === matchedEventId);
  return matchedEvent || createEmptyEvent(
    matchedEventId,
    match.label,
    source.type,
    source.raceCount || 12,
  );
}

function getPreferredOperationSource(sources, operationDate, mode = "forecasts") {
  const current = sources.find((item) => item.primaryEventId === state.adminOpsEventId) || null;
  if (current && state.adminOpsManualSelection) return current;
  const currentEvent = current ? getOperationEventForDate(current, operationDate) : null;
  const hasCurrentData = mode === "results"
    ? safeArray(currentEvent?.results).length > 0
    : safeArray(currentEvent?.participants).length > 0;
  if (current && hasCurrentData) return current;
  const candidate = sources.find((item) => {
    const event = getOperationEventForDate(item, operationDate);
    return mode === "results"
      ? safeArray(event?.results).length > 0
      : safeArray(event?.participants).length > 0;
  });
  return candidate || current || sources[0] || null;
}

function buildTargetEventIds(selection) {
  const ids = [];
  if (selection.dailyCampaignId) {
    const campaign = getCampaigns("daily").find((item) => item.id === selection.dailyCampaignId);
    if (campaign?.eventId) ids.push(campaign.eventId);
  }
  if (selection.weeklyCampaignId) {
    const campaign = getCampaigns("weekly").find((item) => item.id === selection.weeklyCampaignId);
    ids.push(...safeArray(campaign?.eventIds));
  }
  if (selection.monthlyCampaignId) {
    const campaign = getCampaigns("monthly").find((item) => item.id === selection.monthlyCampaignId);
    ids.push(...safeArray(campaign?.eventIds));
  }
  return Array.from(new Set(ids.filter(Boolean)));
}

async function saveSettings(event, payload, message) {
  event.preventDefault();
  const response = await fetch("/api/admin/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar.");
  state.data = data;
  render();
  showToast(message);
}

renderEventForms = function renderEventFormsV2(event) {
  const roster = state.data.registry.filter((item) => item.diaria || item.semanal).map((item) => item.name);
  const names = roster.length ? roster : event.participants.map((item) => item.name);
  const defaultParticipant = event.participants[0];
  const nextIndex = Math.max(0, ...event.participants.map((item) => Number(item.index) || 0)) + 1;
  const race = getFocusRace(event);
  const current = event.results.find((item) => String(item.race) === race) || { race };
  return `<div class="panel"><div class="panel-head"><h4>Destino de la operacion</h4><p>Con estos checks replicas la carga a varias pollas.</p></div><div class="stack"><div class="check-grid"><label class="check-chip"><input type="checkbox" data-target-check="daily" checked /> Diaria</label><label class="check-chip"><input type="checkbox" data-target-check="weekly" /> Semanal</label><label class="check-chip"><input type="checkbox" data-target-check="monthly" /> Mensual</label></div><div class="form-grid"><div class="field"><label>Campana diaria</label><select data-target-select="daily"><option value="">No aplicar</option>${getCampaigns("daily").map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></div><div class="field"><label>Campana semanal</label><select data-target-select="weekly"><option value="">No aplicar</option>${getCampaigns("weekly").map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></div><div class="field"><label>Campana mensual</label><select data-target-select="monthly"><option value="">No aplicar</option>${getCampaigns("monthly").map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></div></div></div></div><form class="editor-form" data-form="participant"><div class="panel-head"><h4>Pronostico</h4><p>Ingreso por jornada.</p></div><div class="form-grid"><div class="field"><label>Numero</label><input name="index" type="number" min="1" value="${defaultParticipant?.index || nextIndex}" /></div><div class="field"><label>Stud</label><select name="name">${names.map((name) => `<option value="${name}"${name === defaultParticipant?.name ? " selected" : ""}>${name}</option>`).join("")}</select></div></div><div class="form-grid">${Array.from({ length: Math.min(event.races, 30) }, (_, index) => `<div class="field"><label>C${index + 1}</label><input name="pick-${index + 1}" type="text" value="${defaultParticipant?.picks[index]?.horse || ""}" /></div>`).join("")}</div><div class="actions"><span class="hint">Si marcas diaria, semanal y mensual, el mismo pronostico se guarda en todas las jornadas objetivo.</span><button class="primary-button" type="submit">Guardar pronostico</button></div></form><form class="editor-form" data-form="result"><div class="panel-head"><h4>Resultado</h4><p>La carrera en foco.</p></div><div class="form-grid"><div class="field"><label>Carrera</label><input name="race" type="text" value="${race}" /></div><div class="field"><label>Primero</label><input name="primero" type="text" value="${current.primero || ""}" /></div><div class="field"><label>Div 1Â°</label><input name="ganador" type="text" value="${current.ganador || ""}" /></div><div class="field"><label>Segundo</label><input name="segundo" type="text" value="${current.segundo || ""}" /></div><div class="field"><label>Div 2Â°</label><input name="divSegundo" type="text" value="${current.divSegundo || ""}" /></div><div class="field"><label>Tercero</label><input name="tercero" type="text" value="${current.tercero || ""}" /></div><div class="field"><label>Div 3Â°</label><input name="divTercero" type="text" value="${current.divTercero || ""}" /></div></div><div class="actions"><span class="hint">Los resultados tambien pueden replicarse a las pollas marcadas, segun la campana elegida.</span><button class="primary-button" type="submit">Guardar resultado</button></div></form>`;
}

bindEventForms = function bindEventFormsV2(container, event) {
  const getTargets = () => {
    const dailyChecked = container.querySelector('[data-target-check="daily"]')?.checked;
    const weeklyChecked = container.querySelector('[data-target-check="weekly"]')?.checked;
    const monthlyChecked = container.querySelector('[data-target-check="monthly"]')?.checked;
    const targetEventIds = buildTargetEventIds({
      dailyCampaignId: dailyChecked ? container.querySelector('[data-target-select="daily"]')?.value : "",
      weeklyCampaignId: weeklyChecked ? container.querySelector('[data-target-select="weekly"]')?.value : "",
      monthlyCampaignId: monthlyChecked ? container.querySelector('[data-target-select="monthly"]')?.value : "",
    });
    return targetEventIds.length ? targetEventIds : [event.id];
  };

  container.querySelector('[data-form="participant"]')?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const response = await fetch(`/api/operations/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEventIds: getTargets(),
        participant: {
          index: Number(form.get("index")),
          name: form.get("name"),
          picks: Array.from({ length: Math.min(event.races, 30) }, (_, index) => form.get(`pick-${index + 1}`) || ""),
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el pronostico.");
    state.data = data;
    render();
    showToast("Pronostico guardado en las pollas seleccionadas.");
  });

  container.querySelector('[data-form="result"]')?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const race = String(form.get("race"));
    const response = await fetch(`/api/operations/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEventIds: getTargets(),
        result: {
          race,
          primero: form.get("primero"),
          empatePrimero: form.get("empatePrimero"),
          ganador: form.get("ganador"),
          segundo: form.get("segundo"),
          empateSegundo: form.get("empateSegundo"),
          divSegundo: form.get("divSegundo"),
          tercero: form.get("tercero"),
          empateTercero: form.get("empateTercero"),
          divTercero: form.get("divTercero"),
          favorito: form.get("favorito"),
          retiro1: form.get("retiro1"),
          retiro2: form.get("retiro2"),
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el resultado.");
    state.data = data;
    render();
    showToast(`Resultado de carrera ${race} guardado en las pollas seleccionadas.`);
  });
}

function renderAdminContent() {
  if (state.adminTab === "ops") {
    state.adminTab = "forecasts";
  }
  if (!state.adminUnlocked) {
    adminView.innerHTML = `<section class="panel gate"><p class="eyebrow">Administrador</p><h2>Entrar al panel de configuracion</h2><p class="hero-copy">Acceso local con usuario y clave. Si todavia no migraste usuarios, entra con <strong>admin</strong> y la clave actual.</p><form id="unlockForm" class="editor-form"><div class="field"><label>Usuario</label><input name="username" type="text" placeholder="admin" autocomplete="username" /></div><div class="field"><label>Clave</label><input name="password" type="password" placeholder="Ingresa la clave" autocomplete="current-password" /></div><div class="actions"><span class="hint">Acceso local protegido por usuario</span><button class="primary-button" type="submit">Entrar</button></div></form></section>`;
    adminView.querySelector("#unlockForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
      });
      const data = await response.json();
      if (!data.ok) return showToast("Usuario o clave incorrectos.");
      state.adminUnlocked = true;
      state.currentAdminUser = data.user || null;
      render();
    });
    return;
  }

  adminView.innerHTML = `${renderHero("Administrador", "Aqui decides como se juega la diaria, la semanal y la mensual. Puedes definir formato semanal, dias activos, finales, hipodromos, fechas y el padron maestro de participantes.", [
    { label: "Padron", value: state.data.registry.length },
    { label: "Semanal", value: state.data.settings.weekly.format },
    { label: "Hipodromos", value: safeArray(state.data.settings.monthly.hipodromos).length },
    { label: "Usuario", value: state.currentAdminUser?.displayName || state.currentAdminUser?.username || "Activo" },
  ])}<section class="panel"><div class="toolbar"><div class="toolbar-group" id="adminTabs"></div><button id="adminLogout" class="ghost-button">Cerrar administrador</button></div></section><section id="adminBody"></section>`;

  [["registry", "Padron"], ["campaigns", "Campanas"], ["prizes", "Premios"], ["forecasts", "Pronostico"], ["results", "Resultados"], ["programs", "Programa de carreras"], ["calendar", "Calendario"], ["automation", "Automatizacion"], ["users", "Usuarios"]].forEach(([id, label]) => {
    const button = document.createElement("button");
    button.className = `subnav-button${state.adminTab === id ? " active" : ""}`;
    button.textContent = label;
    button.addEventListener("click", () => {
      state.adminTab = id;
      render();
    });
    adminView.querySelector("#adminTabs").appendChild(button);
  });
  adminView.querySelector("#adminLogout").addEventListener("click", () => {
    state.adminUnlocked = false;
    state.currentAdminUser = null;
    clearPersistedAdminSession();
    render();
  });

  const body = adminView.querySelector("#adminBody");
  if (state.adminTab === "users") {
    const users = safeArray(state.data.settings?.adminUsers);
    const editingUser = users.find((user) => user.id === state.adminUserEdit) || null;
    body.innerHTML = `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>${editingUser ? "Editar usuario" : "Crear usuario"}</h3><p>Usuarios locales con acceso al administrador.</p></div><form id="adminUsersForm" class="editor-form"><div class="field"><label>Nombre visible</label><input name="displayName" type="text" value="${editingUser?.displayName || ""}" placeholder="Administrador" /></div><div class="field"><label>Usuario</label><input name="username" type="text" value="${editingUser?.username || ""}" placeholder="admin" /></div><div class="field"><label>${editingUser ? "Nueva clave (opcional)" : "Clave"}</label><input name="password" type="password" value="" placeholder="${editingUser ? "Solo si deseas cambiarla" : "Ingresa una clave"}" /></div><div class="check-grid"><label class="check-chip"><input type="checkbox" name="enabled"${editingUser?.enabled !== false ? " checked" : ""} /> Activo</label></div><div class="actions">${editingUser ? '<button type="button" class="ghost-button" id="cancelAdminUserEdit">Cancelar edicion</button>' : ""}<button class="primary-button" type="submit">${editingUser ? "Guardar cambios" : "Crear usuario"}</button></div></form></section><section class="panel"><div class="panel-head"><h3>Usuarios registrados</h3><p>Aqui administras quien puede entrar al panel.</p></div>${users.length ? `<div class="stack">${users.map((user) => `<article class="mini-card"><div class="panel-head"><div><strong>${user.displayName || user.username}</strong><p class="hint">${user.username} · ${user.enabled !== false ? "Activo" : "Inactivo"}</p></div><div class="actions"><button type="button" class="ghost-button" data-edit-admin-user="${user.id}">Editar</button>${users.length > 1 ? `<button type="button" class="ghost-button" data-delete-admin-user="${user.id}">Eliminar</button>` : ""}</div></div></article>`).join("")}</div>` : '<div class="empty">Todavia no hay usuarios registrados.</div>'}</section></section>`;
    body.querySelector("#adminUsersForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingUser?.id || "",
          displayName: String(form.get("displayName") || ""),
          username: String(form.get("username") || ""),
          password: String(form.get("password") || ""),
          enabled: form.get("enabled") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el usuario.");
      state.data.settings.adminUsers = safeArray(data.users);
      state.adminUserEdit = null;
      render();
      showToast(editingUser ? "Usuario actualizado." : "Usuario creado.");
    });
    body.querySelector("#cancelAdminUserEdit")?.addEventListener("click", () => {
      state.adminUserEdit = null;
      render();
    });
    body.querySelectorAll("[data-edit-admin-user]").forEach((button) => {
      button.addEventListener("click", () => {
        state.adminUserEdit = button.dataset.editAdminUser;
        render();
      });
    });
    body.querySelectorAll("[data-delete-admin-user]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!confirm("Se eliminara este usuario administrador.")) return;
        const response = await fetch(`/api/admin/users/${encodeURIComponent(button.dataset.deleteAdminUser)}`, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok) return showToast(data.detail || data.error || "No se pudo eliminar el usuario.");
        state.data.settings.adminUsers = safeArray(data.users);
        if (state.adminUserEdit === button.dataset.deleteAdminUser) state.adminUserEdit = null;
        render();
        showToast("Usuario eliminado.");
      });
    });
    return;
  }

  if (state.adminTab === "registry") {
    const groups = getRegistryGroupOptions();
    const editingParticipant = safeArray(state.data.registry).find((item) => item.name === state.adminRegistryEdit) || null;
    const editingGroup = groups.find((item) => item.id === state.adminRegistryGroupEdit) || null;
    const groupOptions = `<option value="">Sin grupo</option>${groups.map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}`;
    const registryStats = [
      { label: "Total padrón", value: safeArray(state.data.registry).length },
      { label: "Con grupo", value: safeArray(state.data.registry).filter((item) => String(item.group || "").trim()).length },
      { label: "Sin grupo", value: safeArray(state.data.registry).filter((item) => !String(item.group || "").trim()).length },
      { label: "Grupos activos", value: groups.length },
    ];
    const filteredRegistry = safeArray(state.data.registry).filter((item) => {
      if (!state.adminRegistryFilterGroup) return true;
      return String(item.group || "").trim() === state.adminRegistryFilterGroup;
    });
    const registryRows = filteredRegistry.map((item) => [
      item.name,
      getRegistryGroupLabel(item.group),
      item.diaria ? "Si" : "No",
      item.semanal ? "Si" : "No",
      item.mensual ? "Si" : "No",
      `<div class="toolbar-group"><button type="button" class="ghost-button" data-edit-registry="${item.name}">Editar</button><button type="button" class="ghost-button" data-delete-registry="${item.name}">Eliminar</button></div>`,
    ]);
    const groupRows = groups.map((item) => [
      item.name,
      safeArray(state.data.registry).filter((participant) => String(participant.group || "").trim() === item.id).length,
      `<div class="toolbar-group"><button type="button" class="ghost-button" data-edit-registry-group="${item.id}">Editar</button><button type="button" class="ghost-button" data-delete-registry-group="${item.id}">Eliminar</button></div>`,
    ]);
    body.innerHTML = `<section class="panel"><div class="panel-head"><h3>Padron maestro</h3><p>Participacion por modalidad y grupo.</p></div><div class="cards two">${registryStats.map((item) => `<article class="mini-card"><span class="label">${item.label}</span><strong>${item.value}</strong></article>`).join("")}</div></section><section class="grid-2"><section class="panel"><form id="registryForm" class="editor-form"><div class="field"><label>Participante</label><input name="name" type="text" value="${editingParticipant?.name || ""}" placeholder="Ej. Servifrenos" /></div><div class="field"><label>Grupo</label><select name="group">${groupOptions}</select></div><div class="check-grid"><label class="check-chip"><input type="checkbox" name="diaria"${editingParticipant?.diaria ? " checked" : ""} /> Diaria</label><label class="check-chip"><input type="checkbox" name="semanal"${editingParticipant?.semanal ? " checked" : ""} /> Semanal</label><label class="check-chip"><input type="checkbox" name="mensual"${editingParticipant?.mensual ? " checked" : ""} /> Mensual</label></div><div class="actions"><span class="hint">El participante puede quedar sin grupo o asociado a uno para filtrar campanas.</span><button class="primary-button" type="submit">${editingParticipant ? "Guardar cambios" : "Guardar participante"}</button>${editingParticipant ? '<button class="ghost-button" type="button" id="cancelRegistryEdit">Cancelar</button>' : ""}</div></form><form id="registryBulkForm" class="editor-form"><div class="panel-head"><h4>Carga masiva</h4><p>Pega un nombre por linea.</p></div><div class="field"><label>Participantes en bloque</label><textarea name="names" rows="8" placeholder="ALF&#10;SIN FE&#10;SIN FIA"></textarea></div><div class="field"><label>Grupo para esta carga</label><select name="group">${groupOptions}</select></div><div class="check-grid"><label class="check-chip"><input type="checkbox" name="diaria" /> Diaria</label><label class="check-chip"><input type="checkbox" name="semanal" /> Semanal</label><label class="check-chip"><input type="checkbox" name="mensual" /> Mensual</label></div><div class="actions"><span class="hint">Se crea un participante por linea y todos heredan el grupo elegido.</span><button class="ghost-button" type="submit">Guardar carga masiva</button></div></form><form id="registryBulkDeleteForm" class="editor-form"><div class="panel-head"><h4>Eliminacion masiva</h4><p>Pega un nombre por linea para quitarlo del padron.</p></div><div class="field"><label>Participantes a eliminar</label><textarea name="names" rows="6" placeholder="ALF&#10;SIN FE&#10;SIN FIA"></textarea></div><div class="actions"><span class="hint">Se elimina un participante por linea. Si no existe, simplemente se omite.</span><button class="ghost-button" type="submit">Eliminar participantes</button></div></form></section><section class="panel"><div class="panel-head"><h3>Listado actual</h3><p>Padron completo, con acciones para editar o eliminar participantes.</p></div><div class="form-grid"><div class="field"><label>Filtrar por grupo</label><select id="registryGroupFilter"><option value="">Todos</option>${groups.map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></div></div>${setTable(["Participante", "Grupo", "Diaria", "Semanal", "Mensual", "Acciones"], registryRows)}</section></section><section class="panel"><div class="panel-head"><h3>Grupos del padron</h3><p>Estos grupos luego se usan para limitar quienes entran a cada campana.</p></div><form id="registryGroupForm" class="editor-form"><div class="field"><label>Nombre del grupo</label><input name="name" type="text" value="${editingGroup?.name || ""}" placeholder="Ej. Grupo A" /></div><div class="actions"><span class="hint">Puedes crear, renombrar o dejar participantes sin grupo.</span><button class="primary-button" type="submit">${editingGroup ? "Guardar grupo" : "Crear grupo"}</button>${editingGroup ? '<button class="ghost-button" type="button" id="cancelRegistryGroupEdit">Cancelar</button>' : ""}</div></form>${setTable(["Grupo", "Participantes", "Acciones"], groupRows)}</section>`;
    body.querySelector("#registryForm select[name='group']").value = editingParticipant?.group || "";
    body.querySelector("#registryBulkForm select[name='group']").value = "";

    body.querySelector("#registryGroupForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/registry-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalId: editingGroup?.id || "",
          name: form.get("name"),
        }),
      });
      const data = await response.json();
      if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el grupo.");
      state.data = data;
      state.adminRegistryGroupEdit = null;
      render();
      showToast(editingGroup ? "Grupo actualizado." : "Grupo creado.");
    });

    body.querySelector("#registryForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const response = await fetch("/api/admin/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalName: editingParticipant?.name || "",
          name: form.get("name"),
          group: form.get("group"),
          diaria: form.get("diaria") === "on",
          semanal: form.get("semanal") === "on",
          mensual: form.get("mensual") === "on",
        }),
      });
      const data = await response.json();
      if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el participante.");
      state.data = data;
      state.adminRegistryEdit = null;
      render();
      showToast("Padron actualizado.");
    });

    body.querySelector("#registryBulkForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const names = String(form.get("names") || "")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
      if (!names.length) return showToast("Pega al menos un participante.");
      const payloadBase = {
        group: form.get("group"),
        diaria: form.get("diaria") === "on",
        semanal: form.get("semanal") === "on",
        mensual: form.get("mensual") === "on",
      };
      let latestData = null;
      for (const name of names) {
        const response = await fetch("/api/admin/registry", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, ...payloadBase }),
        });
        const data = await response.json();
        if (!response.ok) return showToast(data.detail || data.error || `No se pudo guardar ${name}.`);
        latestData = data;
      }
      if (latestData) {
        state.data = latestData;
        render();
        showToast(`Se guardaron ${names.length} participantes.`);
      }
    });

    body.querySelector("#registryBulkDeleteForm").addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const names = String(form.get("names") || "")
        .split(/\r?\n/)
        .map((item) => item.trim())
        .filter(Boolean);
      if (!names.length) return showToast("Pega al menos un participante para eliminar.");
      if (!window.confirm(`Eliminar ${names.length} participantes del padron?`)) return;
      const response = await fetch("/api/admin/registry/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ names }),
      });
      const data = await response.json();
      if (!response.ok) return showToast(data.detail || data.error || "No se pudo completar la eliminacion masiva.");
      state.data = data;
      render();
      showToast(`Se eliminaron ${names.length} participantes solicitados.`);
    });
    body.querySelector("#registryGroupFilter")?.addEventListener("change", (event) => {
      state.adminRegistryFilterGroup = event.currentTarget.value || "";
      render();
    });
    const registryGroupFilter = body.querySelector("#registryGroupFilter");
    if (registryGroupFilter) registryGroupFilter.value = state.adminRegistryFilterGroup || "";

    body.querySelector("#cancelRegistryEdit")?.addEventListener("click", () => {
      state.adminRegistryEdit = null;
      render();
    });
    body.querySelector("#cancelRegistryGroupEdit")?.addEventListener("click", () => {
      state.adminRegistryGroupEdit = null;
      render();
    });
    body.querySelectorAll("[data-edit-registry]").forEach((button) => {
      button.addEventListener("click", () => {
        state.adminRegistryEdit = button.dataset.editRegistry;
        render();
      });
    });
    body.querySelectorAll("[data-delete-registry]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!window.confirm(`Eliminar a ${button.dataset.deleteRegistry} del padron?`)) return;
        const response = await fetch(`/api/admin/registry/${encodeURIComponent(button.dataset.deleteRegistry)}`, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok) return showToast(data.detail || data.error || "No se pudo eliminar el participante.");
        state.data = data;
        if (state.adminRegistryEdit === button.dataset.deleteRegistry) state.adminRegistryEdit = null;
        render();
        showToast("Participante eliminado.");
      });
    });
    body.querySelectorAll("[data-edit-registry-group]").forEach((button) => {
      button.addEventListener("click", () => {
        state.adminRegistryGroupEdit = button.dataset.editRegistryGroup;
        render();
      });
    });
    body.querySelectorAll("[data-delete-registry-group]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!window.confirm(`Eliminar el grupo ${button.dataset.deleteRegistryGroup}? Los participantes quedaran sin grupo.`)) return;
        const response = await fetch(`/api/admin/registry-groups/${encodeURIComponent(button.dataset.deleteRegistryGroup)}`, { method: "DELETE" });
        const data = await response.json();
        if (!response.ok) return showToast(data.detail || data.error || "No se pudo eliminar el grupo.");
        state.data = data;
        if (state.adminRegistryGroupEdit === button.dataset.deleteRegistryGroup) state.adminRegistryGroupEdit = null;
        render();
        showToast("Grupo eliminado.");
      });
    });
  }

  if (state.adminTab === "calendar") {
    const calendarReferenceDate = state.resultOperationDate || state.prizesFilterDate || state.campaignFilterDate || toLocalDateInputValue();
    body.innerHTML = renderCalendarAdminPanel(calendarReferenceDate);
    body.querySelector("#calendarTrackFilter")?.addEventListener("change", (event) => {
      state.adminCalendarTrack = event.currentTarget.value || CALENDAR_TRACKS[0].id;
      render();
    });
    body.querySelector("#calendarMonthFilter")?.addEventListener("change", (event) => {
      state.adminCalendarMonth = event.currentTarget.value || "";
      render();
    });
  }

  if (state.adminTab === "programs") {
    body.innerHTML = renderProgramAdminPanel();
    body.querySelector('#programForm input[name="date"]')?.addEventListener("change", (event) => {
      state.adminProgramDate = event.currentTarget.value || "";
      render();
    });
    body.querySelector('#programForm select[name="trackId"]')?.addEventListener("change", (event) => {
      state.adminProgramTrack = event.currentTarget.value || CALENDAR_TRACKS[0].id;
      render();
    });
    body.querySelector("#programForm")?.addEventListener("submit", async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const date = String(form.get("date") || "").trim();
      const trackId = String(form.get("trackId") || "").trim();
      const trackMeta = getCalendarTrackMeta(trackId);
      const races = parseProgramBulkEntries(form.get("bulkProgram"));
      if (!date || !trackId) return showToast("Define fecha e hipodromo para el programa.");
      if (!Object.keys(races).length) return showToast("Pega al menos una linea valida del programa.");
      const response = await fetch("/api/programs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          trackId,
          trackName: trackMeta.label,
          source: "manual",
          status: "manual",
          races,
        }),
      });
      const data = await response.json();
      if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el programa.");
      state.data = data;
      state.adminProgramDate = date;
      state.adminProgramTrack = trackId;
      render();
      showToast("Programa de carreras guardado.");
    });
    body.querySelector("#importProgramTeletrakButton")?.addEventListener("click", async () => {
      const date = state.adminProgramDate || body.querySelector('#programForm input[name="date"]')?.value || "";
      const trackId = state.adminProgramTrack || body.querySelector('#programForm select[name="trackId"]')?.value || CALENDAR_TRACKS[0].id;
      if (!date || !trackId) return showToast("Define fecha e hipodromo para importar.");
      const response = await fetch("/api/import/teletrak/program", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, trackId }),
      });
      const data = await response.json();
      if (!response.ok) return showToast(data.detail || data.error || "No se pudo importar el programa.");
      state.data = data;
      state.adminProgramDate = date;
      state.adminProgramTrack = trackId;
      render();
      showToast("Programa importado desde Teletrak.");
    });
    body.querySelector("#deleteProgramButton")?.addEventListener("click", async () => {
      const date = state.adminProgramDate || toLocalDateInputValue();
      const trackId = state.adminProgramTrack || CALENDAR_TRACKS[0].id;
      if (!window.confirm(`Eliminar el programa ${date} · ${getCalendarTrackMeta(trackId).label}?`)) return;
      const response = await fetch(`/api/programs/${encodeURIComponent(date)}/${encodeURIComponent(trackId)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) return showToast(data.detail || data.error || "No se pudo eliminar el programa.");
      state.data = data;
      render();
      showToast("Programa eliminado.");
    });
  }

  if (state.adminTab === "prizes") {
    const prizeSettings = state.data.settings.prizes || {};
    const prizeReferenceDate = state.prizesFilterDate || toLocalDateInputValue();
    const showInactivePrizes = state.prizesShowInactive === true;
    const countsByKind = ["daily", "weekly", "monthly"].reduce((acc, kind) => {
      const allCampaigns = getCampaigns(kind);
      const activeCount = allCampaigns.filter((campaign) => getCampaignDisplayStatus(kind, campaign, prizeReferenceDate) === "Activa").length;
      acc.active += activeCount;
      acc.total += allCampaigns.length;
      return acc;
    }, { active: 0, total: 0 });
    const prizeToolbar = `<div class="toolbar"><div class="field" style="min-width:220px"><label>Fecha a revisar</label><input id="prizesFilterDate" type="date" value="${prizeReferenceDate}" /></div><label class="check-chip"><input type="checkbox" id="prizesShowInactive"${showInactivePrizes ? " checked" : ""} /> Mostrar inactivas/vencidas</label><span class="hint">El filtro toma la fecha elegida y muestra solo activas, salvo que actives el historial.</span><div class="toolbar-group"><span class="label">${countsByKind.active} activas</span><span class="label">${countsByKind.total} total</span></div></div>`;
    body.innerHTML = `<section class="panel"><div class="panel-head"><h3>Premios por campana</h3><p>Aqui configuras y revisas el pozo directamente dentro de cada campana. Participacion, administracion y reparto viven en el mismo bloque para que no quede separado de la operacion real.</p></div>${prizeToolbar}${renderPrizeCampaignSection("daily", prizeReferenceDate, showInactivePrizes, prizeSettings)}${renderPrizeCampaignSection("weekly", prizeReferenceDate, showInactivePrizes, prizeSettings)}${renderPrizeCampaignSection("monthly", prizeReferenceDate, showInactivePrizes, prizeSettings)}</section>`;
    body.querySelector("#prizesFilterDate")?.addEventListener("change", (event) => {
      state.prizesFilterDate = event.currentTarget.value || "";
      render();
    });
    body.querySelector("#prizesShowInactive")?.addEventListener("change", (event) => {
      state.prizesShowInactive = event.currentTarget.checked;
      render();
    });
    body.querySelectorAll("[data-campaign-prize-form]").forEach((formElement) => {
      formElement.addEventListener("submit", (event) => {
        const form = new FormData(event.currentTarget);
        const kind = event.currentTarget.dataset.campaignPrizeForm;
        const campaignId = event.currentTarget.dataset.campaignId;
        const currentCampaign = getCampaigns(kind).find((item) => item.id === campaignId);
        if (!currentCampaign) {
          event.preventDefault();
          return showToast("No se encontro la campana para guardar el reparto.");
        }
        const adminPct = Number(form.get("adminPct") || 0);
        const firstPct = Number(form.get("firstPct") || 0);
        const secondPct = Number(form.get("secondPct") || 0);
        const thirdPct = Number(form.get("thirdPct") || 0);
        if ([adminPct, firstPct, secondPct, thirdPct].some((value) => value < 0 || value > 100)) {
          event.preventDefault();
          return showToast("Los porcentajes deben quedar entre 0 y 100.");
        }
        if (firstPct + secondPct + thirdPct > 100) {
          event.preventDefault();
          return showToast("La suma de 1°, 2° y 3° no puede superar el 100% del pozo neto.");
        }
        saveSettings(event, {
          campaigns: {
            [kind]: upsertCampaign(kind, {
              ...currentCampaign,
              payout: {
                adminPct,
                firstPct,
                secondPct,
                thirdPct,
              },
            }),
          },
        }, "Reparto de premios guardado.");
      });
    });
  }

  if (state.adminTab === "daily") {
    body.innerHTML = `<section class="panel"><div class="panel-head"><h3>Configuracion diaria</h3><p>Comportamiento base de la vista diaria.</p></div><form id="dailySettingsForm" class="editor-form"><div class="field"><label>Vista inicial</label><select name="defaultView"><option value="actual"${state.data.settings.daily.defaultView === "actual" ? " selected" : ""}>Ultima jornada</option><option value="ranking"${state.data.settings.daily.defaultView === "ranking" ? " selected" : ""}>Ranking</option></select></div><div class="actions"><span class="hint">La diaria puede abrir mostrando la ultima jornada o directo al ranking.</span><button class="primary-button" type="submit">Guardar diaria</button></div></form></section>`;
    body.querySelector("#dailySettingsForm").addEventListener("submit", (event) => saveSettings(event, { daily: { defaultView: new FormData(event.currentTarget).get("defaultView") } }, "Configuracion diaria guardada."));
  }

  if (state.adminTab === "campaigns") {
    const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
    const campaignsTabNav = `<section class="panel"><div class="panel-head"><h3>Fuente base del sistema</h3><p>Define si la app parte o no desde los Excel.</p></div><form id="excelBaseForm" class="editor-form"><div class="check-grid"><label class="check-chip"><input type="checkbox" name="useExcelBase"${state.data.settings.excel.useExcelBase ? " checked" : ""} /> Usar Excel base</label></div><div class="actions"><span class="hint">Si esta activo, la app lee primero los Excel y encima aplica lo cargado en la web. Si lo apagas, trabaja solo con lo cargado aqui.</span><button class="primary-button" type="submit">Guardar fuente base</button></div></form></section><section class="panel"><div class="toolbar"><div><p class="label">Tipo de campana</p><div class="toolbar-group" id="campaignTabs"></div></div></div></section>`;
    const registryGroupOptions = `<option value="">Todos los participantes</option>${getRegistryGroupOptions().map((group) => `<option value="${group.id}">${group.name}</option>`).join("")}`;
    const competitionFields = renderCompetitionModeFields();
    const dailySection = `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Campana diaria</h3><p>Una jornada puntual.</p></div><form id="dailyCampaignForm" class="editor-form"><div class="field"><label>Nombre</label><input name="name" type="text" placeholder="Ej. Diaria martes 08" /></div><div class="field"><label>Fecha</label><input name="date" type="date" /></div><div class="form-grid"><div class="field"><label>Grupo asociado</label><select name="groupId">${registryGroupOptions}</select></div><div class="field"><label>Valor de campana</label><input name="entryValue" type="number" min="0" step="100" value="0" /></div></div><div class="field"><label>Carreras del dia</label><input name="raceCount" type="number" min="1" max="30" value="12" /></div>${competitionFields}${renderScoringFields()}<div class="actions"><span class="hint">Puedes dejar una diaria general o amarrarla a un grupo especifico del padron.</span><button class="primary-button" type="submit">Guardar diaria</button></div></form></section><section class="panel"><div class="panel-head"><h3>Campanas diarias creadas</h3><p>Estado, limpieza y borrado.</p></div>${renderCampaignAdminList("daily", getCampaigns("daily"))}</section></section>`;
    const weeklySection = `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Configuracion semanal + campana</h3><p>Todo lo semanal queda aqui.</p></div><form id="weeklyCampaignForm" class="editor-form"><div class="field"><label>Nombre</label><input name="name" type="text" placeholder="Ej. Semanal 06 al 11" /></div><div class="form-grid"><div class="field"><label>Grupo asociado</label><select name="groupId">${registryGroupOptions}</select></div><div class="field"><label>Valor de campana</label><input name="entryValue" type="number" min="0" step="100" value="0" /></div></div><div class="field"><label>Formato</label><select name="format">${getCompetitionModeOptions().map(([value, label]) => `<option value="${value}"${(state.data.settings.weekly.format || "round-robin") === value ? " selected" : ""}>${label}</option>`).join("")}</select></div><div><p class="label">Dias que se juegan</p><div class="check-grid days">${days.map((day) => `<label class="check-chip"><input type="checkbox" name="activeDays" value="${day}"${state.data.settings.weekly.activeDays.includes(day) ? " checked" : ""} /> ${day}</label>`).join("")}</div></div><div><p class="label">Dias de final</p><div class="check-grid days">${days.map((day) => `<label class="check-chip"><input type="checkbox" name="finalDays" value="${day}"${safeArray(state.data.settings.weekly.finalDays).includes(day) ? " checked" : ""} /> ${day}</label>`).join("")}</div></div><div class="form-grid"><div class="field"><label>Inicio</label><input name="startDate" type="date" /></div><div class="field"><label>Termino</label><input name="endDate" type="date" /></div></div><div class="form-grid"><div class="field"><label>Tamano de grupo</label><input name="groupSize" type="number" min="2" value="${state.data.settings.weekly.groupSize}" /></div><div class="field"><label>Clasifican por grupo</label><input name="qualifiersPerGroup" type="number" min="1" value="${state.data.settings.weekly.qualifiersPerGroup}" /></div></div><div class="form-grid"><div class="field"><label>Carreras por jornada</label><input name="raceCount" type="number" min="1" max="30" value="12" /></div></div>${competitionFields}${renderScoringFields()}<div class="check-grid"><label class="check-chip"><input type="checkbox" name="pairMode"${state.data.settings.weekly.pairMode ? " checked" : ""} /> Modo parejas</label><label class="check-chip"><input type="checkbox" name="showTotalsByDefault"${state.data.settings.weekly.showTotalsByDefault ? " checked" : ""} /> Abrir en total</label></div><div><p class="label">Jornadas del Excel (opcional)</p><div class="check-grid days">${state.data.semanal.events.map((event) => `<label class="check-chip"><input type="checkbox" name="eventIds" value="${event.id}" /> ${event.sheetName}</label>`).join("")}</div></div><div class="actions"><span class="hint">La campana semanal puede trabajar con grupo propio, valor y modalidad competitiva.</span><button class="primary-button" type="submit">Guardar semanal</button></div></form></section><section class="panel"><div class="panel-head"><h3>Campanas semanales creadas</h3><p>Estado, limpieza y borrado.</p></div>${renderCampaignAdminList("weekly", getCampaigns("weekly"))}</section></section>`;
    const monthlySection = `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Configuracion mensual + campana</h3><p>Hipodromos, fechas y jornadas.</p></div><form id="monthlyCampaignForm" class="editor-form"><div class="field"><label>Nombre</label><input name="name" type="text" placeholder="Ej. Mensual Club Hipico abril" /></div><div class="form-grid"><div class="field"><label>Grupo asociado</label><select name="groupId">${registryGroupOptions}</select></div><div class="field"><label>Valor de campana</label><input name="entryValue" type="number" min="0" step="100" value="0" /></div></div><div><p class="label">Hipodromos</p><div class="check-grid">${["Club Hipico", "Hipodromo Chile", "Sporting", "Concepcion"].map((item) => `<label class="check-chip"><input type="checkbox" name="hipodromos" value="${item}"${safeArray(state.data.settings.monthly.hipodromos).includes(item) ? " checked" : ""} /> ${item}</label>`).join("")}</div></div><div class="form-grid"><div class="field"><label>Inicio</label><input name="startDate" type="date" value="${state.data.settings.monthly.startDate || ""}" /></div><div class="field"><label>Termino</label><input name="endDate" type="date" value="${state.data.settings.monthly.endDate || ""}" /></div></div><div class="form-grid"><div class="field"><label>Carreras por jornada</label><input name="raceCount" type="number" min="1" max="30" value="12" /></div></div>${competitionFields}${renderScoringFields()}<div class="check-grid"><label class="check-chip"><input type="checkbox" name="showTotalsByDefault"${state.data.settings.monthly.showTotalsByDefault ? " checked" : ""} /> Abrir en total</label></div><div><p class="label">Jornadas del Excel (opcional)</p><div class="check-grid days">${state.data.mensual.events.map((event) => `<label class="check-chip"><input type="checkbox" name="eventIds" value="${event.id}"${safeArray(state.data.settings.monthly.selectedEventIds).includes(event.id) ? " checked" : ""} /> ${event.sheetName}</label>`).join("")}</div></div><div class="actions"><span class="hint">La mensual tambien puede quedar amarrada a un grupo del padron y usar puntos o dividendos.</span><button class="primary-button" type="submit">Guardar mensual</button></div></form></section><section class="panel"><div class="panel-head"><h3>Campanas mensuales creadas</h3><p>Estado, limpieza y borrado.</p></div>${renderCampaignAdminList("monthly", getCampaigns("monthly"))}</section></section>`;
    body.innerHTML = campaignsTabNav + (state.campaignsTab === "daily" ? dailySection : state.campaignsTab === "weekly" ? weeklySection : monthlySection);

    body.querySelector("#excelBaseForm").addEventListener("submit", (event) => {
      const form = new FormData(event.currentTarget);
      saveSettings(event, { excel: { useExcelBase: form.get("useExcelBase") === "on" } }, "Fuente base guardada.");
    });

    const campaignTabs = body.querySelector("#campaignTabs");
    [
      ["daily", "Diaria"],
      ["weekly", "Semanal"],
      ["monthly", "Mensual"],
    ].forEach(([id, label]) => {
      const button = document.createElement("button");
      button.className = `subnav-button${state.campaignsTab === id ? " active" : ""}`;
      button.textContent = label;
      button.addEventListener("click", () => {
        state.campaignsTab = id;
        render();
      });
      campaignTabs.appendChild(button);
    });

    bindScoringFieldVisibility(body.querySelector("#dailyCampaignForm"));
    bindScoringFieldVisibility(body.querySelector("#weeklyCampaignForm"));
    bindScoringFieldVisibility(body.querySelector("#monthlyCampaignForm"));

    body.querySelector("#dailyCampaignForm")?.addEventListener("submit", (event) => {
      const form = new FormData(event.currentTarget);
      const campaigns = getCampaigns("daily");
      const campaignId = `daily-${Date.now()}`;
      saveSettings(
        event,
        {
          campaigns: {
            daily: [
              ...campaigns,
              {
                id: campaignId,
                name: String(form.get("name") || "").trim(),
                date: form.get("date"),
                groupId: String(form.get("groupId") || "").trim(),
                entryValue: Number(form.get("entryValue")) || 0,
                competitionMode: String(form.get("competitionMode") || "individual"),
                qualifiersCount: Number(form.get("qualifiersCount")) || 0,
                qualifiersPerGroup: Number(form.get("qualifiersPerGroup")) || 0,
                eliminatePerDay: Number(form.get("eliminatePerDay")) || 0,
                raceCount: Number(form.get("raceCount")) || 12,
                enabled: true,
                scoring: readScoringFromForm(form),
                eventId: `campaign-${campaignId}`,
                eventName: String(form.get("date") || "").trim() || String(form.get("name") || "").trim(),
              },
            ],
          },
        },
        "Campana diaria guardada.",
      );
    });

    body.querySelector("#weeklyCampaignForm")?.addEventListener("submit", (event) => {
      const form = new FormData(event.currentTarget);
      const campaignId = `weekly-${Date.now()}`;
      const activeDays = form.getAll("activeDays");
      const selectedEventIds = form.getAll("eventIds");
      const eventIds = selectedEventIds.length ? selectedEventIds : activeDays.map((day) => `${campaignId}-${normalizeIdPart(day)}`);
      const eventNames = selectedEventIds.length
        ? state.data.semanal.events.filter((item) => eventIds.includes(item.id)).map((item) => item.sheetName)
        : activeDays;
      saveSettings(
        event,
        {
          weekly: {
            format: form.get("format"),
            activeDays,
            finalDays: form.getAll("finalDays"),
            groupSize: Number(form.get("groupSize")),
            qualifiersPerGroup: Number(form.get("qualifiersPerGroup")),
            pairMode: form.get("pairMode") === "on",
            showTotalsByDefault: form.get("showTotalsByDefault") === "on",
          },
          campaigns: {
            weekly: [
              ...getCampaigns("weekly"),
              {
                id: campaignId,
                name: String(form.get("name") || "").trim(),
                groupId: String(form.get("groupId") || "").trim(),
                entryValue: Number(form.get("entryValue")) || 0,
                startDate: form.get("startDate"),
                endDate: form.get("endDate"),
                competitionMode: String(form.get("competitionMode") || form.get("format") || "round-robin"),
                raceCount: Number(form.get("raceCount")) || 12,
                enabled: true,
                scoring: readScoringFromForm(form),
                activeDays,
                finalDays: form.getAll("finalDays"),
                qualifiersCount: Number(form.get("qualifiersCount")) || 0,
                qualifiersPerGroup: Number(form.get("qualifiersPerGroup")) || 0,
                eliminatePerDay: Number(form.get("eliminatePerDay")) || 0,
                eventIds,
                eventNames,
              },
            ],
          },
        },
        "Campana semanal guardada.",
      );
    });

    body.querySelector("#monthlyCampaignForm")?.addEventListener("submit", (event) => {
      const form = new FormData(event.currentTarget);
      const campaignId = `monthly-${Date.now()}`;
      const selectedEventIds = form.getAll("eventIds");
      const eventIds = selectedEventIds.length ? selectedEventIds : [`${campaignId}-general`];
      const eventNames = selectedEventIds.length
        ? state.data.mensual.events.filter((item) => eventIds.includes(item.id)).map((item) => item.sheetName)
        : [String(form.get("name") || "").trim() || "General"];
      saveSettings(
        event,
        {
          monthly: {
            hipodromos: form.getAll("hipodromos"),
            startDate: form.get("startDate"),
            endDate: form.get("endDate"),
            selectedEventIds: eventIds,
            showTotalsByDefault: form.get("showTotalsByDefault") === "on",
          },
          campaigns: {
            monthly: [
              ...getCampaigns("monthly"),
              {
                id: campaignId,
                name: String(form.get("name") || "").trim(),
                groupId: String(form.get("groupId") || "").trim(),
                entryValue: Number(form.get("entryValue")) || 0,
                hipodromos: form.getAll("hipodromos"),
                startDate: form.get("startDate"),
                endDate: form.get("endDate"),
                competitionMode: String(form.get("competitionMode") || "individual"),
                qualifiersCount: Number(form.get("qualifiersCount")) || 0,
                qualifiersPerGroup: Number(form.get("qualifiersPerGroup")) || 0,
                eliminatePerDay: Number(form.get("eliminatePerDay")) || 0,
                raceCount: Number(form.get("raceCount")) || 12,
                enabled: true,
                scoring: readScoringFromForm(form),
                eventIds,
                eventNames,
              },
            ],
          },
        },
        "Campana mensual guardada.",
      );
    });

    body.querySelectorAll("[data-campaign-action]").forEach((button) => {
      button.addEventListener("click", () => {
        applyCampaignAction(button.dataset.campaignKind, button.dataset.campaignId, button.dataset.campaignAction);
      });
    });
  }

  if (state.adminTab === "forecasts" || state.adminTab === "results") {
    const isResultsTab = state.adminTab === "results";
    let event = null;
    let selectedProgramTrackId = "";
    let selectedProgram = null;
    if (isResultsTab) {
      const sources = getOperationSources();
      const source = getPreferredOperationSource(sources, state.adminTargetSelections.operationDate || toLocalDateInputValue(), state.adminTab);
      const operationDate = state.adminTargetSelections.operationDate || toLocalDateInputValue();
      event = getOperationEventForDate(source, operationDate);
      if (!state.adminOpsEventId || !sources.some((item) => item.primaryEventId === state.adminOpsEventId)) {
        state.adminOpsEventId = source?.primaryEventId || null;
        state.adminOpsManualSelection = false;
      }
      body.innerHTML = `<section class="panel"><div class="panel-head"><h3>Resultados</h3><p>Aqui registras resultados, empates, retiros y dividendos por carrera.</p></div><div class="toolbar"><div class="toolbar-group"><button class="subnav-button${state.adminOpsMode === "semanal" ? " active" : ""}" data-ops-mode="semanal">Diaria / Semanal</button><button class="subnav-button${state.adminOpsMode === "mensual" ? " active" : ""}" data-ops-mode="mensual">Mensual</button></div><div class="field" style="min-width:320px"><label>Campana operativa</label><select id="adminOpsEventSelect">${sources.map((item) => `<option value="${item.primaryEventId}"${item.primaryEventId === source?.primaryEventId ? " selected" : ""}>${item.label}</option>`).join("")}</select></div></div></section><section class="panel"><div class="panel-head"><h3>Carga de resultados</h3><p>Formulario claro por posicion, con tabla de resultados guardados al pie.</p></div><div id="adminOpsForms" class="stack"></div></section>`;
      body.querySelectorAll("[data-ops-mode]").forEach((button) => {
        button.addEventListener("click", () => {
          state.adminOpsMode = button.dataset.opsMode;
          state.adminOpsEventId = null;
          state.adminOpsManualSelection = false;
          render();
        });
      });
      body.querySelector("#adminOpsEventSelect").addEventListener("change", (eventChange) => {
        state.adminOpsEventId = eventChange.target.value;
        state.adminOpsManualSelection = true;
        render();
      });
    } else {
      const operationDate = state.adminTargetSelections.operationDate || toLocalDateInputValue();
      const selectedGroupId = state.adminTargetSelections.groupId || "";
      const snapshot = getForecastSelectionSnapshot(operationDate, selectedGroupId);
      const context = getForecastOperationEvent(operationDate, selectedGroupId);
      selectedProgramTrackId = getResolvedProgramTrackId(operationDate, state.adminTargetSelections.programTrackId || "");
      selectedProgram = getProgramForDateTrack(operationDate, selectedProgramTrackId);
      event = context.event;
      state.adminOpsEventId = event?.id || null;
      body.innerHTML = `<section class="panel"><div class="panel-head"><h3>Pronostico</h3><p>Aqui registras pronosticos usando fecha y grupo. Solo se muestran campañas vigentes para esa fecha.</p></div><div class="stack"><div class="result-metrics"><article><span>Campañas visibles</span><strong>${snapshot.matches.length}</strong></article><article><span>Grupo resuelto</span><strong>${snapshot.resolvedGroupId === null ? "Elegir grupo" : snapshot.resolvedGroupId ? getRegistryGroupLabel(snapshot.resolvedGroupId) : "Todos"}</strong></article><article><span>Roster disponible</span><strong>${snapshot.roster.length}</strong></article></div>${snapshot.matches.length ? `<div class="check-grid">${snapshot.matches.map((match) => `<span class="check-chip wide">${match.campaignKind === "daily" ? "Diaria" : match.campaignKind === "weekly" ? "Semanal" : "Mensual"} · ${match.campaign?.name || match.label}${match.groupId ? ` · ${getRegistryGroupLabel(match.groupId)}` : ""}</span>`).join("")}</div>` : '<p class="hint">No hay campañas vigentes para esa fecha y grupo.</p>'}${snapshot.warnings.length ? `<p class="hint">${snapshot.warnings.join(" ")}</p>` : '<p class="hint">El roster sale del grupo elegido o del grupo comun de las campañas visibles.</p>'}</div></section><section class="panel"><div class="panel-head"><h3>Carga de pronosticos</h3><p>Formulario de picks para la jornada representativa de las campañas visibles.</p></div><div id="adminOpsForms" class="stack"></div></section>`;
    }
    const holder = body.querySelector("#adminOpsForms");
    if (!event) {
      holder.innerHTML = isResultsTab
        ? `<section class="panel"><div class="panel-head"><h3>Sin campanas para operar</h3><p>No hay jornadas disponibles para la fecha seleccionada.</p></div></section>`
        : `${renderForecastOperationTargets(
            state.adminTargetSelections.operationDate || toLocalDateInputValue(),
            state.adminTargetSelections.groupId || "",
            getForecastSelectionSnapshot(
              state.adminTargetSelections.operationDate || toLocalDateInputValue(),
              state.adminTargetSelections.groupId || "",
            ),
          )}<section class="panel"><div class="panel-head"><h3>Sin campanas para operar</h3><p>Primero crea una campana en Administrador > Campanas o cambia fecha/grupo. Luego aqui podras cargar pronosticos.</p></div></section>`;
      return;
    }
    holder.innerHTML = isResultsTab
      ? renderResultsForm(event)
      : `${renderForecastFormAdminDouble(event)}${renderPicksTable(event, "Pronosticos registrados", "Puedes revisar lo cargado y editar un stud puntual desde aqui.", { program: selectedProgram, programTrackId: selectedProgramTrackId })}`;
    if (isResultsTab) bindEventForms(holder, event);
    else bindForecastFormAdminDouble(holder, event);
  }

  if (state.adminTab === "weekly") {
    const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
    body.innerHTML = `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Configuracion semanal</h3><p>Formato, dias, finales y parejas.</p></div><form id="weeklySettingsForm" class="editor-form"><div class="field"><label>Formato</label><select name="format"><option value="todos-contra-todos"${state.data.settings.weekly.format === "todos-contra-todos" ? " selected" : ""}>Todos contra todos</option><option value="todos-contra-todos-final"${state.data.settings.weekly.format === "todos-contra-todos-final" ? " selected" : ""}>Todos contra todos con final</option><option value="grupos"${state.data.settings.weekly.format === "grupos" ? " selected" : ""}>Grupos</option><option value="parejas"${state.data.settings.weekly.format === "parejas" ? " selected" : ""}>Parejas</option></select></div><div><p class="label">Dias que se juegan</p><div class="check-grid days">${days.map((day) => `<label class="check-chip"><input type="checkbox" name="activeDays" value="${day}"${state.data.settings.weekly.activeDays.includes(day) ? " checked" : ""} /> ${day}</label>`).join("")}</div></div><div><p class="label">Dias de final</p><div class="check-grid days">${days.map((day) => `<label class="check-chip"><input type="checkbox" name="finalDays" value="${day}"${safeArray(state.data.settings.weekly.finalDays).includes(day) ? " checked" : ""} /> ${day}</label>`).join("")}</div></div><div class="form-grid"><div class="field"><label>Tamano de grupo</label><input name="groupSize" type="number" min="2" value="${state.data.settings.weekly.groupSize}" /></div><div class="field"><label>Clasifican por grupo</label><input name="qualifiersPerGroup" type="number" min="1" value="${state.data.settings.weekly.qualifiersPerGroup}" /></div></div><div class="check-grid"><label class="check-chip"><input type="checkbox" name="pairMode"${state.data.settings.weekly.pairMode ? " checked" : ""} /> Modo parejas</label><label class="check-chip"><input type="checkbox" name="showTotalsByDefault"${state.data.settings.weekly.showTotalsByDefault ? " checked" : ""} /> Abrir en total</label></div><div class="actions"><span class="hint">Aqui puedes armar semanas de lunes a viernes, lunes a sabado, con final o en grupos.</span><button class="primary-button" type="submit">Guardar semanal</button></div></form></section><section class="panel"><div class="panel-head"><h3>Resumen activo</h3><p>Lo que esta configurado ahora.</p></div><ul class="list"><li><span>Formato</span><strong>${state.data.settings.weekly.format}</strong></li><li><span>Dias activos</span><strong>${state.data.settings.weekly.activeDays.join(", ") || "-"}</strong></li><li><span>Finales</span><strong>${safeArray(state.data.settings.weekly.finalDays).join(", ") || "-"}</strong></li><li><span>Modo</span><strong>${state.data.settings.weekly.pairMode ? "Parejas" : "Individual"}</strong></li></ul></section></section>`;
    body.querySelector("#weeklySettingsForm").addEventListener("submit", (event) => {
      const form = new FormData(event.currentTarget);
      saveSettings(event, { weekly: { format: form.get("format"), activeDays: form.getAll("activeDays"), finalDays: form.getAll("finalDays"), groupSize: Number(form.get("groupSize")), qualifiersPerGroup: Number(form.get("qualifiersPerGroup")), pairMode: form.get("pairMode") === "on", showTotalsByDefault: form.get("showTotalsByDefault") === "on" } }, "Configuracion semanal guardada.");
    });
  }

  if (state.adminTab === "monthly") {
    const hipodromos = ["Club Hipico", "Hipodromo Chile", "Sporting", "Concepcion"];
    body.innerHTML = `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Configuracion mensual</h3><p>Hipodromos, fechas y jornadas incluidas.</p></div><form id="monthlySettingsForm" class="editor-form"><div><p class="label">Hipodromos</p><div class="check-grid">${hipodromos.map((item) => `<label class="check-chip"><input type="checkbox" name="hipodromos" value="${item}"${safeArray(state.data.settings.monthly.hipodromos).includes(item) ? " checked" : ""} /> ${item}</label>`).join("")}</div></div><div class="form-grid"><div class="field"><label>Fecha inicio</label><input name="startDate" type="date" value="${state.data.settings.monthly.startDate || ""}" /></div><div class="field"><label>Fecha termino</label><input name="endDate" type="date" value="${state.data.settings.monthly.endDate || ""}" /></div></div><div><p class="label">Jornadas incluidas</p><div class="check-grid days">${state.data.mensual.events.map((event) => `<label class="check-chip"><input type="checkbox" name="selectedEventIds" value="${event.id}"${safeArray(state.data.settings.monthly.selectedEventIds).includes(event.id) ? " checked" : ""} /> ${event.sheetName}</label>`).join("")}</div></div><div class="check-grid"><label class="check-chip"><input type="checkbox" name="showTotalsByDefault"${state.data.settings.monthly.showTotalsByDefault ? " checked" : ""} /> Abrir en total</label></div><div class="actions"><span class="hint">La mensual puede filtrarse por hipodromo, fechas y jornadas concretas.</span><button class="primary-button" type="submit">Guardar mensual</button></div></form></section><section class="panel"><div class="panel-head"><h3>Clave local</h3><p>Acceso a administrador.</p></div><form id="pinForm" class="editor-form"><div class="field"><label>Clave administrador</label><input name="adminPin" type="password" value="${state.data.settings.adminPin || ""}" /></div><div class="actions"><span class="hint">Esta clave es local para esta app. Valor inicial: 1234.</span><button class="primary-button" type="submit">Guardar clave</button></div></form></section></section>`;
    body.querySelector("#monthlySettingsForm").addEventListener("submit", (event) => {
      const form = new FormData(event.currentTarget);
      saveSettings(event, { monthly: { hipodromos: form.getAll("hipodromos"), startDate: form.get("startDate"), endDate: form.get("endDate"), selectedEventIds: form.getAll("selectedEventIds"), showTotalsByDefault: form.get("showTotalsByDefault") === "on" } }, "Configuracion mensual guardada.");
    });
    body.querySelector("#pinForm").addEventListener("submit", (event) => {
      const form = new FormData(event.currentTarget);
      saveSettings(event, { adminPin: String(form.get("adminPin") || "") }, "Clave de administrador guardada.");
    });
  }

  if (state.adminTab === "automation") {
    const toteSettings = state.data.settings.toteletras;
    const automationSettings = getAutomationSettings();
    const automationDate = automationSettings.filterDate || toLocalDateInputValue();
    const registryGroupOptions = `<option value="">Todos los grupos</option>${getRegistryGroupOptions().map((group) => `<option value="${group.id}"${group.id === automationSettings.groupId ? " selected" : ""}>${group.name}</option>`).join("")}`;
    const captureCards = renderAutomationCaptureCards(automationDate, automationSettings.groupId, automationSettings);
    const capturePreview = renderAutomationPreviewPanel(automationDate, automationSettings.groupId, automationSettings.selectedCaptureKeys, automationSettings);
    body.innerHTML = `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Cola de capturas para WhatsApp</h3><p>Aqui filtras por grupo y tipo de polla para decidir que imagenes preparar o enviar.</p></div><form id="automationFilterForm" class="editor-form"><div class="form-grid"><div class="field"><label>Fecha operativa</label><input name="filterDate" type="date" value="${automationDate}" /></div><div class="field"><label>Grupo</label><select name="groupId">${registryGroupOptions}</select></div></div><div><p class="label">Tipos incluidos</p><div class="check-grid"><label class="check-chip"><input type="checkbox" name="includeDaily"${automationSettings.includeDaily ? " checked" : ""} /> Diaria</label><label class="check-chip"><input type="checkbox" name="includeWeekly"${automationSettings.includeWeekly ? " checked" : ""} /> Semanal</label><label class="check-chip"><input type="checkbox" name="includeMonthly"${automationSettings.includeMonthly ? " checked" : ""} /> Mensual</label></div></div><div class="actions"><span class="hint">La cola se recalcula con campanas activas para esa fecha. El filtro de grupo sirve para mandar solo lo que corresponde a ese grupo de participantes.</span><button class="primary-button" type="submit">Guardar filtro</button></div></form></section><section class="panel"><div class="panel-head"><h3>Piezas que vamos a enviar</h3><p>El objetivo es que lleguen completas, claras y listas para el grupo.</p></div><ul class="list"><li><span>Pronosticos + banner</span><strong>Diaria, semanal y mensual por jornada</strong></li><li><span>Ranking jornada</span><strong>Diaria, semanal y mensual</strong></li><li><span>Ranking total</span><strong>Semanal y mensual</strong></li><li><span>Resultados</span><strong>Por jornada activa</strong></li></ul><p class="hint">Ahora la exportacion se arma desde contenido real y sale como PNG completo.</p></section></section>${captureCards}<div id="automationPreviewMount">${capturePreview}</div><section class="grid-2"><section class="panel"><div class="panel-head"><h3>Tema visual</h3><p>Estos colores afectan banner, tablas, rankings y capturas.</p></div><form id="themeSettingsForm" class="editor-form"><div class="form-grid"><div class="field"><label>Diaria</label><input name="daily" type="color" value="${normalizeHexColor(state.data.settings.themes?.daily, "#c56a2d")}" /></div><div class="field"><label>Semanal</label><input name="weekly" type="color" value="${normalizeHexColor(state.data.settings.themes?.weekly, "#2d6aa5")}" /></div><div class="field"><label>Mensual</label><input name="monthly" type="color" value="${normalizeHexColor(state.data.settings.themes?.monthly, "#2d7d57")}" /></div></div><div class="actions"><span class="hint">Ajusta el color base de cada producto. La vista previa y las vistas oficiales usan estos tonos.</span><button class="ghost-button" type="submit">Guardar tema</button></div></form></section><section class="panel"><div class="panel-head"><h3>ToteLetras</h3><p>Configuracion local separada del flujo de capturas.</p></div><form id="toteletrasForm" class="editor-form"><div class="field"><label>URL login</label><input name="loginUrl" type="text" value="${toteSettings.loginUrl || ""}" /></div><div class="field"><label>Usuario</label><input name="username" type="text" value="${toteSettings.username || ""}" /></div><div class="field"><label>Clave</label><input name="password" type="password" value="${toteSettings.password || ""}" /></div><div class="check-grid"><label class="check-chip"><input type="checkbox" name="pollingEnabled"${toteSettings.pollingEnabled ? " checked" : ""} /> Activar polling</label></div><div class="form-grid"><div class="field"><label>Cada cuantos minutos</label><input name="pollingIntervalMinutes" type="number" min="1" value="${toteSettings.pollingIntervalMinutes || 5}" /></div><div class="field"><label>Minutos despues de la carrera</label><input name="pollingDelayMinutes" type="number" min="0" value="${toteSettings.pollingDelayMinutes || 5}" /></div></div><div class="actions"><span class="hint">Esto queda aislado del envio al grupo, para no mezclar captura con scraping de resultados.</span><button class="ghost-button" type="submit">Guardar ToteLetras</button></div></form></section></section>`;
    body.querySelector("#automationFilterForm")?.addEventListener("submit", (event) => {
      const form = new FormData(event.currentTarget);
      saveSettings(
        event,
        {
          automation: {
            filterDate: String(form.get("filterDate") || ""),
            groupId: String(form.get("groupId") || ""),
            includeDaily: form.get("includeDaily") === "on",
            includeWeekly: form.get("includeWeekly") === "on",
            includeMonthly: form.get("includeMonthly") === "on",
          },
        },
        "Filtro de capturas guardado.",
      );
    });
    body.querySelector("#automationCaptureForm")?.addEventListener("submit", (event) => {
      const form = new FormData(event.currentTarget);
      saveSettings(
        event,
        {
          automation: {
            ...automationSettings,
            selectedCaptureKeys: form.getAll("selectedCaptureKeys"),
          },
        },
        "Seleccion de capturas guardada.",
      );
    });
    const refreshAutomationPreview = () => {
      const selectedKeys = Array.from(body.querySelectorAll('#automationCaptureForm input[name="selectedCaptureKeys"]:checked')).map((input) => input.value);
      const previewMount = body.querySelector("#automationPreviewMount");
      if (previewMount) {
        previewMount.innerHTML = renderAutomationPreviewPanel(automationDate, automationSettings.groupId, selectedKeys, automationSettings);
        bindAutomationPreviewActions(selectedKeys);
      }
    };
    const bindAutomationPreviewActions = (selectedKeys = []) => {
      const items = buildAutomationCaptureItems(automationDate, automationSettings.groupId, getAutomationIncludedKinds(automationSettings));
      const selectedItems = items.filter((item) => safeArray(selectedKeys).includes(item.key));
      const captureApi = window.htmlToImage;
      const getCaptureNode = (key) => body.querySelector(`[data-capture-preview="${key}"]`);
      const waitForCaptureFrame = () => new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
  const createCaptureSandbox = async (itemList) => {
        const sandbox = document.createElement("div");
        sandbox.setAttribute("data-capture-sandbox", "true");
        sandbox.style.position = "fixed";
        sandbox.style.left = "8px";
        sandbox.style.top = "8px";
        sandbox.style.padding = "20px";
        sandbox.style.background = "#edf3fb";
        sandbox.style.zIndex = "2147483647";
        sandbox.style.pointerEvents = "none";
        sandbox.style.boxSizing = "border-box";
        sandbox.style.opacity = "0.01";
        const stack = document.createElement("div");
        stack.style.display = "grid";
        stack.style.gap = "24px";
        let maxWidth = 1080;
        itemList.forEach((item) => {
          const sourceNode = getCaptureNode(item.key);
          if (!sourceNode) return;
          const piece = sourceNode.cloneNode(true);
          piece.removeAttribute("data-capture-preview");
          piece.setAttribute("data-capture-export", item.key);
          const pieceWidth = getAutomationCaptureWidth(item, automationDate);
          maxWidth = Math.max(maxWidth, pieceWidth);
          piece.style.width = `${pieceWidth}px`;
          piece.style.margin = "0 auto";
          piece.style.display = "grid";
          piece.style.gap = "16px";
          stack.appendChild(piece);
        });
        sandbox.style.width = `${maxWidth + 40}px`;
        sandbox.appendChild(stack);
        document.body.appendChild(sandbox);
        await waitForCaptureFrame();
        return {
          sandbox,
          batchNode: stack,
          getPieceNode: (key) => stack.querySelector(`[data-capture-export="${key}"]`),
        };
      };
      const getMeasuredDimension = (node, dimension) => {
        const rect = node.getBoundingClientRect();
        const ownValue = dimension === "width"
          ? [node.scrollWidth, node.offsetWidth, rect.width]
          : [node.scrollHeight, node.offsetHeight, rect.height];
        const descendantValue = Array.from(node.children || []).reduce((max, child) => {
          const childRect = child.getBoundingClientRect();
          return Math.max(max, dimension === "width" ? childRect.width : childRect.height);
        }, 0);
        return Math.ceil(Math.max(...ownValue.filter(Boolean), descendantValue, dimension === "width" ? 1080 : 200));
      };
      const captureNodeAsBlob = async (node, fileName = "captura") => {
        if (!captureApi?.toBlob) {
          throw new Error("La libreria de captura no esta disponible.");
        }
        const blob = await captureApi.toBlob(node, {
          cacheBust: true,
          pixelRatio: 4,
          backgroundColor: "#edf3fb",
          width: getMeasuredDimension(node, "width"),
          height: getMeasuredDimension(node, "height"),
        });
        if (!blob) {
          throw new Error("No se pudo generar la imagen.");
        }
        return new File([blob], `${fileName}.png`, { type: "image/png" });
      };
      const downloadFiles = (files) => {
        files.forEach((file) => {
          const url = URL.createObjectURL(file);
          const link = document.createElement("a");
          link.href = url;
          link.download = file.name;
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 2000);
        });
      };
      const shareFiles = async (files) => {
        if (navigator.share && navigator.canShare?.({ files })) {
          try {
            await navigator.share({ files, title: "Capturas Pollas Hipicas" });
            return true;
          } catch (error) {
            if (error?.name === "AbortError") return true;
          }
        }
        downloadFiles(files);
        showToast("Tu navegador no pudo abrir el menu de compartir. Se descargaron las imagenes.");
        return false;
      };
      const copyImageFile = async (file) => {
        if (!navigator.clipboard?.write || typeof ClipboardItem === "undefined") {
          downloadFiles([file]);
          showToast("No se pudo copiar como imagen. Se descargo el PNG.");
          return;
        }
        await navigator.clipboard.write([new ClipboardItem({ [file.type]: file })]);
        showToast("Imagen copiada al portapapeles.");
      };
      const shareSelection = async (itemList) => {
        if (!itemList.length) return showToast("Marca al menos una captura.");
        let sandboxRef = null;
        try {
          sandboxRef = await createCaptureSandbox(itemList);
          const files = itemList.length > 1
            ? [await captureNodeAsBlob(sandboxRef.batchNode, `capturas-${automationDate || "grupo"}`)]
            : [await captureNodeAsBlob(sandboxRef.getPieceNode(itemList[0].key), itemList[0].label.toLowerCase().replace(/[^a-z0-9]+/gi, "-"))];
          await shareFiles(files);
        } catch (error) {
          showToast(error.message || "No se pudo compartir la imagen.");
        } finally {
          sandboxRef?.sandbox?.remove();
        }
      };
      const copySelection = async (itemList) => {
        if (!itemList.length) return showToast("Marca al menos una captura.");
        let sandboxRef = null;
        try {
          sandboxRef = await createCaptureSandbox(itemList);
          const file = itemList.length > 1
            ? await captureNodeAsBlob(sandboxRef.batchNode, `capturas-${automationDate || "grupo"}`)
            : await captureNodeAsBlob(sandboxRef.getPieceNode(itemList[0].key), itemList[0].label.toLowerCase().replace(/[^a-z0-9]+/gi, "-"));
          await copyImageFile(file);
        } catch (error) {
          showToast(error.message || "No se pudo copiar la imagen.");
        } finally {
          sandboxRef?.sandbox?.remove();
        }
      };
      body.querySelector("#automationShareSelected")?.addEventListener("click", () => shareSelection(selectedItems));
      body.querySelector("#automationCopySelected")?.addEventListener("click", () => copySelection(selectedItems));
      body.querySelectorAll("[data-share-capture]").forEach((button) => {
        button.addEventListener("click", async () => {
          const item = items.find((entry) => entry.key === button.dataset.shareCapture);
          if (item) await shareSelection([item]);
        });
      });
      body.querySelectorAll("[data-copy-capture]").forEach((button) => {
        button.addEventListener("click", async () => {
          const item = items.find((entry) => entry.key === button.dataset.copyCapture);
          if (item) await copySelection([item]);
        });
      });
    };
    body.querySelector("#automationCaptureForm")?.addEventListener("change", refreshAutomationPreview);
    body.querySelector("#automationSelectRecommended")?.addEventListener("click", () => {
      body.querySelectorAll('#automationCaptureForm input[type="checkbox"]').forEach((input) => {
        const label = input.closest("label");
        input.checked = Boolean(label?.textContent?.includes("recomendada"));
      });
      refreshAutomationPreview();
    });
    body.querySelector("#automationSelectAll")?.addEventListener("click", () => {
      body.querySelectorAll('#automationCaptureForm input[type="checkbox"]').forEach((input) => {
        input.checked = true;
      });
      refreshAutomationPreview();
    });
    body.querySelector("#automationClearAll")?.addEventListener("click", () => {
      body.querySelectorAll('#automationCaptureForm input[type="checkbox"]').forEach((input) => {
        input.checked = false;
      });
      refreshAutomationPreview();
    });
    bindAutomationPreviewActions(automationSettings.selectedCaptureKeys);
    body.querySelector("#themeSettingsForm")?.addEventListener("submit", (event) => {
      const form = new FormData(event.currentTarget);
      saveSettings(
        event,
        {
          themes: {
            daily: normalizeHexColor(form.get("daily"), "#c56a2d"),
            weekly: normalizeHexColor(form.get("weekly"), "#2d6aa5"),
            monthly: normalizeHexColor(form.get("monthly"), "#2d7d57"),
          },
        },
        "Tema visual guardado.",
      );
    });
    body.querySelector("#toteletrasForm").addEventListener("submit", (event) => {
      const form = new FormData(event.currentTarget);
      saveSettings(
        event,
        {
          toteletras: {
            loginUrl: form.get("loginUrl"),
            username: form.get("username"),
            password: form.get("password"),
            pollingEnabled: form.get("pollingEnabled") === "on",
            pollingIntervalMinutes: Number(form.get("pollingIntervalMinutes")),
            pollingDelayMinutes: Number(form.get("pollingDelayMinutes")),
          },
        },
        "Configuracion de ToteLetras guardada.",
      );
    });
  }
}

renderDailyContent = function renderDailyContentV5() {
  const event = eventById(state.data.semanal.events, state.dailyEventId);
  state.dailyEventId = event?.id || null;
  if (!event) {
    dailyView.innerHTML = `${renderHero("Diaria", "Ahora mismo no hay una jornada diaria cargada. Si apagaste Excel base, esto es normal hasta que carguemos una jornada desde administrador.", [
      { label: "Participantes", value: 0 },
      { label: "Carreras", value: 0 },
      { label: "Excel base", value: state.data.settings.excel.useExcelBase ? "Activo" : "Apagado" },
      { label: "Ultima lectura", value: formatDateTime(state.data.updatedAt) },
    ])}<section class="panel"><div class="panel-head"><h3>Sin informacion diaria</h3><p>Puedes volver a activar Excel base o crear/cargar una jornada desde Administrador.</p></div></section>`;
    return;
  }
  const race = getFocusRace(event);
  const distribution = getDistribution(event, race);
  dailyView.innerHTML = `${renderHero(`Diaria Â· ${event.sheetName}`, "Aqui ves solo la informacion de la diaria. Si cambias de dia, cambia toda la lectura de esa jornada.", [
    { label: "Participantes", value: event.participants.length },
    { label: "Carreras", value: event.races },
    { label: "Proxima carrera", value: race },
    { label: "Ultima lectura", value: formatDateTime(state.data.updatedAt) },
  ])}<section class="panel"><div class="toolbar"><div><p class="label">Jornada diaria</p><div class="toolbar-group" id="dailyTabs"></div></div><span class="tag">${state.data.storage.overridesFile}</span></div></section><section class="grid-3"><section class="panel"><div class="panel-head"><h3>Carrera en curso</h3><p>Lo que se viene ahora.</p></div><div class="stack"><div class="mini-card"><span class="label">Carrera</span><strong>${race}</strong></div><ul class="list">${distribution.map((item) => `<li><span>Caballo ${item.horse}</span><strong>${item.count} picks</strong></li>`).join("")}</ul></div></section><section class="panel"><div class="panel-head"><h3>Ranking</h3><p>Total claro por jornada.</p></div>${setTable(["Lugar", "Stud", "Total"], event.leaderboard.slice(0, 12).map((participant, index) => [index + 1, participant.name, formatDividend(participant.points)]))}</section><section class="panel"><div class="panel-head"><h3>Resultados</h3><p>Lectura simple.</p></div>${setTable(["C", "1Â°", "Div", "2Â°", "Div", "3Â°", "Div"], event.results.slice(0, 10).map((item) => [item.race, item.primero || "-", formatDividend(item.ganador), item.segundo || "-", formatDividend(item.divSegundo), item.tercero || "-", formatDividend(item.divTercero)]))}</section></section><section class="panel"><div class="panel-head"><h3>Pronosticos registrados</h3><p>Detalle por carrera. La carga rapida ahora vive en Administrador > Operacion.</p></div>${setTable(["N", "Stud", "Total", ...Array.from({ length: event.races }, (_, index) => `C${index + 1}`)], event.participants.map((participant) => [participant.index, participant.name, formatDividend(participant.points), ...participant.picks.map((pick) => pick.horse || "-")]))}</section>`;
  const tabs = dailyView.querySelector("#dailyTabs");
  state.data.semanal.events.forEach((item) => {
    const button = document.createElement("button");
    button.className = `subnav-button${item.id === event.id ? " active" : ""}`;
    button.textContent = item.sheetName;
    button.addEventListener("click", () => {
      state.dailyEventId = item.id;
      render();
    });
    tabs.appendChild(button);
  });
}

renderWeeklyContent = function renderWeeklyContentV2() {
  const events = getWeeklyEvents();
  const total = aggregateEvents(events, "Acumulado semanal", "weekly-total");
  const selected = state.weeklyTab === "total" ? null : events.find((event) => event.sheetName === state.weeklyTab) || events[0] || null;
  weeklyView.innerHTML = `${renderHero("Semanal", "La semanal muestra solo lo que corresponde a ese producto. Puedes ver el total acumulado o entrar a un dia puntual.", [
    { label: "Formato", value: state.data.settings.weekly.format },
    { label: "Dias activos", value: state.data.settings.weekly.activeDays.length },
    { label: "Final", value: safeArray(state.data.settings.weekly.finalDays).join(", ") || "-" },
    { label: "Modo", value: state.data.settings.weekly.pairMode ? "Parejas" : "Individual" },
  ])}<section class="panel"><div class="toolbar"><div><p class="label">Vista semanal</p><div class="toolbar-group" id="weeklyTabs"></div></div><span class="tag">Configurable desde administrador</span></div></section><section id="weeklyBody"></section>`;
  ["total", ...events.map((event) => event.sheetName)].forEach((id) => {
    const button = document.createElement("button");
    button.className = `subnav-button${state.weeklyTab === id ? " active" : ""}`;
    button.textContent = id === "total" ? "TOTAL" : id.toUpperCase();
    button.addEventListener("click", () => {
      state.weeklyTab = id;
      render();
    });
    weeklyView.querySelector("#weeklyTabs").appendChild(button);
  });
  if (!events.length) {
    weeklyView.querySelector("#weeklyBody").innerHTML = `<section class="panel"><div class="panel-head"><h3>Sin informacion semanal</h3><p>No hay jornadas semanales disponibles con la fuente actual. Si apagaste Excel base, esto es normal hasta que carguemos jornadas desde administrador.</p></div></section>`;
    return;
  }
  weeklyView.querySelector("#weeklyBody").innerHTML =
    state.weeklyTab === "total"
      ? `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Acumulado semanal</h3><p>Total segun los dias activos.</p></div>${setTable(["Lugar", "Stud", "1Â°", "2Â°", "3Â°", "Aciertos", "Total"], total.participants.slice(0, 20).map((item, index) => [index + 1, item.name, item.firsts, item.seconds, item.thirds, item.hits, formatDividend(item.totalPoints / 100)]))}</section><section class="panel"><div class="panel-head"><h3>Jornadas activas</h3><p>Resumen rapido.</p></div><div class="cards two">${events.map((event) => `<article class="mini-card"><span class="label">${event.sheetName}</span><strong>${formatDividend(event.leaderboard[0]?.points || 0)}</strong><p class="hint">Lider: ${event.leaderboard[0]?.name || "Sin datos"}</p></article>`).join("")}</div></section></section>`
      : selected
        ? `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>${selected.sheetName}</h3><p>Detalle del dia seleccionado.</p></div>${setTable(["Lugar", "Stud", "Total"], selected.leaderboard.slice(0, 15).map((participant, index) => [index + 1, participant.name, formatDividend(participant.points)]))}</section><section class="panel"><div class="panel-head"><h3>Carrera en foco</h3><p>Carrera ${getFocusRace(selected)}</p></div><ul class="list">${getDistribution(selected, getFocusRace(selected)).map((item) => `<li><span>Caballo ${item.horse}</span><strong>${item.count} picks</strong></li>`).join("")}</ul></section></section>`
        : "";
}

renderMonthlyContent = function renderMonthlyContentV2() {
  const events = getMonthlyEvents();
  const total = aggregateEvents(events, "Acumulado mensual", "monthly-total");
  const selected = state.monthlyTab === "total" ? null : events.find((event) => event.id === state.monthlyTab) || events[0] || null;
  monthlyView.innerHTML = `${renderHero("Mensual", "La mensual tiene una vista total y una por jornada. Lo que entra al calculo se define en administrador por fechas, hipodromos y jornadas.", [
    { label: "Hipodromos", value: safeArray(state.data.settings.monthly.hipodromos).join(", ") || "-" },
    { label: "Inicio", value: state.data.settings.monthly.startDate || "-" },
    { label: "Termino", value: state.data.settings.monthly.endDate || "-" },
    { label: "Jornadas", value: events.length },
  ])}<section class="panel"><div class="toolbar"><div><p class="label">Vista mensual</p><div class="toolbar-group" id="monthlyTabs"></div></div><span class="tag">Acumulado configurable</span></div></section><section id="monthlyBody"></section>`;
  ["total", ...events.map((event) => event.id)].forEach((id) => {
    const button = document.createElement("button");
    button.className = `subnav-button${state.monthlyTab === id ? " active" : ""}`;
    button.textContent = id === "total" ? "TOTAL" : (events.find((event) => event.id === id)?.sheetName || id).toUpperCase();
    button.addEventListener("click", () => {
      state.monthlyTab = id;
      render();
    });
    monthlyView.querySelector("#monthlyTabs").appendChild(button);
  });
  if (!events.length) {
    monthlyView.querySelector("#monthlyBody").innerHTML = `<section class="panel"><div class="panel-head"><h3>Sin informacion mensual</h3><p>No hay jornadas mensuales disponibles con la fuente actual. Si apagaste Excel base, esto es normal hasta que carguemos jornadas desde administrador.</p></div></section>`;
    return;
  }
  monthlyView.querySelector("#monthlyBody").innerHTML =
    state.monthlyTab === "total"
      ? `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Acumulado mensual</h3><p>Total de jornadas incluidas.</p></div>${setTable(["Lugar", "Stud", "1Â°", "2Â°", "3Â°", "Aciertos", "Total"], total.participants.slice(0, 20).map((item, index) => [index + 1, item.name, item.firsts, item.seconds, item.thirds, item.hits, formatDividend(item.totalPoints / 100)]))}</section><section class="panel"><div class="panel-head"><h3>Tabla resumen</h3><p>Hoja general mensual.</p></div>${setTable(["Lugar", "Stud", ...state.data.mensual.tabla.headers.slice(0, 4)], state.data.mensual.tabla.standings.slice(0, 12).map((row) => [row.place, row.stud, ...row.scores.slice(0, 4).map((item) => formatDividend(item.value))]))}</section></section>`
      : selected
        ? `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>${selected.sheetName}</h3><p>Jornada puntual.</p></div>${setTable(["Lugar", "Stud", "Total"], selected.leaderboard.slice(0, 15).map((participant, index) => [index + 1, participant.name, formatDividend(participant.points)]))}</section><section class="panel"><div class="panel-head"><h3>Resultados</h3><p>Detalle de la jornada.</p></div>${setTable(["C", "1Â°", "Div", "2Â°", "Div", "3Â°", "Div"], selected.results.slice(0, 12).map((item) => [item.race, item.primero || "-", formatDividend(item.ganador), item.segundo || "-", formatDividend(item.divSegundo), item.tercero || "-", formatDividend(item.divTercero)]))}</section></section>`
        : "";
}

renderDailyContent = function renderDailyContentV2b() {
  const today = toLocalDateInputValue();
  const dailyEvents = getDailyCampaignEvents(today);
  const event = eventById(dailyEvents, state.dailyEventId);
  state.dailyEventId = event?.id || null;
  if (!event) {
    dailyView.innerHTML = `${renderHero("Diaria", "La diaria ahora depende de la fecha de la campaÃ±a activa.", [
      { label: "Participantes", value: 0 },
      { label: "Carreras", value: 0 },
      { label: "Fecha", value: today },
      { label: "Campanas hoy", value: 0 },
    ])}<section class="panel"><div class="panel-head"><h3>Sin diaria para esta fecha</h3><p>No hay una campaÃ±a diaria asociada a ${today}. Cuando la fecha de la campaÃ±a coincida, aquÃ­ aparecerÃ¡ su informaciÃ³n.</p></div></section>`;
    return;
  }
  const race = getFocusRace(event);
  const distribution = getDistribution(event, race);
  const scoringMode = event?.scoring?.mode || "dividend";
  dailyView.innerHTML = `${renderHero(`Diaria Â· ${event.sheetName}`, "AquÃ­ ves solo la diaria que corresponde a la fecha activa.", [
    { label: "Participantes", value: event.participants.length },
    { label: "Carreras", value: event.races },
    { label: "Proxima carrera", value: race },
    { label: "Fecha", value: today },
  ])}<section class="panel"><div class="toolbar"><div><p class="label">Jornada diaria</p><div class="toolbar-group" id="dailyTabs"></div></div><span class="tag">${state.data.storage.overridesFile}</span></div></section><section class="grid-3"><section class="panel"><div class="panel-head"><h3>Carrera en curso</h3><p>Lo que se viene ahora.</p></div><div class="stack"><div class="mini-card"><span class="label">Carrera</span><strong>${race}</strong></div><ul class="list">${distribution.map((item) => `<li><span>Caballo ${item.horse}</span><strong>${item.count} picks</strong></li>`).join("")}</ul></div></section><section class="panel"><div class="panel-head"><h3>Ranking</h3><p>Total claro por jornada.</p></div>${setTable(["Lugar", "Stud", "Total"], event.leaderboard.slice(0, 12).map((participant, index) => [index + 1, participant.name, formatScoreValue(participant.points, scoringMode)]))}</section><section class="panel"><div class="panel-head"><h3>Resultados</h3><p>Lectura simple.</p></div>${setTable(["C", "1Â°", "Div", "2Â°", "Div", "3Â°", "Div"], event.results.slice(0, 10).map((item) => [item.race, item.primero || "-", formatDividend(item.ganador), item.segundo || "-", formatDividend(item.divSegundo), item.tercero || "-", formatDividend(item.divTercero)]))}</section></section>${renderPicksTable(event)}`;
  const tabs = dailyView.querySelector("#dailyTabs");
  dailyEvents.forEach((item) => {
    const button = document.createElement("button");
    button.className = `subnav-button${item.id === event.id ? " active" : ""}`;
    button.textContent = item.sheetName;
    button.addEventListener("click", () => {
      state.dailyEventId = item.id;
      render();
    });
    tabs.appendChild(button);
  });
}

renderWeeklyContent = function renderWeeklyContentV2b() {
  const events = getWeeklyEvents();
  const total = aggregateEvents(events, "Acumulado semanal", "weekly-total");
  const selected = state.weeklyTab === "total" ? null : events.find((event) => event.sheetName === state.weeklyTab) || events[0] || null;
  const scoringMode = (selected?.scoring?.mode || events[0]?.scoring?.mode || "dividend");
  weeklyView.innerHTML = `${renderHero("Semanal", "La semanal muestra solo lo que corresponde a ese producto. Puedes ver el total acumulado o entrar a un dia puntual.", [
    { label: "Formato", value: state.data.settings.weekly.format },
    { label: "Dias activos", value: state.data.settings.weekly.activeDays.length },
    { label: "Final", value: safeArray(state.data.settings.weekly.finalDays).join(", ") || "-" },
    { label: "Modo", value: state.data.settings.weekly.pairMode ? "Parejas" : "Individual" },
  ])}<section class="panel"><div class="toolbar"><div><p class="label">Vista semanal</p><div class="toolbar-group" id="weeklyTabs"></div></div><span class="tag">Configurable desde administrador</span></div></section><section id="weeklyBody"></section>`;
  ["total", ...events.map((event) => event.sheetName)].forEach((id) => {
    const button = document.createElement("button");
    button.className = `subnav-button${state.weeklyTab === id ? " active" : ""}`;
    button.textContent = id === "total" ? "TOTAL" : id.toUpperCase();
    button.addEventListener("click", () => {
      state.weeklyTab = id;
      render();
    });
    weeklyView.querySelector("#weeklyTabs").appendChild(button);
  });
  if (!events.length) {
    weeklyView.querySelector("#weeklyBody").innerHTML = `<section class="panel"><div class="panel-head"><h3>Sin informacion semanal</h3><p>No hay jornadas semanales disponibles con la fuente actual. Si apagaste Excel base, esto es normal hasta que carguemos jornadas desde administrador.</p></div></section>`;
    return;
  }
  weeklyView.querySelector("#weeklyBody").innerHTML =
    state.weeklyTab === "total"
      ? `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Acumulado semanal</h3><p>Total segun los dias activos.</p></div>${setTable(["Lugar", "Stud", "1Â°", "2Â°", "3Â°", "Aciertos", "Total"], total.participants.slice(0, 20).map((item, index) => [index + 1, item.name, item.firsts, item.seconds, item.thirds, item.hits, formatScoreValue(item.totalPoints, scoringMode)]))}</section><section class="panel"><div class="panel-head"><h3>Jornadas activas</h3><p>Resumen rapido.</p></div><div class="cards two">${events.map((event) => `<article class="mini-card"><span class="label">${event.sheetName}</span><strong>${formatScoreValue(event.leaderboard[0]?.points || 0, event?.scoring?.mode || scoringMode)}</strong><p class="hint">Lider: ${event.leaderboard[0]?.name || "Sin datos"}</p></article>`).join("")}</div></section></section>`
      : selected
        ? `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>${selected.sheetName}</h3><p>Detalle del dia seleccionado.</p></div>${setTable(["Lugar", "Stud", "Total"], selected.leaderboard.slice(0, 15).map((participant, index) => [index + 1, participant.name, formatScoreValue(participant.points, selected?.scoring?.mode || scoringMode)]))}</section><section class="panel"><div class="panel-head"><h3>Carrera en foco</h3><p>Carrera ${getFocusRace(selected)}</p></div><ul class="list">${getDistribution(selected, getFocusRace(selected)).map((item) => `<li><span>Caballo ${item.horse}</span><strong>${item.count} picks</strong></li>`).join("")}</ul></section></section>${renderPicksTable(selected, "Pronosticos registrados", "Detalle del dia seleccionado.")}`
        : "";
}

renderMonthlyContent = function renderMonthlyContentV2b() {
  const events = getMonthlyEvents();
  const total = aggregateEvents(events, "Acumulado mensual", "monthly-total");
  const selected = state.monthlyTab === "total" ? null : events.find((event) => event.id === state.monthlyTab) || events[0] || null;
  const scoringMode = (selected?.scoring?.mode || events[0]?.scoring?.mode || "dividend");
  monthlyView.innerHTML = `${renderHero("Mensual", "La mensual tiene una vista total y una por jornada. Lo que entra al calculo se define en administrador por fechas, hipodromos y jornadas.", [
    { label: "Hipodromos", value: safeArray(state.data.settings.monthly.hipodromos).join(", ") || "-" },
    { label: "Inicio", value: state.data.settings.monthly.startDate || "-" },
    { label: "Termino", value: state.data.settings.monthly.endDate || "-" },
    { label: "Jornadas", value: events.length },
  ])}<section class="panel"><div class="toolbar"><div><p class="label">Vista mensual</p><div class="toolbar-group" id="monthlyTabs"></div></div><span class="tag">Acumulado configurable</span></div></section><section id="monthlyBody"></section>`;
  ["total", ...events.map((event) => event.id)].forEach((id) => {
    const button = document.createElement("button");
    button.className = `subnav-button${state.monthlyTab === id ? " active" : ""}`;
    button.textContent = id === "total" ? "TOTAL" : (events.find((event) => event.id === id)?.sheetName || id).toUpperCase();
    button.addEventListener("click", () => {
      state.monthlyTab = id;
      render();
    });
    monthlyView.querySelector("#monthlyTabs").appendChild(button);
  });
  if (!events.length) {
    monthlyView.querySelector("#monthlyBody").innerHTML = `<section class="panel"><div class="panel-head"><h3>Sin informacion mensual</h3><p>No hay jornadas mensuales disponibles con la fuente actual. Si apagaste Excel base, esto es normal hasta que carguemos jornadas desde administrador.</p></div></section>`;
    return;
  }
  monthlyView.querySelector("#monthlyBody").innerHTML =
    state.monthlyTab === "total"
      ? `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Acumulado mensual</h3><p>Total de jornadas incluidas.</p></div>${setTable(["Lugar", "Stud", "1Â°", "2Â°", "3Â°", "Aciertos", "Total"], total.participants.slice(0, 20).map((item, index) => [index + 1, item.name, item.firsts, item.seconds, item.thirds, item.hits, formatScoreValue(item.totalPoints, scoringMode)]))}</section><section class="panel"><div class="panel-head"><h3>Tabla resumen</h3><p>Hoja general mensual.</p></div>${setTable(["Lugar", "Stud", ...state.data.mensual.tabla.headers.slice(0, 4)], state.data.mensual.tabla.standings.slice(0, 12).map((row) => [row.place, row.stud, ...row.scores.slice(0, 4).map((item) => formatDividend(item.value))]))}</section></section>`
      : selected
        ? `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>${selected.sheetName}</h3><p>Jornada puntual.</p></div>${setTable(["Lugar", "Stud", "Total"], selected.leaderboard.slice(0, 15).map((participant, index) => [index + 1, participant.name, formatScoreValue(participant.points, selected?.scoring?.mode || scoringMode)]))}</section><section class="panel"><div class="panel-head"><h3>Resultados</h3><p>Detalle de la jornada.</p></div>${setTable(["C", "1Â°", "Div", "2Â°", "Div", "3Â°", "Div"], selected.results.slice(0, 12).map((item) => [item.race, item.primero || "-", formatDividend(item.ganador), item.segundo || "-", formatDividend(item.divSegundo), item.tercero || "-", formatDividend(item.divTercero)]))}</section></section>${renderPicksTable(selected, "Pronosticos registrados", "Detalle de la jornada mensual seleccionada.")}`
        : "";
}

renderEventForms = function renderEventFormsV2b(event) {
  const roster = state.data.registry.filter((item) => item.diaria || item.semanal || item.mensual).map((item) => item.name);
  const usedNames = new Set(
    safeArray(event.participants)
      .map((item) => item?.name)
      .filter(Boolean),
  );
  const names = (roster.length ? roster : event.participants.map((item) => item.name))
    .filter((name) => !usedNames.has(name) || name === editTarget?.name);
  const safeNames = names.length ? names : roster;
  const defaultParticipant = event.participants[0];
  const nextIndex = Math.max(0, ...event.participants.map((item) => Number(item.index) || 0)) + 1;
  const race = getFocusRace(event);
  const current = event.results.find((item) => String(item.race) === race) || { race };
  const operationDate = toLocalDateInputValue();
  const retirosValue = Array.isArray(current.retiros) && current.retiros.length
    ? current.retiros.join(", ")
    : [current.retiro1, current.retiro2].filter(Boolean).join(", ");
  return `<div class="panel"><div class="panel-head"><h4>Destino de la operacion</h4><p>La fecha operativa define a que jornada entra cada carga.</p></div><div class="stack"><div class="form-grid"><div class="field"><label>Fecha operativa</label><input data-operation-date type="date" value="${operationDate}" /></div></div><div class="check-grid"><label class="check-chip"><input type="checkbox" data-target-check="daily" checked /> Diaria</label><label class="check-chip"><input type="checkbox" data-target-check="weekly" /> Semanal</label><label class="check-chip"><input type="checkbox" data-target-check="monthly" /> Mensual</label></div><div class="form-grid"><div class="field"><label>Campana diaria</label><select data-target-select="daily"><option value="">No aplicar</option>${getEnabledCampaigns("daily").map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></div><div class="field"><label>Campana semanal</label><select data-target-select="weekly"><option value="">No aplicar</option>${getEnabledCampaigns("weekly").map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></div><div class="field"><label>Campana mensual</label><select data-target-select="monthly"><option value="">No aplicar</option>${getEnabledCampaigns("monthly").map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></div></div><p class="hint">La diaria entra solo si la fecha coincide. La semanal y la mensual respetan su rango de fechas y, en semanal, el dia correspondiente.</p></div></div><form class="editor-form" data-form="participant"><div class="panel-head"><h4>Pronostico</h4><p>Ingreso por jornada.</p></div><div class="form-grid"><div class="field"><label>Numero</label><input name="index" type="number" min="1" value="${defaultParticipant?.index || nextIndex}" /></div><div class="field"><label>Stud</label><select name="name">${names.map((name) => `<option value="${name}"${name === defaultParticipant?.name ? " selected" : ""}>${name}</option>`).join("")}</select></div></div><div class="form-grid">${Array.from({ length: Math.min(event.races, 30) }, (_, index) => `<div class="field"><label>C${index + 1}</label><input name="pick-${index + 1}" type="text" value="${defaultParticipant?.picks[index]?.horse || ""}" /></div>`).join("")}</div><div class="actions"><span class="hint">El mismo pronostico puede ir a varias pollas, pero respetando fecha y jornada.</span><button class="primary-button" type="submit">Guardar pronostico</button></div></form><form class="editor-form" data-form="result"><div class="panel-head"><h4>Resultado</h4><p>La carrera en foco. Los empates usan el mismo dividendo de su posicion.</p></div><div class="form-grid"><div class="field"><label>Carrera</label><input name="race" type="number" min="1" max="${event.races}" value="${race}" /></div><div class="field"><label>Primero</label><input name="primero" type="text" value="${current.primero || ""}" /></div><div class="field"><label>Empate 1Â°</label><input name="empatePrimero" type="text" value="${current.empatePrimero || ""}" /></div><div class="field"><label>Div 1Â°</label><input name="ganador" type="text" value="${current.ganador || ""}" /></div><div class="field"><label>Segundo</label><input name="segundo" type="text" value="${current.segundo || ""}" /></div><div class="field"><label>Empate 2Â°</label><input name="empateSegundo" type="text" value="${current.empateSegundo || ""}" /></div><div class="field"><label>Div 2Â°</label><input name="divSegundo" type="text" value="${current.divSegundo || ""}" /></div><div class="field"><label>Tercero</label><input name="tercero" type="text" value="${current.tercero || ""}" /></div><div class="field"><label>Empate 3Â°</label><input name="empateTercero" type="text" value="${current.empateTercero || ""}" /></div><div class="field"><label>Div 3Â°</label><input name="divTercero" type="text" value="${current.divTercero || ""}" /></div><div class="field"><label>Favorito</label><input name="favorito" type="text" value="${current.favorito || ""}" /></div><div class="field"><label>Retiros</label><input name="retiros" type="text" value="${retirosValue}" placeholder="Ej. 6, 8, 11" /></div></div><div class="actions"><span class="hint">Puedes cargar varios retiros separados por coma. Si el favorito llega 1Â°, 2Â° o 3Â°, defiende al retirado.</span><button class="primary-button" type="submit">Guardar resultado</button></div></form>`;
}

function renderOperationTargets(currentEvent = null) {
  const operationDate = toLocalDateInputValue();
  const scoringMode = currentEvent?.scoring?.mode || "dividend";
  const lastRaceRule = scoringMode === "dividend" ? (currentEvent?.scoring?.doubleLastRace !== false ? "Activa" : "Apagada") : "No aplica";
  return `<div class="panel"><div class="panel-head"><h4>Destino del guardado</h4><p>La fecha operativa define a que jornada entra cada carga.</p></div><div class="stack"><div class="form-grid"><div class="field"><label>Fecha operativa</label><input data-operation-date type="date" value="${operationDate}" /></div><div class="field"><label>Carreras de la jornada</label><input type="number" value="${currentEvent?.races || 12}" readonly /></div><div class="field"><label>Ultima x2</label><input type="text" value="${lastRaceRule}" readonly /></div></div><div class="check-grid"><label class="check-chip"><input type="checkbox" data-target-check="daily" checked /> Diaria</label><label class="check-chip"><input type="checkbox" data-target-check="weekly" /> Semanal</label><label class="check-chip"><input type="checkbox" data-target-check="monthly" /> Mensual</label></div><div class="form-grid"><div class="field"><label>Campana diaria</label><select data-target-select="daily"><option value="">No aplicar</option>${getEnabledCampaigns("daily").map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></div><div class="field"><label>Campana semanal</label><select data-target-select="weekly"><option value="">No aplicar</option>${getEnabledCampaigns("weekly").map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></div><div class="field"><label>Campana mensual</label><select data-target-select="monthly"><option value="">No aplicar</option>${getEnabledCampaigns("monthly").map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}</select></div></div><p class="hint">Si la jornada es por dividendo, aqui ves si la regla de ultima carrera x2 esta activa. Para cambiarla, edita la campaÃ±a.</p></div></div>`;
}

function renderForecastForm(event) {
  const roster = state.data.registry.filter((item) => item.diaria || item.semanal || item.mensual).map((item) => item.name);
  const names = roster.length ? roster : event.participants.map((item) => item.name);
  const defaultParticipant = event.participants[0];
  const nextIndex = Math.max(0, ...event.participants.map((item) => Number(item.index) || 0)) + 1;
  return `${renderOperationTargets()}<form class="editor-form" data-form="participant"><div class="panel-head"><h4>Pronostico</h4><p>Ingreso por jornada.</p></div><div class="form-grid"><div class="field"><label>Numero</label><input name="index" type="number" min="1" value="${defaultParticipant?.index || nextIndex}" /></div><div class="field"><label>Stud</label><select name="name">${names.map((name) => `<option value="${name}"${name === defaultParticipant?.name ? " selected" : ""}>${name}</option>`).join("")}</select></div></div><div class="form-grid">${Array.from({ length: Math.min(event.races, 30) }, (_, index) => `<div class="field"><label>C${index + 1}</label><input name="pick-${index + 1}" type="text" value="${defaultParticipant?.picks[index]?.horse || ""}" /></div>`).join("")}</div><div class="actions"><span class="hint">El mismo pronostico puede ir a varias pollas, pero respetando fecha y jornada.</span><button class="primary-button" type="submit">Guardar pronostico</button></div></form>`;
}

renderResultsForm = function renderResultsFormV2(event) {
  const race = getFocusRace(event);
  const current = event.results.find((item) => String(item.race) === race) || { race };
  const retirosValue = Array.isArray(current.retiros) && current.retiros.length ? current.retiros.join(", ") : [current.retiro1, current.retiro2].filter(Boolean).join(", ");
  const sumFirst = (toNumeric(current.ganador) || 0) + (toNumeric(current.divSegundo) || 0) + (toNumeric(current.divTercero) || 0);
  const sumSecond = (toNumeric(current.divSegundo) || 0) + (toNumeric(current.divTercero) || 0);
  const sumThird = (toNumeric(current.divTercero) || 0);
  return `${renderOperationTargets()}<form class="editor-form" data-form="result"><div class="panel-head"><h4>Resultados</h4><p>Carga por posicion. Los empates usan el mismo dividendo de la posicion.</p></div><div class="result-grid"><div class="field"><label>Carrera</label><input name="race" type="number" min="1" max="${event.races}" value="${race}" /></div><div class="result-block"><p class="label">Primero</p><div class="form-grid"><div class="field"><label>Numero</label><input name="primero" type="text" value="${current.primero || ""}" /></div><div class="field"><label>Div Ganador</label><input name="ganador" type="text" value="${current.ganador || ""}" /></div><div class="field"><label>Div 2Â°</label><input name="divSegundo" type="text" value="${current.divSegundo || ""}" /></div><div class="field"><label>Div 3Â°</label><input name="divTercero" type="text" value="${current.divTercero || ""}" /></div><div class="field"><label>Suma</label><input type="text" value="${sumFirst || ""}" readonly /></div></div></div><div class="result-block"><p class="label">Segundo</p><div class="form-grid"><div class="field"><label>Numero</label><input name="segundo" type="text" value="${current.segundo || ""}" /></div><div class="field"><label>Div 2Â°</label><input name="divSegundoMirror" type="text" value="${current.divSegundo || ""}" readonly /></div><div class="field"><label>Div 3Â°</label><input name="divTerceroMirror" type="text" value="${current.divTercero || ""}" readonly /></div><div class="field"><label>Suma</label><input type="text" value="${sumSecond || ""}" readonly /></div></div></div><div class="result-block"><p class="label">Tercero</p><div class="form-grid"><div class="field"><label>Numero</label><input name="tercero" type="text" value="${current.tercero || ""}" /></div><div class="field"><label>Div 3Â°</label><input name="divTerceroSolo" type="text" value="${current.divTercero || ""}" readonly /></div><div class="field"><label>Suma</label><input type="text" value="${sumThird || ""}" readonly /></div></div></div><div class="result-block"><p class="label">Empates</p><div class="form-grid"><div class="field"><label>Empate 1Â°</label><input name="empatePrimero" type="text" value="${current.empatePrimero || ""}" /></div><div class="field"><label>Empate 2Â°</label><input name="empateSegundo" type="text" value="${current.empateSegundo || ""}" /></div><div class="field"><label>Empate 3Â°</label><input name="empateTercero" type="text" value="${current.empateTercero || ""}" /></div></div></div><div class="result-block"><p class="label">Apoyos</p><div class="form-grid"><div class="field"><label>Favorito</label><input name="favorito" type="text" value="${current.favorito || ""}" /></div><div class="field"><label>Retiros</label><input name="retiros" type="text" value="${retirosValue}" placeholder="Ej. 6, 8, 11" /></div></div></div><div class="actions"><span class="hint">Puedes cargar varios retiros separados por coma. Si el favorito llega 1Â°, 2Â° o 3Â°, defiende al retirado.</span><button class="primary-button" type="submit">Guardar resultado</button></div></form><section class="panel"><div class="panel-head"><h4>Resultados registrados</h4><p>Lo que ya esta guardado para esta jornada.</p></div>${setTable(["C", "1Â°", "Emp", "Div 1Â°", "2Â°", "Emp", "Div 2Â°", "3Â°", "Emp", "Div 3Â°", "Fav", "Retiros"], event.results.map((item) => [item.race, item.primero || "-", item.empatePrimero || "-", item.ganador || "-", item.segundo || "-", item.empateSegundo || "-", item.divSegundo || "-", item.tercero || "-", item.empateTercero || "-", item.divTercero || "-", item.favorito || "-", (safeArray(item.retiros).join(", ") || [item.retiro1, item.retiro2].filter(Boolean).join(", ") || "-")]))}</section>`;
}

bindEventForms = function bindEventFormsV2b(container, event) {
  const getTargets = () => {
    const dailyChecked = container.querySelector('[data-target-check="daily"]')?.checked;
    const weeklyChecked = container.querySelector('[data-target-check="weekly"]')?.checked;
    const monthlyChecked = container.querySelector('[data-target-check="monthly"]')?.checked;
    const operationDate = container.querySelector("[data-operation-date]")?.value || "";
    const anySelection = Boolean(
      (dailyChecked && container.querySelector('[data-target-select="daily"]')?.value) ||
      (weeklyChecked && container.querySelector('[data-target-select="weekly"]')?.value) ||
      (monthlyChecked && container.querySelector('[data-target-select="monthly"]')?.value),
    );
    const resolved = resolveCampaignTargetIds({
      operationDate,
      dailyCampaignId: dailyChecked ? container.querySelector('[data-target-select="daily"]')?.value : "",
      weeklyCampaignId: weeklyChecked ? container.querySelector('[data-target-select="weekly"]')?.value : "",
      monthlyCampaignId: monthlyChecked ? container.querySelector('[data-target-select="monthly"]')?.value : "",
    });
    return {
      targetEventIds: resolved.ids.length ? resolved.ids : (anySelection ? [] : [event.id]),
      warnings: resolved.warnings,
    };
  };

  container.querySelector('[data-form="participant"]')?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const { targetEventIds, warnings } = getTargets();
    if (!targetEventIds.length) return showToast(warnings[0] || "La fecha operativa no coincide con ninguna campana destino.");
    const response = await fetch(`/api/operations/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEventIds,
        participant: {
          index: Number(form.get("index")),
          name: form.get("name"),
          picks: Array.from({ length: Math.min(event.races, 30) }, (_, index) => form.get(`pick-${index + 1}`) || ""),
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el pronostico.");
    state.data = data;
    render();
    showToast(warnings.length ? warnings[0] : "Pronostico guardado en las pollas seleccionadas.");
  });

  container.querySelector('[data-form="result"]')?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const { targetEventIds, warnings } = getTargets();
    if (!targetEventIds.length) return showToast(warnings[0] || "La fecha operativa no coincide con ninguna campana destino.");
    const raceNumber = Number(form.get("race"));
    if (!Number.isFinite(raceNumber) || raceNumber < 1 || raceNumber > event.races) {
      return showToast(`La carrera debe estar entre 1 y ${event.races}.`);
    }
    const race = String(raceNumber);
    const response = await fetch(`/api/operations/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEventIds,
        result: {
          race,
          empatePrimero: form.get("empatePrimero"),
          primero: form.get("primero"),
          ganador: form.get("ganador"),
          empateSegundo: form.get("empateSegundo"),
          segundo: form.get("segundo"),
          divSegundo: form.get("divSegundo"),
          empateTercero: form.get("empateTercero"),
          tercero: form.get("tercero"),
          divTercero: form.get("divTercero"),
          favorito: form.get("favorito"),
          retiros: parseRetirosInput(form.get("retiros")),
          retiro1: "",
          retiro2: "",
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el resultado.");
    state.data = data;
    render();
    showToast(warnings.length ? warnings[0] : `Resultado de carrera ${race} guardado en las pollas seleccionadas.`);
  });
}

renderResultsForm = function renderResultsFormV3(event) {
  const race = getFocusRace(event);
  const current = event.results.find((item) => String(item.race) === race) || { race };
  const retirosValue = Array.isArray(current.retiros) && current.retiros.length ? current.retiros.join(", ") : [current.retiro1, current.retiro2].filter(Boolean).join(", ");
  const sumFirst = (toNumeric(current.ganador) || 0) + (toNumeric(current.divSegundo) || 0) + (toNumeric(current.divTercero) || 0);
  const sumSecond = (toNumeric(current.divSegundo) || 0) + (toNumeric(current.divTercero) || 0);
  const sumThird = (toNumeric(current.divTercero) || 0);
  return `${renderOperationTargets()}<form class="editor-form" data-form="result"><div class="panel-head"><h4>Resultados</h4><p>Carga por posicion. Los empates usan el mismo dividendo de la posicion.</p></div><div class="result-grid"><div class="field"><label>Carrera</label><input name="race" type="number" min="1" max="${event.races}" value="${race}" /></div><div class="result-block"><p class="label">Primero</p><div class="form-grid form-grid-4"><div class="field"><label>Numero</label><input name="primero" type="text" value="${current.primero || ""}" /></div><div class="field"><label>Div Ganador</label><input name="ganador" type="text" value="${current.ganador || ""}" /></div><div class="field"><label>Div 2Â°</label><input name="divSegundo" type="text" value="${current.divSegundo || ""}" /></div><div class="field"><label>Div 3Â°</label><input name="divTercero" type="text" value="${current.divTercero || ""}" /></div><div class="field"><label>Suma 1Â°</label><input data-sum-first type="text" value="${sumFirst || ""}" readonly /></div></div></div><div class="result-block"><p class="label">Segundo</p><div class="form-grid form-grid-4"><div class="field"><label>Numero</label><input name="segundo" type="text" value="${current.segundo || ""}" /></div><div class="field"><label>Div 2Â°</label><input data-div-second type="text" value="${current.divSegundo || ""}" readonly /></div><div class="field"><label>Div 3Â°</label><input data-div-third type="text" value="${current.divTercero || ""}" readonly /></div><div class="field"><label>Suma 2Â°</label><input data-sum-second type="text" value="${sumSecond || ""}" readonly /></div></div></div><div class="result-block"><p class="label">Tercero</p><div class="form-grid form-grid-4"><div class="field"><label>Numero</label><input name="tercero" type="text" value="${current.tercero || ""}" /></div><div class="field"><label>Div 3Â°</label><input data-div-third-solo type="text" value="${current.divTercero || ""}" readonly /></div><div class="field"><label>Suma 3Â°</label><input data-sum-third type="text" value="${sumThird || ""}" readonly /></div></div></div><div class="result-block"><p class="label">Empates</p><div class="form-grid form-grid-4"><div class="field"><label>Empate 1Â°</label><input name="empatePrimero" type="text" value="${current.empatePrimero || ""}" /></div><div class="field"><label>Empate 2Â°</label><input name="empateSegundo" type="text" value="${current.empateSegundo || ""}" /></div><div class="field"><label>Empate 3Â°</label><input name="empateTercero" type="text" value="${current.empateTercero || ""}" /></div></div></div><div class="result-block"><p class="label">Apoyos</p><div class="form-grid"><div class="field"><label>Favorito</label><input name="favorito" type="text" value="${current.favorito || ""}" /></div><div class="field"><label>Retiros</label><input name="retiros" type="text" value="${retirosValue}" placeholder="Ej. 6, 8, 11" /></div></div></div><div class="actions"><span class="hint">Los retiros pueden ir separados por coma. Las sumas se recalculan solas segun Div 1Â°, Div 2Â° y Div 3Â°.</span><button class="primary-button" type="submit">Guardar resultado</button></div></form><section class="panel"><div class="panel-head"><h4>Resultados registrados</h4><p>Lo que ya esta guardado para esta jornada.</p></div>${setTable(["C", "1Â°", "Emp 1Â°", "Div 1Â°", "2Â°", "Emp 2Â°", "Div 2Â°", "3Â°", "Emp 3Â°", "Div 3Â°", "Fav", "Retiros"], event.results.map((item) => [item.race, item.primero || "-", item.empatePrimero || "-", item.ganador || "-", item.segundo || "-", item.empateSegundo || "-", item.divSegundo || "-", item.tercero || "-", item.empateTercero || "-", item.divTercero || "-", item.favorito || "-", (safeArray(item.retiros).join(", ") || [item.retiro1, item.retiro2].filter(Boolean).join(", ") || "-")]))}</section>`;
}

bindEventForms = function bindEventFormsV2(container, event) {
  const resultForm = container.querySelector('[data-form="result"]');
  const getNextPendingRace = (results = event.results) => {
    const filled = new Set(safeArray(results).map((item) => String(item.race)));
    for (let race = 1; race <= event.races; race += 1) {
      if (!filled.has(String(race))) return String(race);
    }
    return String(event.races || 1);
  };
  const clearResultForm = (raceValue) => {
    if (!resultForm) return;
    const setField = (name, value = "") => {
      const input = resultForm.querySelector(`[name="${name}"]`);
      if (input) input.value = value;
    };
    setField("race", raceValue || "");
    [
      "primero",
      "ganador",
      "divSegundoPrimero",
      "divTerceroPrimero",
      "segundo",
      "divSegundo",
      "divTerceroSegundo",
      "tercero",
      "divTercero",
      "favorito",
      "retiros",
      "empatePrimero",
      "empatePrimeroGanador",
      "empatePrimeroDivSegundo",
      "empatePrimeroDivTercero",
      "empateSegundo",
      "empateSegundoDivSegundo",
      "empateSegundoDivTercero",
      "empateTercero",
      "empateTerceroDivTercero",
    ].forEach((name) => setField(name, ""));
    const tieToggle = resultForm.querySelector('[name="hasTie"]');
    const tiePanel = resultForm.querySelector("[data-tie-panel]");
    if (tieToggle) tieToggle.checked = false;
    if (tiePanel) tiePanel.hidden = true;
  };
  const formatSummaryValue = (value) => {
    const rounded = Math.round(value * 100) / 100;
    if (!rounded) return "";
    return String(rounded).replace(".", ",");
  };
  const fillResultForm = (result) => {
    if (!resultForm || !result) return;
    const setField = (name, value) => {
      const input = resultForm.querySelector(`[name="${name}"]`);
      if (input) input.value = value || "";
    };
    setField("primero", result.primero);
    setField("ganador", result.ganador);
    setField("divSegundoPrimero", result.divSegundoPrimero ?? result.divSegundo);
    setField("divTerceroPrimero", result.divTerceroPrimero ?? result.divTercero);
    setField("segundo", result.segundo);
    setField("divSegundo", result.divSegundo);
    setField("divTerceroSegundo", result.divTerceroSegundo ?? result.divTercero);
    setField("tercero", result.tercero);
    setField("divTercero", result.divTercero);
    setField("favorito", result.favorito);
    setField("retiros", Array.isArray(result.retiros) && result.retiros.length ? result.retiros.join(", ") : [result.retiro1, result.retiro2].filter(Boolean).join(", "));
    const tieToggle = resultForm.querySelector('[name="hasTie"]');
    const tiePanel = resultForm.querySelector("[data-tie-panel]");
    const hasTie = Boolean(result.empatePrimero || result.empateSegundo || result.empateTercero);
    if (tieToggle) tieToggle.checked = hasTie;
    if (tiePanel) tiePanel.hidden = !hasTie;
    setField("empatePrimero", result.empatePrimero);
    setField("empateSegundo", result.empateSegundo);
    setField("empateTercero", result.empateTercero);
    setField("empatePrimeroGanador", result.empatePrimeroGanador ?? result.ganador);
    setField("empatePrimeroDivSegundo", result.empatePrimeroDivSegundo ?? result.divSegundoPrimero ?? result.divSegundo);
    setField("empatePrimeroDivTercero", result.empatePrimeroDivTercero ?? result.divTerceroPrimero ?? result.divTercero);
    setField("empateSegundoDivSegundo", result.empateSegundoDivSegundo ?? result.divSegundo);
    setField("empateSegundoDivTercero", result.empateSegundoDivTercero ?? result.divTerceroSegundo ?? result.divTercero);
    setField("empateTerceroDivTercero", result.empateTerceroDivTercero ?? result.divTercero);
  };
  const syncResultSummary = () => {
    if (!resultForm) return;
    const ganador = toNumeric(resultForm.querySelector('[name="ganador"]')?.value) || 0;
    const divSegundoPrimero = toNumeric(resultForm.querySelector('[name="divSegundoPrimero"]')?.value) || 0;
    const divTerceroPrimero = toNumeric(resultForm.querySelector('[name="divTerceroPrimero"]')?.value) || 0;
    const divSegundo = toNumeric(resultForm.querySelector('[name="divSegundo"]')?.value) || 0;
    const divTerceroSegundo = toNumeric(resultForm.querySelector('[name="divTerceroSegundo"]')?.value) || 0;
    const divTercero = toNumeric(resultForm.querySelector('[name="divTercero"]')?.value) || 0;
    const writeValue = (selector, value) => {
      const input = resultForm.querySelector(selector);
      if (input) input.value = value ? String(value).replace(".", ",") : "";
    };
    writeValue("[data-sum-first]", ganador + divSegundo + divTercero);
    writeValue("[data-sum-second]", divSegundo + divTercero);
    writeValue("[data-sum-third]", divTercero);
    writeValue("[data-div-second]", divSegundo);
    writeValue("[data-div-third]", divTercero);
    writeValue("[data-div-third-solo]", divTercero);
  };

  resultForm?.querySelectorAll('[name="ganador"], [name="divSegundo"], [name="divTercero"]').forEach((input) => {
    input.addEventListener("input", syncResultSummary);
  });
  syncResultSummary();

  const getTargets = () => {
    const dailyChecked = container.querySelector('[data-target-check="daily"]')?.checked;
    const weeklyChecked = container.querySelector('[data-target-check="weekly"]')?.checked;
    const monthlyChecked = container.querySelector('[data-target-check="monthly"]')?.checked;
    const operationDate = container.querySelector("[data-operation-date]")?.value || "";
    const anySelection = Boolean(
      (dailyChecked && container.querySelector('[data-target-select="daily"]')?.value) ||
      (weeklyChecked && container.querySelector('[data-target-select="weekly"]')?.value) ||
      (monthlyChecked && container.querySelector('[data-target-select="monthly"]')?.value),
    );
    const resolved = resolveCampaignTargetIds({
      operationDate,
      dailyCampaignId: dailyChecked ? container.querySelector('[data-target-select="daily"]')?.value : "",
      weeklyCampaignId: weeklyChecked ? container.querySelector('[data-target-select="weekly"]')?.value : "",
      monthlyCampaignId: monthlyChecked ? container.querySelector('[data-target-select="monthly"]')?.value : "",
    });
    return {
      targetEventIds: resolved.ids.length ? resolved.ids : (anySelection ? [] : [event.id]),
      warnings: resolved.warnings,
    };
  };

  container.querySelector('[data-form="participant"]')?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const { targetEventIds, warnings } = getTargets();
    if (!targetEventIds.length) return showToast(warnings[0] || "La fecha operativa no coincide con ninguna campana destino.");
    const response = await fetch(`/api/operations/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEventIds,
        participant: {
          index: Number(form.get("index")),
          name: form.get("name"),
          picks: Array.from({ length: Math.min(event.races, 30) }, (_, index) => form.get(`pick-${index + 1}`) || ""),
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el pronostico.");
    state.data = data;
    const updatedEvent = findEventById(event.id);
    const filled = new Set(safeArray(updatedEvent?.results).map((item) => String(item.race)));
    let nextRace = String(updatedEvent?.races || event.races || 1);
    for (let race = 1; race <= (updatedEvent?.races || event.races || 1); race += 1) {
      if (!filled.has(String(race))) {
        nextRace = String(race);
        break;
      }
    }
    state.adminResultRace = nextRace;
    render();
    showToast(warnings.length ? warnings[0] : "Pronostico guardado en las pollas seleccionadas.");
  });

  container.querySelector('[data-form="result"]')?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const { targetEventIds, warnings } = getTargets();
    if (!targetEventIds.length) return showToast(warnings[0] || "La fecha operativa no coincide con ninguna campana destino.");
    const raceNumber = Number(form.get("race"));
    if (!Number.isFinite(raceNumber) || raceNumber < 1 || raceNumber > event.races) {
      return showToast(`La carrera debe estar entre 1 y ${event.races}.`);
    }
    const race = String(raceNumber);
    const response = await fetch(`/api/operations/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEventIds,
        result: {
          race,
          empatePrimero: form.get("empatePrimero"),
          primero: form.get("primero"),
          ganador: form.get("ganador"),
          empateSegundo: form.get("empateSegundo"),
          segundo: form.get("segundo"),
          divSegundo: form.get("divSegundo"),
          empateTercero: form.get("empateTercero"),
          tercero: form.get("tercero"),
          divTercero: form.get("divTercero"),
          favorito: form.get("favorito"),
          retiros: parseRetirosInput(form.get("retiros")),
          retiro1: "",
          retiro2: "",
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el resultado.");
    state.data = data;
    render();
    showToast(warnings.length ? warnings[0] : `Resultado de carrera ${race} guardado en las pollas seleccionadas.`);
  });
}

function getAutomaticCampaignTargets(selection) {
  const ids = [];
  const warnings = [];
  const operationDate = String(selection.operationDate || "");
  const weekday = getWeekdayNameFromDate(operationDate);

  if (selection.includeDaily) {
    const dailyMatches = getEnabledCampaigns("daily").filter((campaign) => campaign.date === operationDate);
    dailyMatches.forEach((campaign) => {
      if (campaign.eventId) ids.push(campaign.eventId);
    });
    if (!dailyMatches.length) warnings.push(`No hay diaria activa para ${operationDate}.`);
  }

  if (selection.includeWeekly) {
    const weeklyMatches = getEnabledCampaigns("weekly").filter((campaign) => {
      const activeDays = safeArray(campaign.activeDays).length ? safeArray(campaign.activeDays) : safeArray(campaign.eventNames);
      return isDateWithinRange(operationDate, campaign.startDate, campaign.endDate) && (!activeDays.length || activeDays.includes(weekday));
    });
    weeklyMatches.forEach((campaign) => {
      const eventNames = safeArray(campaign.eventNames);
      const eventIds = safeArray(campaign.eventIds);
      const matchIndex = eventNames.findIndex((name) => name === weekday);
      if (matchIndex >= 0 && eventIds[matchIndex]) ids.push(eventIds[matchIndex]);
      else if (eventIds.length === 1) ids.push(eventIds[0]);
      else if (weekday && eventIds.length) warnings.push(`La semanal "${campaign.name}" no tiene jornada configurada para ${weekday}.`);
    });
    if (!weeklyMatches.length) warnings.push(`No hay semanal activa para ${operationDate}.`);
  }

  if (selection.includeMonthly) {
    const monthlyMatches = getEnabledCampaigns("monthly").filter((campaign) => isDateWithinRange(operationDate, campaign.startDate, campaign.endDate));
    monthlyMatches.forEach((campaign) => {
      const eventIds = safeArray(campaign.eventIds);
      if (eventIds.length === 1) ids.push(eventIds[0]);
      else if (eventIds.length > 1) ids.push(eventIds[0]);
      else ids.push(`${campaign.id}-general`);
    });
    if (!monthlyMatches.length) warnings.push(`No hay mensual activa para ${operationDate}.`);
  }

  return {
    ids: Array.from(new Set(ids.filter(Boolean))),
    warnings,
  };
}

renderOperationTargets = function renderOperationTargetsV2() {
  const operationDate = toLocalDateInputValue();
  return `<div class="panel"><div class="panel-head"><h4>Destino del guardado</h4><p>La fecha operativa busca sola las campanas activas de ese dia.</p></div><div class="stack"><div class="form-grid"><div class="field"><label>Fecha operativa</label><input data-operation-date type="date" value="${operationDate}" /></div></div><div class="check-grid"><label class="check-chip"><input type="checkbox" data-target-check="daily" checked /> Diaria</label><label class="check-chip"><input type="checkbox" data-target-check="weekly" checked /> Semanal</label><label class="check-chip"><input type="checkbox" data-target-check="monthly" checked /> Mensual</label></div><p class="hint">Ya no necesitas asociar una por una. Si una campaÃ±a esta activa en esa fecha, entra sola segun su rango y su tipo.</p></div></div>`;
}

renderResultsForm = function renderResultsFormV2(event) {
  const sortedResults = [...event.results].sort((a, b) => Number(a.race) - Number(b.race));
  const getNextPendingRace = () => {
    const filled = new Set(sortedResults.map((item) => String(item.race)));
    for (let race = 1; race <= event.races; race += 1) {
      if (!filled.has(String(race))) return String(race);
    }
    return String(event.races || 1);
  };
  const initialRace = state.adminResultRace && Number(state.adminResultRace) >= 1 && Number(state.adminResultRace) <= event.races
    ? String(state.adminResultRace)
    : getNextPendingRace();
  const defaultRace = initialRace;
  const current = event.results.find((item) => String(item.race) === defaultRace) || { race: defaultRace };
  const retirosValue = Array.isArray(current.retiros) && current.retiros.length ? current.retiros.join(", ") : [current.retiro1, current.retiro2].filter(Boolean).join(", ");
  const hasTie = Boolean(current.empatePrimero || current.empateSegundo || current.empateTercero);
  const showTieFirstColumn = sortedResults.some((item) => item.empatePrimero);
  const showTieSecondColumn = sortedResults.some((item) => item.empateSegundo);
  const showTieThirdColumn = sortedResults.some((item) => item.empateTercero);
  const sumFirst = (toNumeric(current.ganador) || 0) + (toNumeric(current.divSegundoPrimero ?? current.divSegundo) || 0) + (toNumeric(current.divTerceroPrimero ?? current.divTercero) || 0);
  const sumSecond = (toNumeric(current.divSegundo) || 0) + (toNumeric(current.divTerceroSegundo ?? current.divTercero) || 0);
  const sumThird = (toNumeric(current.divTercero) || 0);
  const resultColumns = ["C", "1Â°"];
  if (showTieFirstColumn) resultColumns.push("Emp 1Â°", "Gan Emp 1Â°", "2Â° Emp 1Â°", "3Â° Emp 1Â°");
  resultColumns.push("Gan", "2Â° del 1Â°", "3Â° del 1Â°", "2Â°");
  if (showTieSecondColumn) resultColumns.push("Emp 2Â°", "2Â° Emp 2Â°", "3Â° Emp 2Â°");
  resultColumns.push("2Â° del 2Â°", "3Â° del 2Â°", "3Â°");
  if (showTieThirdColumn) resultColumns.push("Emp 3Â°", "3Â° Emp 3Â°");
  resultColumns.push("3Â° del 3Â°", "Fav", "Retiros", "Editar");

  const resultRows = sortedResults.map((item) => {
    const row = [item.race, item.primero || "-"];
    if (showTieFirstColumn) row.push(
      item.empatePrimero || "-",
      item.empatePrimeroGanador ?? item.ganador ?? "-",
      item.empatePrimeroDivSegundo ?? item.divSegundoPrimero ?? item.divSegundo ?? "-",
      item.empatePrimeroDivTercero ?? item.divTerceroPrimero ?? item.divTercero ?? "-",
    );
    row.push(
      item.ganador || "-",
      item.divSegundoPrimero ?? item.divSegundo ?? "-",
      item.divTerceroPrimero ?? item.divTercero ?? "-",
      item.segundo || "-",
    );
    if (showTieSecondColumn) row.push(
      item.empateSegundo || "-",
      item.empateSegundoDivSegundo ?? item.divSegundo ?? "-",
      item.empateSegundoDivTercero ?? item.divTerceroSegundo ?? item.divTercero ?? "-",
    );
    row.push(
      item.divSegundo || "-",
      item.divTerceroSegundo ?? item.divTercero ?? "-",
      item.tercero || "-",
    );
    if (showTieThirdColumn) row.push(
      item.empateTercero || "-",
      item.empateTerceroDivTercero ?? item.divTercero ?? "-",
    );
    row.push(
      item.divTercero || "-",
      item.favorito || "-",
      (safeArray(item.retiros).join(", ") || [item.retiro1, item.retiro2].filter(Boolean).join(", ") || "-"),
      `<button type="button" class="ghost-button" data-edit-result="${item.race}">Editar</button>`,
    );
    return row;
  });

  return `${renderOperationTargets()}<form class="editor-form" data-form="result"><div class="panel-head"><h4>Resultados</h4><p>Carga por posicion. Si te equivocas, cambias el valor y vuelves a guardar.</p></div><div class="result-grid"><div class="field"><label>Carrera</label><input name="race" type="number" min="1" max="${event.races}" value="${defaultRace}" /></div><div class="result-block"><p class="label">Primero</p><div class="form-grid form-grid-4"><div class="field"><label>Numero</label><input name="primero" type="text" value="${current.primero || ""}" /></div><div class="field"><label>Div Ganador</label><input name="ganador" type="text" value="${current.ganador || ""}" /></div><div class="field"><label>Div 2Â° del 1Â°</label><input name="divSegundoPrimero" type="text" value="${current.divSegundoPrimero ?? current.divSegundo ?? ""}" /></div><div class="field"><label>Div 3Â° del 1Â°</label><input name="divTerceroPrimero" type="text" value="${current.divTerceroPrimero ?? current.divTercero ?? ""}" /></div><div class="field"><label>Suma 1Â°</label><input data-sum-first type="text" value="${sumFirst || ""}" readonly /></div></div></div><div class="result-block"><p class="label">Segundo</p><div class="form-grid form-grid-4"><div class="field"><label>Numero</label><input name="segundo" type="text" value="${current.segundo || ""}" /></div><div class="field"><label>Div 2Â° del 2Â°</label><input name="divSegundo" type="text" value="${current.divSegundo || ""}" /></div><div class="field"><label>Div 3Â° del 2Â°</label><input name="divTerceroSegundo" type="text" value="${current.divTerceroSegundo ?? current.divTercero ?? ""}" /></div><div class="field"><label>Suma 2Â°</label><input data-sum-second type="text" value="${sumSecond || ""}" readonly /></div></div></div><div class="result-block"><p class="label">Tercero</p><div class="form-grid form-grid-4"><div class="field"><label>Numero</label><input name="tercero" type="text" value="${current.tercero || ""}" /></div><div class="field"><label>Div 3Â° del 3Â°</label><input name="divTercero" type="text" value="${current.divTercero || ""}" /></div><div class="field"><label>Suma 3Â°</label><input data-sum-third type="text" value="${sumThird || ""}" readonly /></div></div></div><div class="result-block"><div class="toolbar"><p class="label">Empates</p><label class="check-chip compact"><input type="checkbox" name="hasTie"${hasTie ? " checked" : ""} /> Hay empate</label></div><div data-tie-panel${hasTie ? "" : ' hidden'}><div class="stack"><div class="result-block"><p class="label">Empate 1Â°</p><div class="form-grid form-grid-4"><div class="field"><label>Numero empatado en 1Â°</label><input name="empatePrimero" type="text" value="${current.empatePrimero || ""}" placeholder="Ej. 7" /></div><div class="field"><label>Ganador del empatado</label><input name="empatePrimeroGanador" type="text" value="${current.empatePrimeroGanador ?? current.ganador ?? ""}" /></div><div class="field"><label>Div 2Â° del empatado</label><input name="empatePrimeroDivSegundo" type="text" value="${current.empatePrimeroDivSegundo ?? current.divSegundoPrimero ?? current.divSegundo ?? ""}" /></div><div class="field"><label>Div 3Â° del empatado</label><input name="empatePrimeroDivTercero" type="text" value="${current.empatePrimeroDivTercero ?? current.divTerceroPrimero ?? current.divTercero ?? ""}" /></div></div></div><div class="result-block"><p class="label">Empate 2Â°</p><div class="form-grid form-grid-4"><div class="field"><label>Numero empatado en 2Â°</label><input name="empateSegundo" type="text" value="${current.empateSegundo || ""}" placeholder="Ej. 1" /></div><div class="field"><label>Div 2Â° del empatado</label><input name="empateSegundoDivSegundo" type="text" value="${current.empateSegundoDivSegundo ?? current.divSegundo ?? ""}" /></div><div class="field"><label>Div 3Â° del empatado</label><input name="empateSegundoDivTercero" type="text" value="${current.empateSegundoDivTercero ?? current.divTerceroSegundo ?? current.divTercero ?? ""}" /></div></div></div><div class="result-block"><p class="label">Empate 3Â°</p><div class="form-grid form-grid-4"><div class="field"><label>Numero empatado en 3Â°</label><input name="empateTercero" type="text" value="${current.empateTercero || ""}" placeholder="Ej. 9" /></div><div class="field"><label>Div 3Â° del empatado</label><input name="empateTerceroDivTercero" type="text" value="${current.empateTerceroDivTercero ?? current.divTercero ?? ""}" /></div></div></div></div></div></div><div class="result-block"><p class="label">Apoyos</p><div class="form-grid"><div class="field"><label>Favorito</label><input name="favorito" type="text" value="${current.favorito || ""}" /></div><div class="field"><label>Retiros</label><input name="retiros" type="text" value="${retirosValue}" placeholder="Ej. 6, 8, 11" /></div></div></div><div class="actions"><span class="hint">En empate escribe el numero del otro ejemplar que empatÃ³ y sus dividendos propios para ese lugar. La tabla de abajo solo mostrarÃ¡ columnas de empate cuando realmente existan.</span><button class="primary-button" type="submit">Guardar resultado</button></div></form><section class="panel"><div class="panel-head"><h4>Resultados registrados</h4><p>Lo que ya esta guardado para esta jornada.</p></div>${setTable(resultColumns, resultRows)}</section>`;
}

bindEventForms = function bindEventFormsV3(container, event) {
  const resultForm = container.querySelector('[data-form="result"]');
  const formatSummaryValue = (value) => {
    const rounded = Math.round(value * 100) / 100;
    if (!rounded) return "";
    return String(rounded).replace(".", ",");
  };
  const fillResultForm = (result) => {
    if (!resultForm || !result) return;
    const setField = (name, value) => {
      const input = resultForm.querySelector(`[name="${name}"]`);
      if (input) input.value = value || "";
    };
    setField("primero", result.primero);
    setField("ganador", result.ganador);
    setField("divSegundoPrimero", result.divSegundoPrimero ?? result.divSegundo);
    setField("divTerceroPrimero", result.divTerceroPrimero ?? result.divTercero);
    setField("segundo", result.segundo);
    setField("divSegundo", result.divSegundo);
    setField("divTerceroSegundo", result.divTerceroSegundo ?? result.divTercero);
    setField("tercero", result.tercero);
    setField("divTercero", result.divTercero);
    setField("favorito", result.favorito);
    setField("retiros", Array.isArray(result.retiros) && result.retiros.length ? result.retiros.join(", ") : [result.retiro1, result.retiro2].filter(Boolean).join(", "));
    const tieToggle = resultForm.querySelector('[name="hasTie"]');
    const tiePanel = resultForm.querySelector("[data-tie-panel]");
    const hasTie = Boolean(result.empatePrimero || result.empateSegundo || result.empateTercero);
    if (tieToggle) tieToggle.checked = hasTie;
    if (tiePanel) tiePanel.hidden = !hasTie;
    setField("empatePrimero", result.empatePrimero);
    setField("empateSegundo", result.empateSegundo);
    setField("empateTercero", result.empateTercero);
  };
  const syncResultSummary = () => {
    if (!resultForm) return;
    const ganador = toNumeric(resultForm.querySelector('[name="ganador"]')?.value) || 0;
    const divSegundoPrimero = toNumeric(resultForm.querySelector('[name="divSegundoPrimero"]')?.value) || 0;
    const divTerceroPrimero = toNumeric(resultForm.querySelector('[name="divTerceroPrimero"]')?.value) || 0;
    const divSegundo = toNumeric(resultForm.querySelector('[name="divSegundo"]')?.value) || 0;
    const divTerceroSegundo = toNumeric(resultForm.querySelector('[name="divTerceroSegundo"]')?.value) || 0;
    const divTercero = toNumeric(resultForm.querySelector('[name="divTercero"]')?.value) || 0;
    const writeValue = (selector, value) => {
      const node = resultForm.querySelector(selector);
      if (!node) return;
      const text = formatSummaryValue(value);
      if ("value" in node) node.value = text === "-" ? "" : text;
      else node.textContent = text || "-";
    };
    writeValue("[data-sum-first]", ganador + divSegundoPrimero + divTerceroPrimero);
    writeValue("[data-sum-second]", divSegundo + divTerceroSegundo);
    writeValue("[data-sum-third]", divTercero);
  };

  resultForm?.querySelectorAll('[name="ganador"], [name="divSegundoPrimero"], [name="divTerceroPrimero"], [name="divSegundo"], [name="divTerceroSegundo"], [name="divTercero"]').forEach((input) => {
    input.addEventListener("input", syncResultSummary);
  });
  resultForm?.querySelector('[name="hasTie"]')?.addEventListener("change", (toggleEvent) => {
    const tiePanel = resultForm.querySelector("[data-tie-panel]");
    if (tiePanel) tiePanel.hidden = !toggleEvent.target.checked;
    if (!toggleEvent.target.checked) {
      ["empatePrimero", "empateSegundo", "empateTercero"].forEach((name) => {
        const input = resultForm.querySelector(`[name="${name}"]`);
        if (input) input.value = "";
      });
    }
  });
  resultForm?.querySelector('[name="race"]')?.addEventListener("change", (raceEvent) => {
    const raceNumber = String(raceEvent.target.value || "");
    state.adminResultRace = raceNumber;
    const saved = event.results.find((item) => String(item.race) === raceNumber) || { race: raceNumber };
    if (saved.primero || saved.segundo || saved.tercero) fillResultForm(saved);
    else clearResultForm(raceNumber);
    syncResultSummary();
  });
  container.querySelectorAll("[data-edit-result]").forEach((button) => {
    button.addEventListener("click", () => {
      const raceNumber = String(button.dataset.editResult || "");
      const raceInput = resultForm?.querySelector('[name="race"]');
      if (raceInput) raceInput.value = raceNumber;
      state.adminResultRace = raceNumber;
      const saved = event.results.find((item) => String(item.race) === raceNumber) || { race: raceNumber };
      fillResultForm(saved);
      syncResultSummary();
      resultForm?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  syncResultSummary();

  const getTargets = () => {
    const operationDate = container.querySelector("[data-operation-date]")?.value || "";
    const resolved = getAutomaticCampaignTargets({
      operationDate,
      includeDaily: Boolean(container.querySelector('[data-target-check="daily"]')?.checked),
      includeWeekly: Boolean(container.querySelector('[data-target-check="weekly"]')?.checked),
      includeMonthly: Boolean(container.querySelector('[data-target-check="monthly"]')?.checked),
    });
    return {
      targetEventIds: resolved.ids,
      warnings: resolved.warnings,
    };
  };

  container.querySelector('[data-form="participant"]')?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const { targetEventIds, warnings } = getTargets();
    if (!targetEventIds.length) return showToast(warnings.join(" ") || "No hay campaÃ±as activas para esa fecha.");
    const response = await fetch(`/api/operations/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEventIds,
        participant: {
          index: Number(form.get("index")),
          name: form.get("name"),
          picks: Array.from({ length: Math.min(event.races, 30) }, (_, index) => form.get(`pick-${index + 1}`) || ""),
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el pronostico.");
    state.data = data;
    render();
    showToast(warnings.length ? warnings.join(" ") : "Pronostico guardado segun la fecha operativa.");
  });

  container.querySelector('[data-form="result"]')?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const { targetEventIds, warnings } = getTargets();
    if (!targetEventIds.length) return showToast(warnings.join(" ") || "No hay campaÃ±as activas para esa fecha.");
    const raceNumber = Number(form.get("race"));
    if (!Number.isFinite(raceNumber) || raceNumber < 1 || raceNumber > event.races) {
      return showToast(`La carrera debe estar entre 1 y ${event.races}.`);
    }
    const race = String(raceNumber);
    const response = await fetch(`/api/operations/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEventIds,
        result: {
          race,
          empatePrimero: form.get("hasTie") === "on" ? form.get("empatePrimero") : "",
          primero: form.get("primero"),
          ganador: form.get("ganador"),
          divSegundoPrimero: form.get("divSegundoPrimero"),
          divTerceroPrimero: form.get("divTerceroPrimero"),
          empatePrimeroGanador: form.get("hasTie") === "on" ? form.get("empatePrimeroGanador") : "",
          empatePrimeroDivSegundo: form.get("hasTie") === "on" ? form.get("empatePrimeroDivSegundo") : "",
          empatePrimeroDivTercero: form.get("hasTie") === "on" ? form.get("empatePrimeroDivTercero") : "",
          empateSegundo: form.get("hasTie") === "on" ? form.get("empateSegundo") : "",
          segundo: form.get("segundo"),
          divSegundo: form.get("divSegundo"),
          divTerceroSegundo: form.get("divTerceroSegundo"),
          empateSegundoDivSegundo: form.get("hasTie") === "on" ? form.get("empateSegundoDivSegundo") : "",
          empateSegundoDivTercero: form.get("hasTie") === "on" ? form.get("empateSegundoDivTercero") : "",
          empateTercero: form.get("hasTie") === "on" ? form.get("empateTercero") : "",
          tercero: form.get("tercero"),
          divTercero: form.get("divTercero"),
          empateTerceroDivTercero: form.get("hasTie") === "on" ? form.get("empateTerceroDivTercero") : "",
          favorito: form.get("favorito"),
          retiros: parseRetirosInput(form.get("retiros")),
          retiro1: "",
          retiro2: "",
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el resultado.");
    state.data = data;
    const updatedEvent = eventById(state.data.semanal.events, event.id) || eventById(state.data.mensual.events, event.id) || event;
    state.adminResultRace = getNextPendingRace(updatedEvent.results);
    render();
    showToast(warnings.length ? warnings.join(" ") : `Resultado de carrera ${race} guardado segun la fecha operativa.`);
  });
}

function getEventViewLabel(event) {
  const title = String(event?.title || "").trim();
  const sheetName = String(event?.sheetName || "").trim();
  if (title && sheetName && title !== sheetName) return `${title} Â· ${sheetName}`;
  return title || sheetName || event?.id || "Jornada";
}

function getScoringModeLabel(scoring) {
  return scoring?.mode === "points" ? "Puntos" : "Dividendos";
}

function getCampaignDisplayLabel(campaign) {
  return `${campaign?.name || "Campana"} Â· ${getScoringModeLabel(campaign?.scoring)}`;
}

function getCampaignMatchesByDate(kind, operationDate) {
  const weekday = getWeekdayNameFromDate(operationDate);
  return getEnabledCampaigns(kind).flatMap((campaign) => {
    if (kind === "daily") {
      if (String(campaign.date || "") !== String(operationDate || "")) return [];
      return [{
        kind,
        id: campaign.id,
        label: getCampaignDisplayLabel(campaign),
        eventIds: [campaign.eventId || `campaign-${campaign.id}`],
      }];
    }
    if (kind === "weekly") {
      if (!isDateWithinRange(operationDate, campaign.startDate, campaign.endDate)) return [];
      const activeDays = safeArray(campaign.activeDays).length ? safeArray(campaign.activeDays) : safeArray(campaign.eventNames);
      if (activeDays.length && !activeDays.includes(weekday)) return [];
      const eventIds = safeArray(campaign.eventIds);
      const eventNames = safeArray(campaign.eventNames);
      const matchIndex = eventNames.indexOf(weekday) >= 0 ? eventNames.indexOf(weekday) : activeDays.indexOf(weekday);
      const eventId = eventIds[matchIndex >= 0 ? matchIndex : 0] || eventIds[0];
      const dayLabel = eventNames[matchIndex >= 0 ? matchIndex : 0] || weekday || campaign.name || "Semanal";
      if (!eventId) return [];
      return [{
        kind,
        id: campaign.id,
        label: `${getCampaignDisplayLabel(campaign)} Â· ${dayLabel}`,
        eventIds: [eventId],
      }];
    }
    if (!isDateWithinRange(operationDate, campaign.startDate, campaign.endDate)) return [];
    const eventIds = safeArray(campaign.eventIds).length ? safeArray(campaign.eventIds) : [`${campaign.id}-general`];
    const eventDates = safeArray(campaign.eventDates);
    const eventNames = safeArray(campaign.eventNames);
    const matchIndex = eventDates.indexOf(operationDate) >= 0
      ? eventDates.indexOf(operationDate)
      : eventNames.findIndex((name) => String(name || "").includes(operationDate));
    const matchedEventId = eventIds[matchIndex >= 0 ? matchIndex : 0] || eventIds[0];
    return [{
      kind,
      id: campaign.id,
      label: getCampaignDisplayLabel(campaign),
      eventIds: [matchedEventId].filter(Boolean),
    }];
  });
}

function syncAdminTargetSelections(operationDate, event) {
  if (state.adminTargetSelections.operationDate !== operationDate) {
    state.adminTargetSelections = {
      operationDate,
      groupId: "",
      programTrackId: "",
      daily: [],
      weekly: [],
      monthly: [],
    };
  }
  ["daily", "weekly", "monthly"].forEach((kind) => {
    const matches = getCampaignMatchesByDate(kind, operationDate);
    const validIds = matches.map((item) => item.id);
    let selected = safeArray(state.adminTargetSelections[kind]).filter((id) => validIds.includes(id));
    if (!selected.length) {
      const currentMatch = matches.find((item) => safeArray(item.eventIds).includes(event?.id));
      if (currentMatch) selected = [currentMatch.id];
      else if (matches.length === 1) selected = [matches[0].id];
    }
    state.adminTargetSelections[kind] = selected;
  });
}

function renderCampaignTargetGroup(kind, operationDate, event) {
  const titleMap = { daily: "Diaria", weekly: "Semanal", monthly: "Mensual" };
  const matches = getCampaignMatchesByDate(kind, operationDate);
  const selectedIds = safeArray(state.adminTargetSelections[kind]);
  const content = matches.length
    ? `<div class="check-grid">${matches.map((match) => {
        const checked = selectedIds.includes(match.id);
        const isCurrent = safeArray(match.eventIds).includes(event?.id);
        return `<label class="check-chip wide"><input type="checkbox" data-target-campaign="${kind}" value="${match.id}"${checked ? " checked" : ""} /> ${match.label}${isCurrent ? ' <span class="hint-inline">actual</span>' : ""}</label>`;
      }).join("")}</div>`
    : `<p class="hint">No hay campaÃ±as ${titleMap[kind].toLowerCase()}s activas para ${operationDate}.</p>`;
  return `<div class="panel compact"><div class="panel-head"><h4>${titleMap[kind]}</h4><p>CampaÃ±as que sÃ­ calzan con la fecha operativa.</p></div>${content}</div>`;
}

getDailyCampaignEvents = function getDailyCampaignEventsV2(currentDate = toLocalDateInputValue()) {
  if (!state.data?.semanal?.events) return [];
  const eventMap = new Map(state.data.semanal.events.map((event) => [event.id, event]));
  return getCampaigns("daily")
    .filter((campaign) => campaign.enabled !== false)
    .filter((campaign) => String(campaign.date || "") === currentDate)
    .map((campaign) => {
      const eventId = campaign.eventId || `campaign-${campaign.id}`;
      const baseEvent = eventMap.get(eventId) || createEmptyEvent(eventId, campaign.eventName || campaign.date || campaign.name || "Diaria");
      const eventDate = String(campaign.date || baseEvent.date || currentDate).trim();
      return {
        ...baseEvent,
        date: eventDate,
        operationDate: eventDate,
        campaign,
        campaignId: campaign.id,
        programTrackId: getCampaignProgramTrackId(campaign, eventDate, baseEvent.programTrackId || ""),
        title: campaign.name || baseEvent.title || baseEvent.sheetName,
        viewLabel: campaign.name || baseEvent.title || baseEvent.sheetName || campaign.date,
      };
    });
}

getWeeklyEvents = function getWeeklyEventsV2() {
  if (!state.data?.semanal?.events) return [];
  const eventMap = new Map(state.data.semanal.events.map((event) => [event.id, event]));
  const campaigns = getEnabledCampaigns("weekly");
  if (!campaigns.length) {
    return state.data.semanal.events
      .filter((event) => safeArray(state.data.settings.weekly.activeDays).includes(event.sheetName))
      .map((event) => ({ ...event, viewLabel: getEventViewLabel(event) }));
  }
  return campaigns
    .flatMap((campaign) => {
      const eventIds = safeArray(campaign.eventIds).length
        ? safeArray(campaign.eventIds)
        : safeArray(campaign.activeDays).map((day) => `${campaign.id}-${normalizeIdPart(day)}`);
      const eventNames = safeArray(campaign.eventNames);
      const eventDates = safeArray(campaign.eventDates);
      return eventIds.map((eventId, index) => {
        const baseEvent = eventMap.get(eventId) || createEmptyEvent(eventId, eventNames[index] || `${campaign.name || "Semanal"} ${index + 1}`, "semanal", campaign.raceCount || 12);
        const dayLabel = eventNames[index] || baseEvent.sheetName;
        const eventDate = String(eventDates[index] || baseEvent.date || "").trim();
        return {
          ...baseEvent,
          date: eventDate,
          operationDate: eventDate,
          campaign,
          campaignId: campaign.id,
          programTrackId: getCampaignProgramTrackId(campaign, eventDate, baseEvent.programTrackId || ""),
          title: campaign.name || baseEvent.title || "Semanal",
          sheetName: dayLabel,
          viewLabel: campaign.name ? `${campaign.name} Â· ${dayLabel}` : dayLabel,
        };
      });
    })
    .sort((a, b) => getEventViewLabel(a).localeCompare(getEventViewLabel(b), "es"));
}

getMonthlyEvents = function getMonthlyEventsV2() {
  if (!state.data?.mensual?.events) return [];
  const eventMap = new Map(state.data.mensual.events.map((event) => [event.id, event]));
  const campaigns = getEnabledCampaigns("monthly");
  if (!campaigns.length) {
    const ids = safeArray(state.data.settings.monthly.selectedEventIds);
    const events = ids.length ? state.data.mensual.events.filter((event) => ids.includes(event.id)) : state.data.mensual.events;
    return events.map((event) => ({ ...event, viewLabel: getEventViewLabel(event) }));
  }
  return campaigns
    .flatMap((campaign) => {
      const eventIds = safeArray(campaign.eventIds).length ? safeArray(campaign.eventIds) : [`${campaign.id}-general`];
      const eventNames = safeArray(campaign.eventNames);
      const eventDates = safeArray(campaign.eventDates);
      return eventIds.map((eventId, index) => {
        const baseEvent = eventMap.get(eventId) || createEmptyEvent(eventId, eventNames[index] || campaign.name || `Mensual ${index + 1}`, "mensual", campaign.raceCount || 12);
        const sheetLabel = eventNames[index] || baseEvent.sheetName || campaign.name || `Mensual ${index + 1}`;
        const eventDate = String(eventDates[index] || baseEvent.date || "").trim();
        return {
          ...baseEvent,
          date: eventDate,
          operationDate: eventDate,
          campaign,
          campaignId: campaign.id,
          programTrackId: getCampaignProgramTrackId(campaign, eventDate, baseEvent.programTrackId || ""),
          title: campaign.name || baseEvent.title || "Mensual",
          sheetName: sheetLabel,
          viewLabel: campaign.name && sheetLabel !== campaign.name ? `${campaign.name} Â· ${sheetLabel}` : (campaign.name || sheetLabel),
        };
      });
    })
    .sort((a, b) => getEventViewLabel(a).localeCompare(getEventViewLabel(b), "es"));
}

function getWeeklyCampaignGroups() {
  const events = getWeeklyEvents();
  const groups = new Map();
  events.forEach((event) => {
    const campaignId = safeArray(getEnabledCampaigns("weekly")).find((campaign) => safeArray(campaign.eventIds).includes(event.id))?.id || event.title || event.id;
    const campaignName = safeArray(getEnabledCampaigns("weekly")).find((campaign) => safeArray(campaign.eventIds).includes(event.id))?.name || event.title || "Semanal";
    const existing = groups.get(campaignId) || {
      id: campaignId,
      name: campaignName,
      events: [],
    };
    existing.events.push(event);
    groups.set(campaignId, existing);
  });
  return Array.from(groups.values()).map((group) => ({
    ...group,
    events: group.events.sort((a, b) => {
      const order = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
      return order.indexOf(a.sheetName) - order.indexOf(b.sheetName);
    }),
  }));
}

renderPicksTable = function renderPicksTableV2(event, title = "Pronosticos registrados", copy = "Detalle por carrera. La carga rapida ahora vive en Administrador > Pronostico.") {
  const scoringMode = event?.scoring?.mode || "dividend";
  return `<section class="panel"><div class="panel-head"><h3>${title}</h3><p>${copy}</p></div>${setTable(["N", "Stud", "Total", ...Array.from({ length: event.races }, (_, index) => `C${index + 1}`)], event.participants.map((participant) => [participant.index, participant.name, formatScoreValue(participant.points, scoringMode), ...participant.picks.map((pick) => pick.horse ? `${pick.horse} Â· ${formatScoreValue(pick.score || 0, scoringMode)}` : "-")]))}</section>`;
}

renderDailyContent = function renderDailyContentV2() {
  const today = toLocalDateInputValue();
  const dailyEvents = getDailyCampaignEvents(today);
  const event = eventById(dailyEvents, state.dailyEventId);
  state.dailyEventId = event?.id || null;
  if (!event) {
    dailyView.innerHTML = `${renderHero("Diaria", "La diaria ahora depende de la fecha de la campaÃ±a activa.", [
      { label: "Participantes", value: 0 },
      { label: "Carreras", value: 0 },
      { label: "Fecha", value: today },
      { label: "Campanas hoy", value: 0 },
    ])}<section class="panel"><div class="panel-head"><h3>Sin diaria para esta fecha</h3><p>No hay una campaÃ±a diaria asociada a ${today}. Cuando la fecha de la campaÃ±a coincida, aquÃ­ aparecerÃ¡ su informaciÃ³n.</p></div></section>`;
    return;
  }
  const race = getFocusRace(event);
  const distribution = getDistribution(event, race);
  const scoringMode = event?.scoring?.mode || "dividend";
  dailyView.innerHTML = `${renderHero(`Diaria Â· ${event.viewLabel || getEventViewLabel(event)}`, "AquÃ­ ves solo la diaria que corresponde a la fecha activa.", [
    { label: "Participantes", value: event.participants.length },
    { label: "Carreras", value: event.races },
    { label: "Proxima carrera", value: race },
    { label: "Fecha", value: today },
  ])}<section class="panel"><div class="toolbar"><div><p class="label">Jornada diaria</p><div class="toolbar-group" id="dailyTabs"></div></div><span class="tag">${state.data.storage.overridesFile}</span></div></section><section class="grid-3"><section class="panel"><div class="panel-head"><h3>Carrera en curso</h3><p>Lo que se viene ahora.</p></div><div class="stack"><div class="mini-card"><span class="label">Carrera</span><strong>${race}</strong></div><ul class="list">${distribution.map((item) => `<li><span>Caballo ${item.horse}</span><strong>${item.count} picks</strong></li>`).join("")}</ul></div></section><section class="panel"><div class="panel-head"><h3>Ranking</h3><p>Total claro por jornada.</p></div>${setTable(["Lugar", "Stud", "Total"], event.leaderboard.slice(0, 12).map((participant, index) => [index + 1, participant.name, formatScoreValue(participant.points, scoringMode)]))}</section><section class="panel"><div class="panel-head"><h3>Resultados</h3><p>Lectura simple.</p></div>${setTable(["C", "1Â°", "Div", "2Â°", "Div", "3Â°", "Div"], event.results.slice(0, 10).map((item) => [item.race, item.primero || "-", formatDividend(item.ganador), item.segundo || "-", formatDividend(item.divSegundo), item.tercero || "-", formatDividend(item.divTercero)]))}</section></section>${renderPicksTable(event)}`;
  const tabs = dailyView.querySelector("#dailyTabs");
  dailyEvents.forEach((item) => {
    const button = document.createElement("button");
    button.className = `subnav-button${item.id === event.id ? " active" : ""}`;
    button.textContent = item.viewLabel || getEventViewLabel(item);
    button.addEventListener("click", () => {
      state.dailyEventId = item.id;
      render();
    });
    tabs.appendChild(button);
  });
}

setTimeout(render, 0);

renderWeeklyContent = function renderWeeklyContentV2() {
  const groups = getWeeklyCampaignGroups();
  const selectedGroup = groups.find((group) => group.id === state.weeklyCampaignId) || groups[0] || null;
  state.weeklyCampaignId = selectedGroup?.id || null;
  const events = selectedGroup?.events || [];
  const total = aggregateEvents(events, "Acumulado semanal", "weekly-total");
  const selected = state.weeklyTab === "total" ? null : events.find((event) => event.id === state.weeklyTab) || events[0] || null;
  const scoringMode = (selected?.scoring?.mode || events[0]?.scoring?.mode || "dividend");
  weeklyView.innerHTML = `${renderHero("Semanal", "La semanal muestra solo lo que corresponde a ese producto. Puedes ver el total acumulado o entrar a un dÃ­a puntual.", [
    { label: "Formato", value: state.data.settings.weekly.format },
    { label: "Dias activos", value: state.data.settings.weekly.activeDays.length },
    { label: "Final", value: safeArray(state.data.settings.weekly.finalDays).join(", ") || "-" },
    { label: "Modo", value: state.data.settings.weekly.pairMode ? "Parejas" : "Individual" },
  ])}<section class="panel"><div class="toolbar"><div class="stack" style="width:100%"><div class="form-grid"><div class="field"><label>CampaÃ±a semanal</label><select id="weeklyCampaignSelect">${groups.map((group) => `<option value="${group.id}"${group.id === state.weeklyCampaignId ? " selected" : ""}>${group.name}</option>`).join("")}</select></div></div><div><p class="label">Vista semanal</p><div class="toolbar-group" id="weeklyTabs"></div></div></div><span class="tag">Configurable desde administrador</span></div></section><section id="weeklyBody"></section>`;
  ["total", ...events.map((event) => event.id)].forEach((id) => {
    const event = events.find((item) => item.id === id);
    const button = document.createElement("button");
    button.className = `subnav-button${state.weeklyTab === id ? " active" : ""}`;
    button.textContent = id === "total" ? "TOTAL" : (event?.sheetName || event?.viewLabel || getEventViewLabel(event)).toUpperCase();
    button.addEventListener("click", () => {
      state.weeklyTab = id;
      render();
    });
    weeklyView.querySelector("#weeklyTabs").appendChild(button);
  });
  weeklyView.querySelector("#weeklyCampaignSelect")?.addEventListener("change", (changeEvent) => {
    state.weeklyCampaignId = changeEvent.target.value;
    state.weeklyTab = "total";
    render();
  });
  if (!groups.length) {
    weeklyView.querySelector("#weeklyBody").innerHTML = `<section class="panel"><div class="panel-head"><h3>Sin informacion semanal</h3><p>No hay jornadas semanales disponibles con la fuente actual. Si apagaste Excel base, esto es normal hasta que carguemos jornadas desde administrador.</p></div></section>`;
    return;
  }
  if (!events.length) {
    weeklyView.querySelector("#weeklyBody").innerHTML = `<section class="panel"><div class="panel-head"><h3>Sin jornadas en esta campaÃ±a</h3><p>La campaÃ±a seleccionada todavÃ­a no tiene dÃ­as cargados.</p></div></section>`;
    return;
  }
  weeklyView.querySelector("#weeklyBody").innerHTML =
    state.weeklyTab === "total"
      ? `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>${selectedGroup?.name || "Acumulado semanal"}</h3><p>Total de la campaÃ±a seleccionada.</p></div>${setTable(["Lugar", "Stud", "1Â°", "2Â°", "3Â°", "Aciertos", "Total"], total.participants.slice(0, 20).map((item, index) => [index + 1, item.name, item.firsts, item.seconds, item.thirds, item.hits, formatScoreValue(item.totalPoints, scoringMode)]))}</section><section class="panel"><div class="panel-head"><h3>DÃ­as activos</h3><p>Resumen rÃ¡pido de esta campaÃ±a.</p></div><div class="cards two">${events.map((event) => `<article class="mini-card"><span class="label">${event.sheetName}</span><strong>${formatScoreValue(event.leaderboard[0]?.points || 0, event?.scoring?.mode || scoringMode)}</strong><p class="hint">Lider: ${event.leaderboard[0]?.name || "Sin datos"}</p></article>`).join("")}</div></section></section>`
      : selected
        ? `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>${selectedGroup?.name || "Semanal"} Â· ${selected.sheetName}</h3><p>Detalle del dÃ­a seleccionado.</p></div>${setTable(["Lugar", "Stud", "Total"], selected.leaderboard.slice(0, 15).map((participant, index) => [index + 1, participant.name, formatScoreValue(participant.points, selected?.scoring?.mode || scoringMode)]))}</section><section class="panel"><div class="panel-head"><h3>Carrera en foco</h3><p>Carrera ${getFocusRace(selected)}</p></div><ul class="list">${getDistribution(selected, getFocusRace(selected)).map((item) => `<li><span>Caballo ${item.horse}</span><strong>${item.count} picks</strong></li>`).join("")}</ul></section></section>${renderPicksTable(selected, "Pronosticos registrados", "Detalle del dÃ­a seleccionado.")}`
        : "";
}

renderMonthlyContent = function renderMonthlyContentV2() {
  const events = getMonthlyEvents();
  const total = aggregateEvents(events, "Acumulado mensual", "monthly-total");
  const selected = state.monthlyTab === "total" ? null : events.find((event) => event.id === state.monthlyTab) || events[0] || null;
  const scoringMode = (selected?.scoring?.mode || events[0]?.scoring?.mode || "dividend");
  monthlyView.innerHTML = `${renderHero("Mensual", "La mensual tiene una vista total y una por jornada. Lo que entra al cÃ¡lculo se define en administrador por campaÃ±as, fechas, hipÃ³dromos y jornadas.", [
    { label: "Hipodromos", value: safeArray(state.data.settings.monthly.hipodromos).join(", ") || "-" },
    { label: "Inicio", value: state.data.settings.monthly.startDate || "-" },
    { label: "Termino", value: state.data.settings.monthly.endDate || "-" },
    { label: "Jornadas", value: events.length },
  ])}<section class="panel"><div class="toolbar"><div><p class="label">Vista mensual</p><div class="toolbar-group" id="monthlyTabs"></div></div><span class="tag">Acumulado configurable</span></div></section><section id="monthlyBody"></section>`;
  ["total", ...events.map((event) => event.id)].forEach((id) => {
    const event = events.find((item) => item.id === id);
    const button = document.createElement("button");
    button.className = `subnav-button${state.monthlyTab === id ? " active" : ""}`;
    button.textContent = id === "total" ? "TOTAL" : (event?.viewLabel || getEventViewLabel(event)).toUpperCase();
    button.addEventListener("click", () => {
      state.monthlyTab = id;
      render();
    });
    monthlyView.querySelector("#monthlyTabs").appendChild(button);
  });
  if (!events.length) {
    monthlyView.querySelector("#monthlyBody").innerHTML = `<section class="panel"><div class="panel-head"><h3>Sin informacion mensual</h3><p>No hay jornadas mensuales disponibles con la fuente actual. Si apagaste Excel base, esto es normal hasta que carguemos jornadas desde administrador.</p></div></section>`;
    return;
  }
  monthlyView.querySelector("#monthlyBody").innerHTML =
    state.monthlyTab === "total"
      ? `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Acumulado mensual</h3><p>Total de jornadas incluidas.</p></div>${setTable(["Lugar", "Stud", "1Â°", "2Â°", "3Â°", "Aciertos", "Total"], total.participants.slice(0, 20).map((item, index) => [index + 1, item.name, item.firsts, item.seconds, item.thirds, item.hits, formatScoreValue(item.totalPoints, scoringMode)]))}</section><section class="panel"><div class="panel-head"><h3>Tabla resumen</h3><p>Hoja general mensual.</p></div>${setTable(["Lugar", "Stud", ...state.data.mensual.tabla.headers.slice(0, 4)], state.data.mensual.tabla.standings.slice(0, 12).map((row) => [row.place, row.stud, ...row.scores.slice(0, 4).map((item) => formatDividend(item.value))]))}</section></section>`
      : selected
        ? `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>${selected.viewLabel || getEventViewLabel(selected)}</h3><p>Jornada puntual.</p></div>${setTable(["Lugar", "Stud", "Total"], selected.leaderboard.slice(0, 15).map((participant, index) => [index + 1, participant.name, formatScoreValue(participant.points, selected?.scoring?.mode || scoringMode)]))}</section><section class="panel"><div class="panel-head"><h3>Resultados</h3><p>Detalle de la jornada.</p></div>${setTable(["C", "1Â°", "Div", "2Â°", "Div", "3Â°", "Div"], selected.results.slice(0, 12).map((item) => [item.race, item.primero || "-", formatDividend(item.ganador), item.segundo || "-", formatDividend(item.divSegundo), item.tercero || "-", formatDividend(item.divTercero)]))}</section></section>${renderPicksTable(selected, "Pronosticos registrados", "Detalle de la jornada mensual seleccionada.")}`
        : "";
}

function render() {
  if (state.data) {
    persistAdminSession();
  }
  renderNav();
  if (!state.data) {
    adminView.hidden = state.currentView !== "admin";
    dailyView.hidden = state.currentView !== "daily";
    weeklyView.hidden = state.currentView !== "weekly";
    monthlyView.hidden = state.currentView !== "monthly";
    return;
  }
  adminView.hidden = state.currentView !== "admin";
  dailyView.hidden = state.currentView !== "daily";
  weeklyView.hidden = state.currentView !== "weekly";
  monthlyView.hidden = state.currentView !== "monthly";
  if (state.currentView === "admin") renderAdminContent();
  if (state.currentView === "daily") renderDailyContent();
  if (state.currentView === "weekly") renderWeeklyContent();
  if (state.currentView === "monthly") renderMonthlyContent();
  bindPanelImageExports(document);
  bindWhatsAppExport();
}

loadDashboard = async function loadDashboardV2b() {
  const response = await fetch("/api/data");
  const payload = await response.json();
  if (!response.ok) return showToast(payload.detail || payload.error || "No se pudo cargar la app.");
  const persistedSession = loadPersistedAdminSession();
  state.data = payload;
  if (persistedSession.currentView && ["admin", "daily", "weekly", "monthly"].includes(persistedSession.currentView)) {
    state.currentView = persistedSession.currentView;
  }
  if (persistedSession.adminTab) {
    state.adminTab = persistedSession.adminTab;
  }
  if (persistedSession.campaignsTab) {
    state.campaignsTab = persistedSession.campaignsTab;
  }
  if (persistedSession.adminUnlocked) {
    state.adminUnlocked = true;
    state.currentAdminUser = persistedSession.currentAdminUser || null;
    state.currentView = "admin";
  }
  state.dailyEventId = getDailyCampaignEvents(toLocalDateInputValue())[0]?.id || null;
  state.adminOpsEventId = state.data.semanal.events[0]?.id || null;
  state.weeklyTab = state.data.settings.weekly.showTotalsByDefault ? "total" : (getWeeklyEvents()[0]?.id || "total");
  state.monthlyTab = state.data.settings.monthly.showTotalsByDefault ? "total" : (getMonthlyEvents()[0]?.id || "total");
  render();
}

loadDashboard();

renderPicksTable = function renderPicksTableV3(event, title = "Pronosticos registrados", copy = "Detalle por carrera. La carga rapida ahora vive en Administrador > Pronostico.", options = {}) {
  const scoringMode = event?.scoring?.mode || "dividend";
  const maxScore = getMaxPickScore(event);
  const rows = safeArray(event.participants);
  const theme = options.theme || (normalizeText(title).includes("mensual") ? "monthly" : normalizeText(title).includes("semanal") ? "weekly" : "daily");
  const palette = getViewAccentPalette(theme);
  const program = options.program || getProgramForEventFinal({ ...event, campaign: options.campaign }, options.programTrackId || "");
  const showEdit = state.currentView === "admin" && state.adminUnlocked && state.adminTab === "forecasts";
  const compactToScreen = !showEdit && (event?.races || 0) >= 12;
  if (!rows.length) {
    return `<section class="panel panel-picks" style="border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt});"><div class="panel-head"><h3>${title}</h3><p>${copy}</p></div><div class="empty">Todavia no hay pronosticos registrados.</div></section>`;
  }
  const renderPickCell = (pick, raceNumber) => {
    const score = toNumeric(pick?.score) || 0;
    const horse = String(pick?.horse || "-").trim() || "-";
    const runnerName = getRunnerNameFromProgram(program, raceNumber, horse);
    const runnerLabel = runnerName || (program ? "Sin nombre para ese numero" : "Programa no cargado");
    if (compactToScreen) {
      return `<div class="score-cell score-cell-compact ${getScoreToneClass(score, maxScore)}" style="min-height:54px; padding:4px 4px 3px; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; gap:1px; border-radius:10px;"><strong style="font-size:15px; line-height:1">${horse}</strong><span class="runner-label" style="display:none">${runnerLabel}</span><span class="score-value" style="font-weight:800; font-size:11px; opacity:1; margin-top:1px">${formatScoreValue(score, scoringMode)}</span></div>`;
    }
    return `<div class="score-cell score-cell-compact ${getScoreToneClass(score, maxScore)}" style="min-height:72px; padding:10px 10px; display:flex; flex-direction:column; align-items:flex-start; justify-content:center; gap:2px; border-radius:14px;"><strong style="font-size:17px; line-height:1">${horse}</strong><span class="runner-label" style="font-size:11px; line-height:1.2; opacity:0.82; min-height:26px; display:block">${runnerLabel}</span><span class="score-value" style="font-weight:700; font-size:12px; opacity:0.92; margin-top:2px">${formatScoreValue(score, scoringMode)}</span></div>`;
  };
  const exportName = `${normalizeText(title || "pronosticos")}-${normalizeText(event?.viewLabel || getEventViewLabel(event) || "jornada")}`;
  const exportActions = showEdit ? "" : `<div class="actions"><button type="button" class="ghost-button" data-export-panel-image data-export-mode="share" data-export-name="${exportName}">Compartir imagen</button><button type="button" class="ghost-button" data-export-panel-image data-export-mode="copy" data-export-name="${exportName}">Copiar imagen</button><button type="button" class="ghost-button" data-export-whatsapp="true" data-event-id="${event?.id || ''}">📱 WhatsApp</button></div>`;
  return `<section class="panel panel-picks" data-capture-panel="picks" style="border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt});"><div class="panel-head"><div><h3>${title}</h3><p>${copy}</p></div>${exportActions}</div><div class="picks-legend"><span class="legend-dot legend-max"></span>Golpe fuerte <span class="legend-dot legend-high"></span>Suma alta <span class="legend-dot legend-mid"></span>Suma media <span class="legend-dot legend-low"></span>Suma baja</div><div class="table-wrap picks-wrap"><table class="picks-table picks-table-compact${compactToScreen ? " picks-table-fit" : ""}" style="table-layout:${compactToScreen ? "fixed" : "auto"}; min-width:${compactToScreen ? "100%" : "max-content"}"><thead><tr><th style="background:${palette.accentSoft}; color:${palette.accentText}; width:${compactToScreen ? "34px" : "60px"}; text-align:center">N</th><th style="background:${palette.accentSoft}; color:${palette.accentText}; ${compactToScreen ? "width:132px" : "min-width:180px"}; text-align:left">Stud</th><th style="background:${palette.accentSoft}; color:${palette.accentText}; width:${compactToScreen ? "64px" : "96px"}; text-align:center">Total</th>${Array.from({ length: event.races }, (_, index) => `<th style="background:${palette.accentSoft}; color:${palette.accentText}; ${compactToScreen ? "width:64px" : "min-width:118px"}; text-align:center">C${index + 1}</th>`).join("")}${showEdit ? `<th style="background:${palette.accentSoft}; color:${palette.accentText}">Acciones</th>` : ""}</tr></thead><tbody>${rows.map((participant, rowIndex) => `<tr style="background:${rowIndex % 2 === 0 ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.92)"}"><td style="text-align:center; vertical-align:middle"><strong>${participant.index}</strong></td><td style="vertical-align:middle"><strong class="picks-stud" style="display:block; ${compactToScreen ? "" : "min-width:180px"}">${participant.name}</strong></td><td style="text-align:center; vertical-align:middle"><strong class="picks-total" style="color:${palette.accentText}; display:inline-block; ${compactToScreen ? "" : "min-width:72px"}">${formatScoreValue(participant.points, scoringMode)}</strong></td>${safeArray(participant.picks).map((pick, index) => `<td style="vertical-align:top; text-align:center">${renderPickCell(pick, index + 1)}</td>`).join("")}${showEdit ? `<td><div class="table-actions"><button type="button" class="ghost-button" data-edit-forecast="${event.id}" data-edit-index="${participant.index}">Editar</button><button type="button" class="ghost-button" data-delete-forecast="${event.id}" data-delete-index="${participant.index}">Eliminar</button></div></td>` : ""}</tr>`).join("")}</tbody></table></div></section>`;
}

renderDailyContent = function renderDailyContentV3() {
  const today = toLocalDateInputValue();
  const dailyEvents = getDailyCampaignEvents(today);
  const event = eventById(dailyEvents, state.dailyEventId);
  state.dailyEventId = event?.id || null;
  if (!event) {
    dailyView.innerHTML = `${renderOfficialBanner("Diaria", "Sin jornada activa", `No hay una campaÃ±a diaria asociada a ${today}. Cuando coincida la fecha, aquÃ­ aparecerÃ¡ el tablero oficial.`, [today, "Esperando jornada"])}<section class="panel"><div class="empty">TodavÃ­a no hay informaciÃ³n diaria para esta fecha.</div></section>`;
    return;
  }
  const nextPendingRace = getNextPendingRace(event);
  const finished = isEventFinished(event);
  const leader = event.leaderboard[0];
  const scoringMode = event?.scoring?.mode || "dividend";
  const topSummary = finished
    ? `<section class="panel"><div class="panel-head"><h3>Radiografia de la jornada</h3><p>Lo primero que quieren ver los jugadores.</p></div><div class="result-metrics"><article><span>Participantes</span><strong>${event.participants.length}</strong></article><article><span>Estado</span><strong>Jornada finalizada</strong></article><article><span>Ganador de la jornada</span><strong>${leader?.name || "-"}</strong></article></div></section>`
    : `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Radiografia de la jornada</h3><p>Lo primero que quieren ver los jugadores.</p></div><div class="result-metrics"><article><span>Participantes</span><strong>${event.participants.length}</strong></article><article><span>Proxima carrera</span><strong>C${nextPendingRace}</strong></article><article><span>Lider actual</span><strong>${leader?.name || "-"}</strong></article></div></section>${renderRaceFocusCard(event, "Caballos mas jugados", "Que ejemplares concentran mas pronosticos en la proxima carrera.")}</section>`;
  const tabsMarkup = dailyEvents.length > 1
    ? `<section class="panel"><div class="toolbar"><div><p class="label">Jornada diaria</p><div class="toolbar-group" id="dailyTabs"></div></div></div></section>`
    : "";
  dailyView.innerHTML = `${renderOfficialBanner("Diaria", event.viewLabel || getEventViewLabel(event), "Resumen listo para compartir con los participantes, con lectura rapida y tabla viva por carrera.", [today, getScoringLabel(scoringMode), `${event.races} carreras`, leader ? `${finished ? "Ganador" : "Lider"}: ${leader.name}` : "Sin lider"])}${tabsMarkup}${topSummary}${renderLeaderboardSpotlight(event.leaderboard, scoringMode, "Tabla oficial diaria", "Puntaje completo de todos los participantes y diferencia con el lider.")}<section class="stack">${renderPicksTable(event, "Pronosticos registrados", "Cada casilla cambia de color segun lo que sumo ese pick.")}${renderResultsLedger(event, "Resultados de la jornada", "Cada carrera queda lista para informar al publico.")}</section>`;
  const tabs = dailyView.querySelector("#dailyTabs");
  if (tabs) {
    dailyEvents.forEach((item) => {
      const button = document.createElement("button");
      button.className = `subnav-button${item.id === event.id ? " active" : ""}`;
      button.textContent = item.viewLabel || getEventViewLabel(item);
      button.addEventListener("click", () => {
        state.dailyEventId = item.id;
        render();
      });
      tabs.appendChild(button);
    });
  }
}

renderWeeklyContent = function renderWeeklyContentV3() {
  const groups = getWeeklyCampaignGroups();
  const selectedGroup = groups.find((group) => group.id === state.weeklyCampaignId) || groups[0] || null;
  state.weeklyCampaignId = selectedGroup?.id || null;
  const events = selectedGroup?.events || [];
  const total = aggregateEvents(events, "Acumulado semanal", "weekly-total");
  const selected = state.weeklyTab === "total" ? null : events.find((item) => item.id === state.weeklyTab) || events[0] || null;
  const scoringMode = (selected?.scoring?.mode || events[0]?.scoring?.mode || "dividend");
  const selectedCampaign = getEnabledCampaigns("weekly").find((campaign) => campaign.id === selectedGroup?.id) || null;
  const chips = [
    getScoringLabel(scoringMode),
    selectedCampaign?.format ? `Formato: ${selectedCampaign.format}` : "",
    safeArray(selectedCampaign?.finalDays).length ? `Final: ${safeArray(selectedCampaign.finalDays).join(" + ")}` : "",
    safeArray(selectedCampaign?.pairs).length ? `${safeArray(selectedCampaign.pairs).length} parejas` : "",
    safeArray(selectedCampaign?.groups).length ? `${safeArray(selectedCampaign.groups).length} grupos` : "",
    safeArray(selectedCampaign?.finalists).length ? `${safeArray(selectedCampaign.finalists).length} clasificados` : "",
  ].filter(Boolean);
  weeklyView.innerHTML = `${renderOfficialBanner("Semanal", selectedGroup?.name || "Semanal", "Vista de campeonato para informar como va la semana, la final y el estado de cada jornada.", chips)}<section class="panel"><div class="toolbar"><div class="stack" style="width:100%"><div class="form-grid"><div class="field"><label>Campana semanal</label><select id="weeklyCampaignSelect">${groups.map((group) => `<option value="${group.id}"${group.id === state.weeklyCampaignId ? " selected" : ""}>${group.name}</option>`).join("")}</select></div></div><div><p class="label">Vista semanal</p><div class="toolbar-group" id="weeklyTabs"></div></div></div><span class="tag">Semanal oficial</span></div></section><section id="weeklyBody"></section>`;
  ["total", ...events.map((item) => item.id)].forEach((id) => {
    const event = events.find((item) => item.id === id);
    const button = document.createElement("button");
    button.className = `subnav-button${state.weeklyTab === id ? " active" : ""}`;
    button.textContent = id === "total" ? "TOTAL" : (event?.sheetName || event?.viewLabel || getEventViewLabel(event)).toUpperCase();
    button.addEventListener("click", () => {
      state.weeklyTab = id;
      render();
    });
    weeklyView.querySelector("#weeklyTabs").appendChild(button);
  });
  weeklyView.querySelector("#weeklyCampaignSelect")?.addEventListener("change", (changeEvent) => {
    state.weeklyCampaignId = changeEvent.target.value;
    state.weeklyTab = "total";
    render();
  });
  if (!groups.length) {
    weeklyView.querySelector("#weeklyBody").innerHTML = `<section class="panel"><div class="empty">No hay campanas semanales disponibles todavia.</div></section>`;
    return;
  }
  if (!events.length) {
    weeklyView.querySelector("#weeklyBody").innerHTML = `<section class="panel"><div class="empty">La campana semanal seleccionada todavia no tiene jornadas cargadas.</div></section>`;
    return;
  }
  weeklyView.querySelector("#weeklyBody").innerHTML = state.weeklyTab === "total"
    ? `${renderLeaderboardSpotlight(total.participants, scoringMode, "Tabla oficial semanal", "Acumulado completo de la campana.")}<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Jornadas activas</h3><p>Resumen para informar que dias ya movieron la tabla.</p></div><div class="results-ledger">${events.map((item) => `<article class="result-race-card"><div class="result-race-head"><span class="label">${item.sheetName}</span></div><div class="result-podium"><div><span>Lider</span><strong>${item.leaderboard[0]?.name || "-"}</strong><em>${formatScoreValue(item.leaderboard[0]?.points || 0, item?.scoring?.mode || scoringMode)}</em></div><div><span>Carreras</span><strong>${item.races}</strong><em>${item.results.length} resultados</em></div><div><span>Foco</span><strong>C${getFocusRace(item)}</strong><em>${getDistribution(item, getFocusRace(item))[0]?.horse || "-"}</em></div></div></article>`).join("")}</div></section><section class="panel"><div class="panel-head"><h3>Estructura del torneo</h3><p>Lo que define esta semanal.</p></div><div class="result-metrics"><article><span>Finalistas</span><strong>${safeArray(selectedCampaign?.finalists).length || 0}</strong></article><article><span>Grupos</span><strong>${safeArray(selectedCampaign?.groups).length || 0}</strong></article><article><span>Parejas</span><strong>${safeArray(selectedCampaign?.pairs).length || 0}</strong></article></div></section></section>`
    : selected
      ? `<section class="grid-3">${renderLeaderboardSpotlight(selected.leaderboard, selected?.scoring?.mode || scoringMode, `${selectedGroup?.name || "Semanal"} · ${selected.sheetName}`, "Puntaje del dia y diferencia con el lider.")}${renderRaceFocusCard(selected, "Caballos mas jugados", `Que ejemplares concentran mas pronosticos en ${selected.sheetName}.`)}<section class="panel"><div class="panel-head"><h3>Estado del dia</h3><p>Listo para compartir.</p></div><div class="result-metrics"><article><span>Dia</span><strong>${selected.sheetName}</strong></article><article><span>Resultados</span><strong>${selected.results.length}</strong></article><article><span>Carreras</span><strong>${selected.races}</strong></article></div></section></section>${renderResultsLedger(selected, `Resultados · ${selected.sheetName}`, "Lectura oficial de esa jornada.")}${renderPicksTable(selected, "Pronosticos registrados", "Cada casilla cambia de color segun lo que sumo en ese dia.")}`
      : "";
}

renderMonthlyContent = function renderMonthlyContentV3() {
  const events = getMonthlyEvents();
  const total = aggregateEvents(events, "Acumulado mensual", "monthly-total");
  const selected = state.monthlyTab === "total" ? null : events.find((item) => item.id === state.monthlyTab) || events[0] || null;
  const scoringMode = (selected?.scoring?.mode || events[0]?.scoring?.mode || "dividend");
  monthlyView.innerHTML = `${renderOfficialBanner("Mensual", "Polla mensual", "Un tablero mas limpio y llamativo para informar como viene el acumulado y cada jornada incluida.", [getScoringLabel(scoringMode), `${events.length} jornadas`, safeArray(state.data.settings.monthly.hipodromos).join(", ") || "Sin hipodromo"])}<section class="panel"><div class="toolbar"><div><p class="label">Vista mensual</p><div class="toolbar-group" id="monthlyTabs"></div></div><span class="tag">Acumulado oficial</span></div></section><section id="monthlyBody"></section>`;
  ["total", ...events.map((item) => item.id)].forEach((id) => {
    const event = events.find((item) => item.id === id);
    const button = document.createElement("button");
    button.className = `subnav-button${state.monthlyTab === id ? " active" : ""}`;
    button.textContent = id === "total" ? "TOTAL" : (event?.viewLabel || getEventViewLabel(event)).toUpperCase();
    button.addEventListener("click", () => {
      state.monthlyTab = id;
      render();
    });
    monthlyView.querySelector("#monthlyTabs").appendChild(button);
  });
  if (!events.length) {
    monthlyView.querySelector("#monthlyBody").innerHTML = `<section class="panel"><div class="empty">No hay jornadas mensuales disponibles todavia.</div></section>`;
    return;
  }
  monthlyView.querySelector("#monthlyBody").innerHTML = state.monthlyTab === "total"
    ? `${renderLeaderboardSpotlight(total.participants, scoringMode, "Tabla oficial mensual", "Acumulado completo de todas las jornadas incluidas.")}<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Tabla resumen</h3><p>Resumen general para publicar.</p></div>${setTable(["Lugar", "Stud", ...state.data.mensual.tabla.headers.slice(0, 4)], state.data.mensual.tabla.standings.slice(0, 12).map((row) => [row.place, row.stud, ...row.scores.slice(0, 4).map((item) => formatDividend(item.value))]))}</section><section class="panel"><div class="panel-head"><h3>Jornadas incluidas</h3><p>Panorama del mes.</p></div><div class="results-ledger">${events.map((item) => `<article class="result-race-card"><div class="result-race-head"><span class="label">${item.viewLabel || getEventViewLabel(item)}</span></div><div class="result-podium"><div><span>Lider</span><strong>${item.leaderboard[0]?.name || "-"}</strong><em>${formatScoreValue(item.leaderboard[0]?.points || 0, item?.scoring?.mode || scoringMode)}</em></div><div><span>Resultados</span><strong>${item.results.length}</strong><em>${item.races} carreras</em></div><div><span>Foco</span><strong>C${getFocusRace(item)}</strong><em>${getDistribution(item, getFocusRace(item))[0]?.horse || "-"}</em></div></div></article>`).join("")}</div></section></section>`
    : selected
      ? `<section class="grid-3">${renderLeaderboardSpotlight(selected.leaderboard, selected?.scoring?.mode || scoringMode, selected.viewLabel || getEventViewLabel(selected), "Puntaje de la jornada y diferencia con el lider.")}${renderRaceFocusCard(selected, "Caballos mas jugados", "Que ejemplares concentran mas pronosticos en la jornada mensual seleccionada.")}<section class="panel"><div class="panel-head"><h3>Estado de la jornada</h3><p>Resumen corto para informar.</p></div><div class="result-metrics"><article><span>Resultados</span><strong>${selected.results.length}</strong></article><article><span>Carreras</span><strong>${selected.races}</strong></article><article><span>Lider</span><strong>${selected.leaderboard[0]?.name || "-"}</strong></article></div></section></section>${renderResultsLedger(selected, `Resultados · ${selected.viewLabel || getEventViewLabel(selected)}`, "Detalle oficial de la jornada.")}${renderPicksTable(selected, "Pronosticos registrados", "Cada casilla cambia de color segun lo que sumo ese pick en la mensual.")}`
      : "";
}

function renderForecastFormAdminDouble(event) {
  const roster = state.data.registry.filter((item) => item.diaria || item.semanal || item.mensual).map((item) => item.name);
  const editTarget = state.adminForecastEdit && state.adminForecastEdit.eventId === event.id
    ? safeArray(event.participants).find((item) => Number(item.index) === Number(state.adminForecastEdit.index))
    : null;
  const usedNames = new Set(
    safeArray(event.participants)
      .map((item) => item?.name)
      .filter(Boolean),
  );
  const names = (roster.length ? roster : event.participants.map((item) => item.name))
    .filter((name) => !usedNames.has(name) || name === editTarget?.name);
  const safeNames = names.length ? names : roster;
  const firstParticipant = editTarget || null;
  const secondParticipant = null;
  const nextIndex = state.adminForecastNextIndex || (Math.max(0, ...event.participants.map((item) => Number(item.index) || 0)) + 1);
  const hasSecondStud = Boolean(secondParticipant);
  return `${renderOperationTargets(event)}<form class="editor-form" data-form="participant-double" autocomplete="off"><div class="panel-head"><h4>Pronostico</h4><p>${hasSecondStud ? "Ingreso doble por jornada." : "Ingreso por jornada. Puedes agregar otro stud si lo necesitas."}</p></div><div class="form-grid"><div class="field"><label>Numero Stud 1</label><input name="index" type="number" min="1" value="${firstParticipant?.index || nextIndex}" /></div><div class="field"><label>Stud 1</label><select name="name"><option value="">Selecciona un stud</option>${safeNames.map((name) => `<option value="${name}"${name === firstParticipant?.name ? " selected" : ""}>${name}</option>`).join("")}</select></div></div><div class="toolbar-group"><button type="button" class="ghost-button" data-toggle-second-stud>${hasSecondStud ? "Ocultar stud 2" : "Agregar stud"}</button></div><div class="stack" data-second-stud-block${hasSecondStud ? "" : " hidden"}><div class="form-grid"><div class="field"><label>Numero Stud 2</label><input name="indexSecond" type="number" min="1" value="" /></div><div class="field"><label>Stud 2</label><select name="nameSecond"><option value="">Selecciona un stud</option>${safeNames.map((name) => `<option value="${name}"${name === secondParticipant?.name ? " selected" : ""}>${name}</option>`).join("")}</select></div></div></div><div class="field"><label>Pegar en lote</label><textarea name="bulkDualPicks" rows="8" placeholder="1. 5-12&#10;2. 12-1&#10;3. 11-5" spellcheck="false"></textarea><p class="hint">Formato doble: 1. 5-12. El primer valor llena Stud 1 y el segundo llena Stud 2. Si solo usarÃ¡s uno, no agregues el segundo stud.</p><div class="toolbar-group"><button type="button" class="ghost-button" data-apply-dual-bulk>Aplicar pegado</button><button type="button" class="ghost-button" data-clear-dual-bulk>Limpiar picks</button></div></div><div class="panel-head"><h4>Stud 1</h4><p>Picks del primer stud.</p></div><div class="form-grid">${Array.from({ length: Math.min(event.races, 30) }, (_, index) => `<div class="field"><label>C${index + 1}</label><input name="pick-${index + 1}" type="text" value="${firstParticipant?.picks[index]?.horse || ""}" autocomplete="off" /></div>`).join("")}</div><section class="stack" data-second-picks-block${hasSecondStud ? "" : " hidden"}><div class="panel-head"><h4>Stud 2</h4><p>Picks del segundo stud.</p></div><div class="form-grid">${Array.from({ length: Math.min(event.races, 30) }, (_, index) => `<div class="field"><label>C${index + 1}</label><input name="pick2-${index + 1}" type="text" value="${secondParticipant?.picks[index]?.horse || ""}" autocomplete="off" /></div>`).join("")}</div></section><div class="actions"><span class="hint">Puedes guardar solo Stud 1 o guardar ambos studs juntos cuando el segundo estÃ© activo.</span><button class="primary-button" type="submit">Guardar Stud 1</button><button class="ghost-button" type="button" data-save-double-picks${hasSecondStud ? "" : " hidden"}>Guardar ambos studs</button></div></form>`;
}

function bindForecastFormAdminDouble(container, event) {
  const form = container.querySelector('[data-form="participant-double"]');
  if (!form) return;
  const editTarget = state.adminForecastEdit && state.adminForecastEdit.eventId === event.id
    ? safeArray(event.participants).find((item) => Number(item.index) === Number(state.adminForecastEdit.index))
    : null;
  const secondStudBlock = form.querySelector("[data-second-stud-block]");
  const secondPicksBlock = form.querySelector("[data-second-picks-block]");
  const toggleSecondStudButton = form.querySelector("[data-toggle-second-stud]");
  const saveDoubleButton = form.querySelector("[data-save-double-picks]");
  const bulkToolbar = form.querySelector('[data-apply-dual-bulk]')?.closest(".toolbar-group");
  const submitButton = form.querySelector('button[type="submit"]');
  const bottomActions = form.querySelector(".actions");
  const secondIndexInput = form.querySelector('[name="indexSecond"]');
  const secondNameInput = form.querySelector('[name="nameSecond"]');
  const bulkArea = form.querySelector('[name="bulkDualPicks"]');

  if (bulkToolbar && submitButton && !bulkToolbar.contains(submitButton)) {
    bulkToolbar.appendChild(submitButton);
  }
  if (bulkToolbar && saveDoubleButton && !bulkToolbar.contains(saveDoubleButton)) {
    bulkToolbar.appendChild(saveDoubleButton);
  }
  if (bottomActions) {
    const actionHint = bottomActions.querySelector(".hint");
    if (actionHint) {
      actionHint.hidden = true;
    }
    if (!bottomActions.querySelector("button")) {
      bottomActions.hidden = true;
    }
  }

  const indexInput = form.querySelector('[name="index"]');
  const nameSelect = form.querySelector('[name="name"]');

  const fillPickInputs = (prefix, values) => {
    Array.from({ length: Math.min(event.races, 30) }, (_, index) => {
      const input = form.querySelector(`[name="${prefix}${index + 1}"]`);
      if (input) input.value = values[index] || "";
    });
  };

  const getUsedNames = () => new Set(
    safeArray(event.participants)
      .map((item) => item?.name)
      .filter(Boolean),
  );

  const setSelectOptions = (select, values, selectedValue = "") => {
    if (!select) return;
    select.innerHTML = [`<option value="">Selecciona un stud</option>`, ...values.map((value) => `<option value="${value}">${value}</option>`)].join("");
    select.value = values.includes(selectedValue) ? selectedValue : "";
  };

  const refreshStudOptions = () => {
    const roster = state.data.registry
      .filter((item) => item.diaria || item.semanal || item.mensual)
      .map((item) => item.name);
    const usedNames = getUsedNames();
    const allowedFirst = roster.filter((name) => !usedNames.has(name) || name === editTarget?.name);
    const firstOptions = allowedFirst.length ? allowedFirst : roster;
    const currentFirst = String(nameSelect?.value || "").trim();
    const firstSelected = currentFirst && firstOptions.includes(currentFirst)
      ? currentFirst
      : (editTarget?.name && firstOptions.includes(editTarget.name) ? editTarget.name : "");
    setSelectOptions(nameSelect, firstOptions, firstSelected);
    const secondOptions = firstOptions.filter((name) => name !== firstSelected);
    if (secondNameInput) {
      const currentSecond = String(secondNameInput.value || "").trim();
      secondNameInput.innerHTML = [`<option value="">Selecciona un stud</option>`, ...secondOptions.map((name) => `<option value="${name}">${name}</option>`)].join("");
      secondNameInput.value = secondOptions.includes(currentSecond) ? currentSecond : "";
    }
  };
  const refreshSecondStudOptions = () => {
    const currentFirst = String(nameSelect?.value || "").trim();
    const usedNames = getUsedNames();
    const firstOptions = roster.filter((name) => !usedNames.has(name) || name === editTarget?.name);
    const safeFirst = firstOptions.length ? firstOptions : roster;
    const secondOptions = safeFirst.filter((name) => name !== currentFirst);
    const currentSecond = String(secondNameInput?.value || "").trim();
    if (secondNameInput) {
      secondNameInput.innerHTML = [`<option value="">Selecciona un stud</option>`, ...secondOptions.map((name) => `<option value="${name}">${name}</option>`)].join("");
      if (currentSecond && secondOptions.includes(currentSecond)) {
        secondNameInput.value = currentSecond;
      } else {
        secondNameInput.value = "";
      }
    }
  };

  const syncSecondIndexWithFirst = () => {
    if (!secondIndexInput) return;
    const firstIndex = Number(indexInput?.value || 0);
    secondIndexInput.value = firstIndex > 0 ? String(firstIndex + 1) : "";
  };

  const setSecondStudVisible = (visible) => {
    state.adminForecastSecondStudVisible = visible;
    if (secondStudBlock) secondStudBlock.hidden = !visible;
    if (secondPicksBlock) secondPicksBlock.hidden = !visible;
    if (saveDoubleButton) saveDoubleButton.hidden = !visible;
    if (toggleSecondStudButton) toggleSecondStudButton.textContent = visible ? "Ocultar stud 2" : "Agregar stud";
    if (visible) {
      syncSecondIndexWithFirst();
    } else {
      if (secondNameInput) secondNameInput.value = "";
      if (secondIndexInput) secondIndexInput.value = "";
      fillPickInputs("pick2-", []);
    }
  };

  setSecondStudVisible(Boolean(state.adminForecastSecondStudVisible));

  const setSuggestedNextIndex = (value) => {
    state.adminForecastNextIndex = Number(value) > 0 ? Number(value) : null;
  };

  if (editTarget && indexInput) {
    indexInput.value = editTarget.index;
    if (nameSelect) nameSelect.value = editTarget.name;
    fillPickInputs("pick-", safeArray(editTarget.picks).map((pick) => pick?.horse || ""));
  } else if (state.adminForecastNextIndex && indexInput) {
    indexInput.value = state.adminForecastNextIndex;
  }
  if (!editTarget) {
    state.adminForecastNextIndex = Math.max(0, ...safeArray(event.participants).map((item) => Number(item.index) || 0)) + 1;
    if (indexInput) indexInput.value = state.adminForecastNextIndex;
    if (bulkArea) bulkArea.value = "";
    fillPickInputs("pick-", []);
    fillPickInputs("pick2-", []);
    refreshStudOptions();
    if (nameSelect) nameSelect.value = "";
    if (secondNameInput) secondNameInput.value = "";
  } else {
    refreshStudOptions();
  }
  if (state.adminForecastSecondStudVisible) {
    syncSecondIndexWithFirst();
  }

  container.querySelectorAll("[data-edit-forecast]").forEach((button) => {
    button.addEventListener("click", () => {
      state.adminForecastEdit = {
        eventId: button.dataset.editForecast,
        index: Number(button.dataset.editIndex),
      };
      state.adminForecastNextIndex = null;
      state.adminForecastSecondStudVisible = false;
      render();
    });
  });

  container.querySelectorAll("[data-delete-forecast]").forEach((button) => {
    button.addEventListener("click", async () => {
      const eventId = button.dataset.deleteForecast;
      const index = Number(button.dataset.deleteIndex);
      if (!eventId || !index) return;
      const response = await fetch(`/api/events/${eventId}/participants/${index}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) return showToast(data.detail || data.error || "No se pudo eliminar el pronostico.");
      if (state.adminForecastEdit && state.adminForecastEdit.eventId === eventId && Number(state.adminForecastEdit.index) === index) {
        state.adminForecastEdit = null;
      }
      state.adminForecastSecondStudVisible = false;
      state.data = data;
      render();
      showToast("Pronostico eliminado.");
    });
  });

  form.querySelector("[data-cancel-forecast-edit]")?.addEventListener("click", () => {
    state.adminForecastEdit = null;
    state.adminForecastSecondStudVisible = false;
    render();
  });

  toggleSecondStudButton?.addEventListener("click", () => {
    const visible = secondStudBlock?.hidden;
    setSecondStudVisible(Boolean(visible));
  });

  indexInput?.addEventListener("input", () => {
    if (state.adminForecastSecondStudVisible) {
      syncSecondIndexWithFirst();
    }
  });

  nameSelect?.addEventListener("change", () => {
    refreshSecondStudOptions();
  });

  form.querySelector("[data-apply-dual-bulk]")?.addEventListener("click", () => {
    const parsed = parseDualBulkPicks(form.querySelector('[name="bulkDualPicks"]')?.value || "", event.races);
    fillPickInputs("pick-", parsed.first);
    const hasSecondData = parsed.second.some(Boolean);
    if (hasSecondData) setSecondStudVisible(true);
    fillPickInputs("pick2-", parsed.second);
    showToast(hasSecondData ? "Pegado aplicado a Stud 1 y Stud 2." : "Pegado aplicado a Stud 1.");
  });

  form.querySelector("[data-clear-dual-bulk]")?.addEventListener("click", () => {
    fillPickInputs("pick-", []);
    fillPickInputs("pick2-", []);
    if (bulkArea) bulkArea.value = "";
    showToast("Pronosticos limpiados.");
  });

  const resolveTargets = () => {
    const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    const resolved = resolveCampaignTargetIds({
      operationDate,
      daily: safeArray(state.adminTargetSelections.daily),
      weekly: safeArray(state.adminTargetSelections.weekly),
      monthly: safeArray(state.adminTargetSelections.monthly),
    });
    return resolved.ids.length ? resolved.ids : [event.id];
  };

  const ensureParticipantsAllowed = (participants) => {
    const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    const targetEventIds = resolveTargets();
    const errors = getWeeklyEligibilityErrors(
      participants.map((participant) => participant?.name).filter(Boolean),
      targetEventIds,
      operationDate,
    );
    if (errors.length) {
      showToast(errors.join(" "));
      return false;
    }
    return true;
  };

  const getPickValues = (prefix) => Array.from(
    { length: Math.min(event.races, 30) },
    (_, index) => String(form.querySelector(`[name="${prefix}${index + 1}"]`)?.value || "").trim(),
  );

  const validateCompletePicks = (participantName, picks) => {
    const missing = picks
      .map((value, index) => (!value ? index + 1 : null))
      .filter(Boolean);
    if (!missing.length) return true;
    showToast(`Faltan pronosticos en ${participantName || "este stud"}: ${missing.map((race) => `C${race}`).join(", ")}`);
    return false;
  };

  const clearForecastForm = () => {
    fillPickInputs("pick-", []);
    fillPickInputs("pick2-", []);
    if (bulkArea) bulkArea.value = "";
    state.adminForecastEdit = null;
    state.adminForecastSecondStudVisible = false;
    setSecondStudVisible(false);
    refreshStudOptions();
    if (nameSelect) nameSelect.value = "";
    if (secondNameInput) secondNameInput.value = "";
    if (indexInput) {
      indexInput.value = state.adminForecastNextIndex || "";
    }
  };

  form.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const dataForm = new FormData(form);
    const firstPicks = getPickValues("pick-");
    const participant = {
      index: Number(dataForm.get("index")),
      name: dataForm.get("name"),
      picks: firstPicks,
    };
    if (!validateCompletePicks(participant.name, firstPicks)) return;
    if (!ensureParticipantsAllowed([participant])) return;
    const response = await fetch("/api/operations/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEventIds: resolveTargets(),
        participant,
      }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el Stud 1.");
    state.data = data;
    const wasEditing = Boolean(state.adminForecastEdit && state.adminForecastEdit.eventId === event.id);
    setSuggestedNextIndex((participant.index || 0) + 1);
    clearForecastForm();
    render();
    showToast(wasEditing ? "Stud editado." : "Stud 1 guardado.");
  });

  form.querySelector("[data-save-double-picks]")?.addEventListener("click", async () => {
    const dataForm = new FormData(form);
    const secondName = String(dataForm.get("nameSecond") || "").trim();
    if (!secondName) return showToast("Selecciona el Stud 2 para guardar ambos.");
    const firstPicks = getPickValues("pick-");
    const secondPicks = getPickValues("pick2-");
    const participants = [
      {
        index: Number(dataForm.get("index")),
        name: dataForm.get("name"),
        picks: firstPicks,
      },
      {
        index: Number(dataForm.get("indexSecond")),
        name: secondName,
        picks: secondPicks,
      },
    ];
    if (!validateCompletePicks(participants[0].name, firstPicks)) return;
    if (!validateCompletePicks(participants[1].name, secondPicks)) return;
    if (!ensureParticipantsAllowed(participants)) return;
    let latestData = null;
    for (const participant of participants) {
      const response = await fetch("/api/operations/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEventIds: resolveTargets(), participant }),
      });
      const data = await response.json();
      if (!response.ok) return showToast(data.detail || data.error || "No se pudieron guardar ambos studs.");
      latestData = data;
    }
    if (latestData) {
      state.data = latestData;
      setSuggestedNextIndex(Math.max(Number(participants[0].index) || 0, Number(participants[1].index) || 0) + 1);
      clearForecastForm();
      render();
      showToast("Se guardaron ambos studs.");
    }
  });
}

renderOperationTargets = function renderOperationTargetsV3(event) {
  const operationDate = state.adminTargetSelections.operationDate || toLocalDateInputValue();
  syncAdminTargetSelections(operationDate, event);
  return `<div class="panel"><div class="panel-head"><h4>Destino del guardado</h4><p>La fecha operativa filtra las campaÃ±as activas y abajo eliges a cuÃ¡les entra esta carga.</p></div><div class="stack"><div class="form-grid"><div class="field"><label>Fecha operativa</label><input data-operation-date type="date" value="${operationDate}" /></div></div><div class="grid-3" data-target-panels>${renderCampaignTargetGroup("daily", operationDate, event)}${renderCampaignTargetGroup("weekly", operationDate, event)}${renderCampaignTargetGroup("monthly", operationDate, event)}</div><p class="hint">Puedes marcar varias campaÃ±as a la vez. Si tienes una diaria por puntos y otra por dividendos, aquÃ­ decides a cuÃ¡l se asocia el pronÃ³stico o resultado.</p></div></div>`;
}

function renderTeletrakImportPanel(event) {
  const selectedTrackId = String(state.teletrakImport.selectedTrackId || "");
  const trackOptions = state.teletrakImport.tracks.length
    ? state.teletrakImport.tracks.map((track) => `<option value="${track.id}"${String(track.id) === selectedTrackId ? " selected" : ""}>${track.name}</option>`).join("")
    : '<option value="">Cargando hipÃ³dromos...</option>';
  const sourceOptions = [
    ...safeArray(state.data?.semanal?.events),
    ...safeArray(state.data?.mensual?.events),
  ]
    .filter((item) => item.id !== event.id)
    .filter((item) => safeArray(item.results).length > 0)
    .map((item) => {
      const inferredKind = String(item.id || "").startsWith("monthly-")
        ? "monthly"
        : String(item.id || "").startsWith("campaign-daily-")
          ? "daily"
          : "weekly";
      const kindKey = item.campaignType || inferredKind;
      const kind = kindKey === "monthly" ? "Mensual" : kindKey === "daily" ? "Diaria" : "Semanal";
      const label = item.campaignName || item.name || item.sheetName || item.id;
      const date = item.date || item.sheetName || "";
      const resultsCount = safeArray(item.results).length;
      return `<option value="${item.id}"${item.id === state.adminResultCopySourceId ? " selected" : ""}>[${kind}] ${label}${date ? ` Â· ${date}` : ""} Â· ${resultsCount} resultados</option>`;
    })
    .join("");
  return `<section class="panel compact"><div class="panel-head"><h4>Importar desde Teletrak</h4><p>Trae la jornada completa desde apuestas.teletrak.cl usando la fecha operativa.</p></div><div class="form-grid"><div class="field"><label>HipÃ³dromo Teletrak</label><select data-teletrak-track>${trackOptions}</select></div><div class="field"><label>Carreras de la jornada</label><div class="toolbar-group"><input data-event-race-count type="number" min="1" max="40" value="${event.races || 12}" /><button type="button" class="ghost-button" data-save-race-count>Guardar carreras</button></div></div></div><div class="actions"><span class="hint">Importa 1Â°, 2Â°, 3Â°, dividendos, empates y retiros. La cantidad de carreras se guarda en las campaÃ±as seleccionadas.</span><button type="button" class="ghost-button" data-refresh-teletrak>Actualizar hipÃ³dromos</button><button type="button" class="primary-button" data-import-teletrak>Importar resultados</button></div></section><section class="panel compact"><div class="panel-head"><h4>Copiar resultados</h4><p>Usa una jornada ya guardada como base para otra fecha o campaÃ±a.</p></div><div class="form-grid"><div class="field"><label>Jornada origen</label><select data-copy-results-source><option value="">Selecciona una jornada con resultados</option>${sourceOptions}</select></div></div><div class="actions"><span class="hint">Copia carreras, dividendos, empates, retiros y cantidad de carreras hacia las campaÃ±as seleccionadas abajo.</span><button type="button" class="ghost-button" data-copy-results>Copiar resultados a esta jornada</button></div></section>`;
}

resolveCampaignTargetIds = function resolveCampaignTargetIdsV2(selection) {
  const ids = [];
  const warnings = [];
  const operationDate = String(selection.operationDate || "");
  ["daily", "weekly", "monthly"].forEach((kind) => {
    const selectedIds = safeArray(selection[kind]);
    const matches = getCampaignMatchesByDate(kind, operationDate);
    const picked = matches.filter((match) => selectedIds.includes(match.id));
    if (selectedIds.length && !picked.length) {
      warnings.push(`No hay campaÃ±as ${kind === "daily" ? "diarias" : kind === "weekly" ? "semanales" : "mensuales"} vÃ¡lidas para ${operationDate}.`);
    }
    picked.forEach((match) => ids.push(...safeArray(match.eventIds)));
  });
  return {
    ids: Array.from(new Set(ids.filter(Boolean))),
    warnings,
  };
}

renderForecastForm = function renderForecastFormV2(event) {
  const roster = state.data.registry.filter((item) => item.diaria || item.semanal || item.mensual).map((item) => item.name);
  const names = roster.length ? roster : event.participants.map((item) => item.name);
  const defaultParticipant = event.participants[0];
  const nextIndex = Math.max(0, ...event.participants.map((item) => Number(item.index) || 0)) + 1;
  return `${renderOperationTargets(event)}<form class="editor-form" data-form="participant"><div class="panel-head"><h4>PronÃ³stico</h4><p>Ingreso por jornada.</p></div><div class="form-grid"><div class="field"><label>NÃºmero</label><input name="index" type="number" min="1" value="${defaultParticipant?.index || nextIndex}" /></div><div class="field"><label>Stud</label><select name="name">${names.map((name) => `<option value="${name}"${name === defaultParticipant?.name ? " selected" : ""}>${name}</option>`).join("")}</select></div></div><div class="form-grid">${Array.from({ length: Math.min(event.races, 30) }, (_, index) => `<div class="field"><label>C${index + 1}</label><input name="pick-${index + 1}" type="text" value="${defaultParticipant?.picks[index]?.horse || ""}" /></div>`).join("")}</div><div class="actions"><span class="hint">Cada celda muestra el caballo elegido. En la vista pÃºblica verÃ¡s tambiÃ©n cuÃ¡nto sumÃ³ por carrera.</span><button class="primary-button" type="submit">Guardar pronÃ³stico</button></div></form>`;
}

renderResultsForm = function renderResultsFormV3(event) {
  const sortedResults = [...event.results].sort((a, b) => Number(a.race) - Number(b.race));
  const getNextPendingRace = () => {
    const filled = new Set(sortedResults.map((item) => String(item.race)));
    for (let race = 1; race <= event.races; race += 1) {
      if (!filled.has(String(race))) return String(race);
    }
    return String(event.races || 1);
  };
  const defaultRace = state.adminResultRace && Number(state.adminResultRace) >= 1 && Number(state.adminResultRace) <= event.races
    ? String(state.adminResultRace)
    : getNextPendingRace();
  const current = event.results.find((item) => String(item.race) === defaultRace) || { race: defaultRace };
  const retirosValue = Array.isArray(current.retiros) && current.retiros.length ? current.retiros.join(", ") : [current.retiro1, current.retiro2].filter(Boolean).join(", ");
  const hasTie = Boolean(current.empatePrimero || current.empateSegundo || current.empateTercero);
  const sumFirst = (toNumeric(current.ganador) || 0) + (toNumeric(current.divSegundoPrimero ?? current.divSegundo) || 0) + (toNumeric(current.divTerceroPrimero ?? current.divTercero) || 0);
  const sumSecond = (toNumeric(current.divSegundo) || 0) + (toNumeric(current.divTerceroSegundo ?? current.divTercero) || 0);
  const sumThird = (toNumeric(current.divTercero) || 0);

  const showTieFirstColumn = sortedResults.some((item) => item.empatePrimero);
  const showTieSecondColumn = sortedResults.some((item) => item.empateSegundo);
  const showTieThirdColumn = sortedResults.some((item) => item.empateTercero);
  const resultColumns = ["C", "1Â°"];
  if (showTieFirstColumn) resultColumns.push("Emp 1Â°");
  resultColumns.push("Gan", "2Â° del 1Â°", "3Â° del 1Â°", "2Â°");
  if (showTieSecondColumn) resultColumns.push("Emp 2Â°");
  resultColumns.push("2Â° del 2Â°", "3Â° del 2Â°", "3Â°");
  if (showTieThirdColumn) resultColumns.push("Emp 3Â°");
  resultColumns.push("3Â° del 3Â°", "Fav", "Retiros", "Editar");
  const resultRows = sortedResults.map((item) => {
    const row = [item.race, item.primero || "-"];
    if (showTieFirstColumn) row.push(item.empatePrimero || "-");
    row.push(
      item.ganador || "-",
      item.divSegundoPrimero ?? item.divSegundo ?? "-",
      item.divTerceroPrimero ?? item.divTercero ?? "-",
      item.segundo || "-",
    );
    if (showTieSecondColumn) row.push(item.empateSegundo || "-");
    row.push(
      item.divSegundo || "-",
      item.divTerceroSegundo ?? item.divTercero ?? "-",
      item.tercero || "-",
    );
    if (showTieThirdColumn) row.push(item.empateTercero || "-");
    row.push(
      item.divTercero || "-",
      item.favorito || "-",
      (safeArray(item.retiros).join(", ") || [item.retiro1, item.retiro2].filter(Boolean).join(", ") || "-"),
      `<button type="button" class="ghost-button" data-edit-race="${item.race}">Editar</button>`,
    );
    return row;
  });

  return `${renderOperationTargets(event)}${renderTeletrakImportPanel(event)}<form class="editor-form" data-form="result"><div class="panel-head"><h4>Resultados</h4><p>Carga por posiciÃ³n. Si te equivocas, cambias el valor y vuelves a guardar.</p></div><div class="result-grid"><div class="field"><label>Carrera</label><input name="race" type="number" min="1" max="${event.races}" value="${defaultRace}" /></div><div class="result-block"><p class="label">Primero</p><div class="form-grid form-grid-4"><div class="field"><label>NÃºmero</label><input name="primero" type="text" value="${current.primero || ""}" /></div><div class="field"><label>Div Ganador</label><input name="ganador" type="text" value="${current.ganador || ""}" /></div><div class="field"><label>Div 2Â° del 1Â°</label><input name="divSegundoPrimero" type="text" value="${current.divSegundoPrimero ?? current.divSegundo ?? ""}" /></div><div class="field"><label>Div 3Â° del 1Â°</label><input name="divTerceroPrimero" type="text" value="${current.divTerceroPrimero ?? current.divTercero ?? ""}" /></div><div class="field"><label>Suma 1Â°</label><input data-sum-first type="text" value="${String(sumFirst || "").replace(".", ",")}" readonly /></div></div></div><div class="result-block"><p class="label">Segundo</p><div class="form-grid form-grid-4"><div class="field"><label>NÃºmero</label><input name="segundo" type="text" value="${current.segundo || ""}" /></div><div class="field"><label>Div 2Â° del 2Â°</label><input name="divSegundo" type="text" value="${current.divSegundo || ""}" /></div><div class="field"><label>Div 3Â° del 2Â°</label><input name="divTerceroSegundo" type="text" value="${current.divTerceroSegundo ?? current.divTercero ?? ""}" /></div><div class="field"><label>Suma 2Â°</label><input data-sum-second type="text" value="${String(sumSecond || "").replace(".", ",")}" readonly /></div></div></div><div class="result-block"><p class="label">Tercero</p><div class="form-grid form-grid-4"><div class="field"><label>NÃºmero</label><input name="tercero" type="text" value="${current.tercero || ""}" /></div><div class="field"><label>Div 3Â° del 3Â°</label><input name="divTercero" type="text" value="${current.divTercero || ""}" /></div><div class="field"><label>Suma 3Â°</label><input data-sum-third type="text" value="${String(sumThird || "").replace(".", ",")}" readonly /></div></div></div><div class="result-block"><div class="toolbar"><p class="label">Empates</p><label class="check-chip compact"><input type="checkbox" name="hasTie"${hasTie ? " checked" : ""} /> Hay empate</label></div><div data-tie-panel${hasTie ? "" : ' hidden'}><div class="stack"><div class="result-block"><p class="label">Empate 1Â°</p><div class="form-grid form-grid-4"><div class="field"><label>NÃºmero empatado en 1Â°</label><input name="empatePrimero" type="text" value="${current.empatePrimero || ""}" /></div><div class="field"><label>Ganador del empatado</label><input name="empatePrimeroGanador" type="text" value="${current.empatePrimeroGanador ?? current.ganador ?? ""}" /></div><div class="field"><label>Div 2Â° del empatado</label><input name="empatePrimeroDivSegundo" type="text" value="${current.empatePrimeroDivSegundo ?? current.divSegundoPrimero ?? current.divSegundo ?? ""}" /></div><div class="field"><label>Div 3Â° del empatado</label><input name="empatePrimeroDivTercero" type="text" value="${current.empatePrimeroDivTercero ?? current.divTerceroPrimero ?? current.divTercero ?? ""}" /></div></div></div><div class="result-block"><p class="label">Empate 2Â°</p><div class="form-grid form-grid-4"><div class="field"><label>NÃºmero empatado en 2Â°</label><input name="empateSegundo" type="text" value="${current.empateSegundo || ""}" /></div><div class="field"><label>Div 2Â° del empatado</label><input name="empateSegundoDivSegundo" type="text" value="${current.empateSegundoDivSegundo ?? current.divSegundo ?? ""}" /></div><div class="field"><label>Div 3Â° del empatado</label><input name="empateSegundoDivTercero" type="text" value="${current.empateSegundoDivTercero ?? current.divTerceroSegundo ?? current.divTercero ?? ""}" /></div></div></div><div class="result-block"><p class="label">Empate 3Â°</p><div class="form-grid form-grid-4"><div class="field"><label>NÃºmero empatado en 3Â°</label><input name="empateTercero" type="text" value="${current.empateTercero || ""}" /></div><div class="field"><label>Div 3Â° del empatado</label><input name="empateTerceroDivTercero" type="text" value="${current.empateTerceroDivTercero ?? current.divTercero ?? ""}" /></div></div></div></div></div></div><div class="result-block"><p class="label">Apoyos</p><div class="form-grid"><div class="field"><label>Favorito</label><input name="favorito" type="text" value="${current.favorito || ""}" /></div><div class="field"><label>Retiros</label><input name="retiros" type="text" value="${retirosValue}" placeholder="Ej. 6, 8, 11" /></div></div></div><div class="actions"><span class="hint">En empate escribes el nÃºmero del otro ejemplar empatado y sus dividendos propios para ese lugar.</span><button class="primary-button" type="submit">Guardar resultado</button></div></form><section class="panel"><div class="panel-head"><h4>Resultados registrados</h4><p>Lo que ya estÃ¡ guardado para esta jornada.</p></div>${setTable(resultColumns, resultRows)}</section>`;
}

bindEventForms = function bindEventFormsV4(container, event) {
  const resultForm = container.querySelector('[data-form="result"]');
  const formatSummaryValue = (value) => {
    const rounded = Math.round(value * 100) / 100;
    if (!rounded) return "";
    return String(rounded).replace(".", ",");
  };
  const bindTargetSelectionInputs = (root) => {
    root.querySelectorAll("[data-target-campaign]").forEach((input) => {
      input.addEventListener("change", () => {
        const kind = input.dataset.targetCampaign;
        state.adminTargetSelections[kind] = Array.from(root.querySelectorAll(`[data-target-campaign="${kind}"]:checked`)).map((item) => item.value);
      });
    });
  };
  const refreshTargetPanels = () => {
    const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    state.adminTargetSelections.operationDate = operationDate;
    syncAdminTargetSelections(operationDate, event);
    const panels = container.querySelector("[data-target-panels]");
    if (panels) {
      panels.innerHTML = `${renderCampaignTargetGroup("daily", operationDate, event)}${renderCampaignTargetGroup("weekly", operationDate, event)}${renderCampaignTargetGroup("monthly", operationDate, event)}`;
      bindTargetSelectionInputs(panels);
    }
  };
  const fillTeletrakSelect = (tracks) => {
    const select = container.querySelector("[data-teletrak-track]");
    if (!select) return;
    if (!tracks.length) {
      select.innerHTML = '<option value="">Sin hipÃ³dromos para esa fecha</option>';
      state.teletrakImport.selectedTrackId = "";
      return;
    }
    const nextSelected = tracks.some((track) => String(track.id) === String(state.teletrakImport.selectedTrackId))
      ? String(state.teletrakImport.selectedTrackId)
      : String(tracks[0].id);
    state.teletrakImport.selectedTrackId = nextSelected;
    select.innerHTML = tracks.map((track) => `<option value="${track.id}"${String(track.id) === nextSelected ? " selected" : ""}>${track.name}</option>`).join("");
  };
  const loadTeletrakTracks = async () => {
    const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    if (!operationDate) return;
    const select = container.querySelector("[data-teletrak-track]");
    if (select) {
      select.innerHTML = '<option value="">Cargando hipÃ³dromos...</option>';
    }
    try {
      const response = await fetch(`/api/import/teletrak/tracks?date=${encodeURIComponent(operationDate)}`);
      const data = await response.json();
      if (!response.ok) {
        fillTeletrakSelect([]);
        return showToast(data.detail || data.error || "No se pudieron cargar los hipÃ³dromos de Teletrak.");
      }
      state.teletrakImport.lastDate = operationDate;
      state.teletrakImport.tracks = safeArray(data.tracks);
      fillTeletrakSelect(state.teletrakImport.tracks);
    } catch (error) {
      fillTeletrakSelect([]);
      showToast("No se pudieron cargar los hipÃ³dromos de Teletrak.");
    }
  };
  bindTargetSelectionInputs(container);
  container.querySelector("[data-operation-date]")?.addEventListener("change", (changeEvent) => {
    state.adminTargetSelections.operationDate = changeEvent.currentTarget.value || toLocalDateInputValue();
    render();
  });
  container.querySelector("[data-teletrak-track]")?.addEventListener("change", (selectEvent) => {
    state.teletrakImport.selectedTrackId = String(selectEvent.currentTarget.value || "");
  });
  container.querySelector("[data-refresh-teletrak]")?.addEventListener("click", async () => {
    await loadTeletrakTracks();
    showToast("HipÃ³dromos de Teletrak actualizados.");
  });

  const fillResultForm = (result) => {
    if (!resultForm || !result) return;
    const setField = (name, value) => {
      const input = resultForm.querySelector(`[name="${name}"]`);
      if (input) input.value = value || "";
    };
    setField("race", result.race);
    setField("primero", result.primero);
    setField("ganador", result.ganador);
    setField("divSegundoPrimero", result.divSegundoPrimero ?? result.divSegundo);
    setField("divTerceroPrimero", result.divTerceroPrimero ?? result.divTercero);
    setField("segundo", result.segundo);
    setField("divSegundo", result.divSegundo);
    setField("divTerceroSegundo", result.divTerceroSegundo ?? result.divTercero);
    setField("tercero", result.tercero);
    setField("divTercero", result.divTercero);
    setField("favorito", result.favorito);
    setField("retiros", Array.isArray(result.retiros) && result.retiros.length ? result.retiros.join(", ") : [result.retiro1, result.retiro2].filter(Boolean).join(", "));
    const hasTie = Boolean(result.empatePrimero || result.empateSegundo || result.empateTercero);
    const tieToggle = resultForm.querySelector('[name="hasTie"]');
    const tiePanel = resultForm.querySelector("[data-tie-panel]");
    if (tieToggle) tieToggle.checked = hasTie;
    if (tiePanel) tiePanel.hidden = !hasTie;
    setField("empatePrimero", result.empatePrimero);
    setField("empateSegundo", result.empateSegundo);
    setField("empateTercero", result.empateTercero);
    setField("empatePrimeroGanador", result.empatePrimeroGanador ?? result.ganador);
    setField("empatePrimeroDivSegundo", result.empatePrimeroDivSegundo ?? result.divSegundoPrimero ?? result.divSegundo);
    setField("empatePrimeroDivTercero", result.empatePrimeroDivTercero ?? result.divTerceroPrimero ?? result.divTercero);
    setField("empateSegundoDivSegundo", result.empateSegundoDivSegundo ?? result.divSegundo);
    setField("empateSegundoDivTercero", result.empateSegundoDivTercero ?? result.divTerceroSegundo ?? result.divTercero);
    setField("empateTerceroDivTercero", result.empateTerceroDivTercero ?? result.divTercero);
    syncResultSummary();
  };
  const clearResultForm = (raceValue) => {
    if (!resultForm) return;
    const setField = (name, value) => {
      const input = resultForm.querySelector(`[name="${name}"]`);
      if (input) input.value = value || "";
    };
    setField("race", raceValue);
    setField("primero", "");
    setField("ganador", "");
    setField("divSegundoPrimero", "");
    setField("divTerceroPrimero", "");
    setField("segundo", "");
    setField("divSegundo", "");
    setField("divTerceroSegundo", "");
    setField("tercero", "");
    setField("divTercero", "");
    setField("favorito", "");
    setField("retiros", "");
    setField("empatePrimero", "");
    setField("empateSegundo", "");
    setField("empateTercero", "");
    setField("empatePrimeroGanador", "");
    setField("empatePrimeroDivSegundo", "");
    setField("empatePrimeroDivTercero", "");
    setField("empateSegundoDivSegundo", "");
    setField("empateSegundoDivTercero", "");
    setField("empateTerceroDivTercero", "");
    const tieToggle = resultForm.querySelector('[name="hasTie"]');
    const tiePanel = resultForm.querySelector("[data-tie-panel]");
    if (tieToggle) tieToggle.checked = false;
    if (tiePanel) tiePanel.hidden = true;
    syncResultSummary();
  };
  const syncResultSummary = () => {
    if (!resultForm) return;
    const ganador = toNumeric(resultForm.querySelector('[name="ganador"]')?.value) || 0;
    const divSegundoPrimero = toNumeric(resultForm.querySelector('[name="divSegundoPrimero"]')?.value) || 0;
    const divTerceroPrimero = toNumeric(resultForm.querySelector('[name="divTerceroPrimero"]')?.value) || 0;
    const divSegundo = toNumeric(resultForm.querySelector('[name="divSegundo"]')?.value) || 0;
    const divTerceroSegundo = toNumeric(resultForm.querySelector('[name="divTerceroSegundo"]')?.value) || 0;
    const divTercero = toNumeric(resultForm.querySelector('[name="divTercero"]')?.value) || 0;
    const writeValue = (selector, value) => {
      const input = resultForm.querySelector(selector);
      if (input) input.value = formatSummaryValue(value);
    };
    writeValue("[data-sum-first]", ganador + divSegundoPrimero + divTerceroPrimero);
    writeValue("[data-sum-second]", divSegundo + divTerceroSegundo);
    writeValue("[data-sum-third]", divTercero);
  };
  resultForm?.querySelectorAll('[name="ganador"], [name="divSegundoPrimero"], [name="divTerceroPrimero"], [name="divSegundo"], [name="divTerceroSegundo"], [name="divTercero"]').forEach((input) => {
    input.addEventListener("input", syncResultSummary);
  });
  resultForm?.querySelector('[name="hasTie"]')?.addEventListener("change", (toggleEvent) => {
    const tiePanel = resultForm.querySelector("[data-tie-panel]");
    if (tiePanel) tiePanel.hidden = !toggleEvent.currentTarget.checked;
  });
  resultForm?.querySelector('[name="race"]')?.addEventListener("change", (raceEvent) => {
    const raceValue = String(raceEvent.currentTarget.value || "");
    state.adminResultRace = raceValue;
    const saved = event.results.find((item) => String(item.race) === raceValue);
    if (saved) {
      fillResultForm(saved);
    } else {
      clearResultForm(raceValue);
    }
  });
  container.querySelectorAll("[data-edit-race]").forEach((button) => {
    button.addEventListener("click", () => {
      const raceValue = String(button.dataset.editRace || "");
      state.adminResultRace = raceValue;
      const saved = event.results.find((item) => String(item.race) === raceValue);
      if (saved) fillResultForm(saved);
      const raceInput = resultForm?.querySelector('[name="race"]');
      if (raceInput) raceInput.value = raceValue;
      resultForm?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  syncResultSummary();

  const getTargets = () => {
    const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    const resolved = resolveCampaignTargetIds({
      operationDate,
      daily: safeArray(state.adminTargetSelections.daily),
      weekly: safeArray(state.adminTargetSelections.weekly),
      monthly: safeArray(state.adminTargetSelections.monthly),
    });
    return {
      targetEventIds: resolved.ids.length ? resolved.ids : [event.id],
      warnings: resolved.warnings,
    };
  };

  container.querySelector("[data-save-race-count]")?.addEventListener("click", async () => {
    const input = container.querySelector("[data-event-race-count]");
    const raceCount = Number(input?.value || 0);
    if (!Number.isFinite(raceCount) || raceCount < 1) {
      return showToast("La cantidad de carreras debe ser al menos 1.");
    }
    const { targetEventIds, warnings } = getTargets();
    const targetIds = targetEventIds.length ? targetEventIds : [event.id];
    try {
      let latestData = null;
      for (const targetEventId of targetIds) {
        const response = await fetch(`/api/events/${encodeURIComponent(targetEventId)}/meta`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ raceCount }),
        });
        const data = await response.json();
        if (!response.ok) {
          return showToast(data.detail || data.error || "No se pudo guardar la cantidad de carreras.");
        }
        latestData = data;
      }
      if (latestData) {
        state.data = latestData;
        render();
      }
      showToast(warnings.length ? warnings.join(" ") : "Cantidad de carreras guardada.");
    } catch (error) {
      showToast("No se pudo guardar la cantidad de carreras.");
    }
  });

  container.querySelector("[data-import-teletrak]")?.addEventListener("click", async () => {
    const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    const trackId = Number(container.querySelector("[data-teletrak-track]")?.value || 0);
    if (!operationDate || !Number.isFinite(trackId) || trackId < 1) {
      return showToast("Elige una fecha y un hipÃ³dromo de Teletrak para importar.");
    }
    const { targetEventIds, warnings } = getTargets();
    const targetIds = targetEventIds.length ? targetEventIds : [event.id];
    const response = await fetch("/api/import/teletrak/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: operationDate,
        trackId,
        targetEventIds: targetIds,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return showToast(data.detail || data.error || "No se pudieron importar los resultados de Teletrak.");
    }
    state.data = data;
    render();
    const importedRaces = Number(data.importSummary?.importedRaces) || 0;
    const importedRaceCount = Number(data.importSummary?.raceCount) || 0;
    const summary = `Teletrak importÃ³ ${importedRaces} carreras${importedRaceCount ? ` y dejÃ³ ${importedRaceCount} carreras para la jornada` : ""}.`;
    showToast(warnings.length ? `${summary} ${warnings.join(" ")}` : summary);
  });

  container.querySelector("[data-copy-results-source]")?.addEventListener("change", (changeEvent) => {
    state.adminResultCopySourceId = String(changeEvent.currentTarget.value || "");
  });

  container.querySelector("[data-copy-results]")?.addEventListener("click", async () => {
    const sourceEventId = String(container.querySelector("[data-copy-results-source]")?.value || "");
    if (!sourceEventId) {
      return showToast("Elige primero la jornada origen para copiar resultados.");
    }
    const sourceEvent = findEventById(sourceEventId);
    const { targetEventIds, warnings } = getTargets();
    const targetIds = targetEventIds.length ? targetEventIds : [event.id];
    const response = await fetch("/api/events/copy-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceEventId,
        targetEventIds: targetIds,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return showToast(data.detail || data.error || "No se pudieron copiar los resultados.");
    }
    state.data = data;
    const updatedEvent = findEventById(event.id);
    const filled = new Set(safeArray(updatedEvent?.results).map((item) => String(item.race)));
    let nextRace = String(updatedEvent?.races || event.races || 1);
    for (let race = 1; race <= (updatedEvent?.races || event.races || 1); race += 1) {
      if (!filled.has(String(race))) {
        nextRace = String(race);
        break;
      }
    }
    state.adminResultRace = nextRace;
    render();
    const copiedCount = safeArray(sourceEvent?.results).length;
    const summary = `Se copiaron ${copiedCount} resultado${copiedCount === 1 ? "" : "s"} desde la jornada origen.`;
    showToast(warnings.length ? `${summary} ${warnings.join(" ")}` : summary);
  });

  loadTeletrakTracks();

  container.querySelector('[data-form="participant"]')?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const { targetEventIds, warnings } = getTargets();
    const response = await fetch("/api/operations/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEventIds,
        participant: {
          index: Number(form.get("index")),
          name: form.get("name"),
          picks: Array.from({ length: Math.min(event.races, 30) }, (_, index) => form.get(`pick-${index + 1}`) || ""),
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el pronÃ³stico.");
    state.data = data;
    render();
    showToast(warnings.length ? warnings.join(" ") : "PronÃ³stico guardado en las campaÃ±as seleccionadas.");
  });

  container.querySelector('[data-form="result"]')?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const { targetEventIds, warnings } = getTargets();
    const raceNumber = Number(form.get("race"));
    if (!Number.isFinite(raceNumber) || raceNumber < 1 || raceNumber > event.races) {
      return showToast(`La carrera debe estar entre 1 y ${event.races}.`);
    }
    const response = await fetch("/api/operations/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEventIds,
        result: {
          race: String(raceNumber),
          primero: form.get("primero"),
          ganador: form.get("ganador"),
          divSegundoPrimero: form.get("divSegundoPrimero"),
          divTerceroPrimero: form.get("divTerceroPrimero"),
          segundo: form.get("segundo"),
          divSegundo: form.get("divSegundo"),
          divTerceroSegundo: form.get("divTerceroSegundo"),
          tercero: form.get("tercero"),
          divTercero: form.get("divTercero"),
          empatePrimero: form.get("hasTie") === "on" ? form.get("empatePrimero") : "",
          empatePrimeroGanador: form.get("hasTie") === "on" ? form.get("empatePrimeroGanador") : "",
          empatePrimeroDivSegundo: form.get("hasTie") === "on" ? form.get("empatePrimeroDivSegundo") : "",
          empatePrimeroDivTercero: form.get("hasTie") === "on" ? form.get("empatePrimeroDivTercero") : "",
          empateSegundo: form.get("hasTie") === "on" ? form.get("empateSegundo") : "",
          empateSegundoDivSegundo: form.get("hasTie") === "on" ? form.get("empateSegundoDivSegundo") : "",
          empateSegundoDivTercero: form.get("hasTie") === "on" ? form.get("empateSegundoDivTercero") : "",
          empateTercero: form.get("hasTie") === "on" ? form.get("empateTercero") : "",
          empateTerceroDivTercero: form.get("hasTie") === "on" ? form.get("empateTerceroDivTercero") : "",
          favorito: form.get("favorito"),
          retiros: parseRetirosInput(form.get("retiros")),
          retiro1: "",
          retiro2: "",
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el resultado.");
    state.data = data;
    render();
    showToast(warnings.length ? warnings.join(" ") : `Resultado de carrera ${raceNumber} guardado en las campaÃ±as seleccionadas.`);
  });
}

renderTeletrakImportPanel = function renderTeletrakImportPanelDateDriven(event) {
  const selectedTrackId = String(state.teletrakImport.selectedTrackId || "");
  const trackOptions = state.teletrakImport.tracks.length
    ? state.teletrakImport.tracks.map((track) => `<option value="${track.id}"${String(track.id) === selectedTrackId ? " selected" : ""}>${track.name}</option>`).join("")
    : '<option value="">Cargando hipodromos...</option>';
  return `<section class="panel compact"><div class="panel-head"><h4>Importar desde Teletrak</h4><p>Trae la jornada completa desde apuestas.teletrak.cl usando la fecha operativa.</p></div><div class="form-grid"><div class="field"><label>Hipodromo Teletrak</label><select data-teletrak-track>${trackOptions}</select></div><div class="field"><label>Carreras de la jornada</label><div class="toolbar-group"><input data-event-race-count type="number" min="1" max="40" value="${event.races || 12}" /><button type="button" class="ghost-button" data-save-race-count>Guardar carreras</button></div></div></div><div class="actions"><span class="hint">Importa 1°, 2°, 3°, dividendos, empates y retiros. La cantidad de carreras se guarda en las campañas activas de esa fecha.</span><button type="button" class="ghost-button" data-refresh-teletrak>Actualizar hipodromos</button><button type="button" class="primary-button" data-import-teletrak>Importar resultados</button></div></section>`;
};

renderResultsForm = function renderResultsFormDateDriven(event) {
  const operationDate = state.resultOperationDate || toLocalDateInputValue();
  const source = getResultSourceForDate(operationDate);
  const currentEvent = source ? getOperationEventForDate(source, operationDate) : event;
  const sortedResults = [...safeArray(currentEvent.results)].sort((a, b) => Number(a.race) - Number(b.race));
  
  // Verificar estado de favoritos para el banner de estado
  const racesWithoutFavorite = sortedResults.filter(r => !r.favorito || r.favorito.trim() === '');
  const allHaveFavorite = racesWithoutFavorite.length === 0;
  const totalRaces = sortedResults.length;
  
  // Renderizar banner de estado
  const renderStatusBanner = () => {
    if (totalRaces === 0) {
      return `<section class="panel compact" style="background: #fff3cd; border-left: 4px solid #ffc107;">
        <div class="toolbar">
          <div>
            <strong>⏳ Esperando resultados</strong>
            <p class="hint" style="margin: 4px 0 0 0;">Aún no hay carreras importadas para esta fecha.</p>
          </div>
        </div>
      </section>`;
    }
    
    if (allHaveFavorite) {
      return `<section class="panel compact" style="background: #d4edda; border-left: 4px solid #28a745;">
        <div class="toolbar">
          <div>
            <strong>✅ Todo OK - ${totalRaces} carreras completas</strong>
            <p class="hint" style="margin: 4px 0 0 0;">Todas las carreras tienen favorito registrado.</p>
          </div>
        </div>
      </section>`;
    }
    
    const missingRaces = racesWithoutFavorite.map(r => r.race).join(', ');
    return `<section class="panel compact" style="background: #f8d7da; border-left: 4px solid #dc3545;">
      <div class="toolbar">
        <div>
          <strong>⚠️ Faltan favoritos en ${racesWithoutFavorite.length} carrera(s)</strong>
          <p class="hint" style="margin: 4px 0 0 0;">Carreras sin favorito: <strong>${missingRaces}</strong></p>
          <p class="hint" style="margin: 2px 0 0 0; font-size: 0.85rem;">Revisa la pestaña "Probables" en Teletrak o agrega manualmente desde la tabla de abajo.</p>
        </div>
      </div>
    </section>`;
  };
  
  const getNextPendingRace = () => {
    const filled = new Set(sortedResults.map((item) => String(item.race)));
    for (let race = 1; race <= currentEvent.races; race += 1) {
      if (!filled.has(String(race))) return String(race);
    }
    return String(currentEvent.races || 1);
  };
  const defaultRace = state.adminResultRace && Number(state.adminResultRace) >= 1 && Number(state.adminResultRace) <= currentEvent.races
    ? String(state.adminResultRace)
    : getNextPendingRace();
  const current = sortedResults.find((item) => String(item.race) === defaultRace) || { race: defaultRace };
  const retirosValue = Array.isArray(current.retiros) && current.retiros.length ? current.retiros.join(", ") : [current.retiro1, current.retiro2].filter(Boolean).join(", ");
  const hasTie = Boolean(current.empatePrimero || current.empateSegundo || current.empateTercero || current.empatePrimeroGanador || current.empatePrimeroDivSegundo || current.empatePrimeroDivTercero || current.empateSegundoDivSegundo || current.empateSegundoDivTercero || current.empateTerceroDivTercero);
  const showTieFirst = sortedResults.some((item) => item.empatePrimero);
  const showTieSecond = sortedResults.some((item) => item.empateSegundo);
  const showTieThird = sortedResults.some((item) => item.empateTercero);
  const resultColumns = [
    "C",
    "1°",
    "Div Gan",
    "Div 2°",
    "Div 3°",
    "2°",
    "Div 2°",
    "Div 3°",
    "3°",
    "Div 3°",
  ];
  if (showTieFirst) {
    resultColumns.push("Emp 1°", "Emp 1° Gan", "Emp 1° Div 2°", "Emp 1° Div 3°");
  }
  if (showTieSecond) {
    resultColumns.push("Emp 2°", "Emp 2° Div 2°", "Emp 2° Div 3°");
  }
  if (showTieThird) {
    resultColumns.push("Emp 3°", "Emp 3° Div 3°");
  }
  resultColumns.push("Fav", "Retiros");
  const resultRows = sortedResults.map((item) => {
    const row = [
      item.race,
      item.primero || "-",
      item.ganador || "-",
      item.divSegundoPrimero ?? item.divSegundo ?? "-",
      item.divTerceroPrimero ?? item.divTercero ?? "-",
      item.segundo || "-",
      item.divSegundo || "-",
      item.divTerceroSegundo ?? item.divTercero ?? "-",
      item.tercero || "-",
      item.divTercero || "-",
    ];
    if (showTieFirst) {
      row.push(
        item.empatePrimero || "-",
        item.empatePrimeroGanador ?? "-",
        item.empatePrimeroDivSegundo ?? "-",
        item.empatePrimeroDivTercero ?? "-",
      );
    }
    if (showTieSecond) {
      row.push(
        item.empateSegundo || "-",
        item.empateSegundoDivSegundo ?? "-",
        item.empateSegundoDivTercero ?? "-",
      );
    }
    if (showTieThird) {
      row.push(
        item.empateTercero || "-",
        item.empateTerceroDivTercero ?? "-",
      );
    }
    row.push(
      item.favorito || "-",
      safeArray(item.retiros).join(", ") || [item.retiro1, item.retiro2].filter(Boolean).join(", ") || "-",
    );
    return row;
  });

  // Crear tabla editable con inputs para dividendos
  const renderEditableResultsTable = () => {
    const dividendFields = ['ganador', 'divSegundoPrimero', 'divTerceroPrimero', 'divSegundo', 'divTerceroSegundo', 'divTercero', 'empatePrimero', 'empatePrimeroGanador', 'empatePrimeroDivSegundo', 'empatePrimeroDivTercero', 'empateSegundo', 'empateSegundoDivSegundo', 'empateSegundoDivTercero', 'empateTercero', 'empateTerceroDivTercero'];

    return `
      <style>
        .results-editable-table { width: 100%; border-collapse: collapse; font-size: 0.85rem; }
        .results-editable-table th { background: #f8f9fa; padding: 8px 6px; text-align: center; font-weight: 600; border-bottom: 2px solid #e9ecef; position: sticky; top: 0; z-index: 10; }
        .results-editable-table td { padding: 6px; text-align: center; border-bottom: 1px solid #e9ecef; }
        .results-editable-table tr:hover { background: #f8f9fa; }
        .results-editable-table input[type="text"] { width: 60px; padding: 4px; text-align: center; border: 1px solid #d0d7de; background: #fff; border-radius: 4px; font-size: 0.85rem; }
        .results-editable-table input[type="text"]:hover { border-color: #4a90d9; background: #f0f7ff; }
        .results-editable-table input[type="text"]:focus { border-color: #4a90d9; background: white; outline: none; box-shadow: 0 0 0 2px rgba(74,144,217,0.2); }
        .results-editable-table .race-number { font-weight: 600; color: #666; }
        .results-editable-table .horse-number { font-weight: 500; }
        .results-save-bar { display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 10px 12px; background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%); border: 1px solid #28a745; border-radius: 6px; margin-bottom: 10px; position: sticky; top: 0; z-index: 20; }
        .results-save-bar .hint-text { font-size: 0.8rem; color: #155724; font-weight: 500; }
      </style>
      <div class="results-save-bar">
        <span class="hint-text">✏️ Haz clic en cualquier celda para editar</span>
        <button class="primary-button" id="saveDividendsButton" style="font-size: 0.85rem; padding: 8px 20px; background: #28a745;">💾 Guardar dividendos editados</button>
      </div>
      <div style="overflow-x: auto; max-height: 500px; overflow-y: auto; border: 1px solid #e9ecef; border-radius: 8px;">
        <table class="results-editable-table">
          <thead>
            <tr>
              <th>C</th><th>1°</th><th>Div Gan</th><th>Div 1°/2°</th><th>Div 1°/3°</th>
              <th>2°</th><th>Div 2°</th><th>Div 2°/3°</th>
              <th>3°</th><th>Div 3°</th>
              ${showTieFirst ? '<th>Emp 1°</th><th>Emp 1° Gan</th><th>Emp 1° Div 2°</th><th>Emp 1° Div 3°</th>' : ''}
              ${showTieSecond ? '<th>Emp 2°</th><th>Emp 2° Div 2°</th><th>Emp 2° Div 3°</th>' : ''}
              ${showTieThird ? '<th>Emp 3°</th><th>Emp 3° Div 3°</th>' : ''}
              <th>Fav</th><th>Retiros</th>
            </tr>
          </thead>
          <tbody>
            ${sortedResults.map((item, idx) => `
              <tr>
                <td class="race-number">${item.race}</td>
                <td class="horse-number">${item.primero || ''}</td>
                <td><input type="text" data-race="${item.race}" data-field="ganador" value="${item.ganador || ''}" placeholder="-" /></td>
                <td><input type="text" data-race="${item.race}" data-field="divSegundoPrimero" value="${item.divSegundoPrimero ?? item.divSegundo ?? ''}" placeholder="-" /></td>
                <td><input type="text" data-race="${item.race}" data-field="divTerceroPrimero" value="${item.divTerceroPrimero ?? item.divTercero ?? ''}" placeholder="-" /></td>
                <td class="horse-number">${item.segundo || ''}</td>
                <td><input type="text" data-race="${item.race}" data-field="divSegundo" value="${item.divSegundo || ''}" placeholder="-" /></td>
                <td><input type="text" data-race="${item.race}" data-field="divTerceroSegundo" value="${item.divTerceroSegundo ?? item.divTercero ?? ''}" placeholder="-" /></td>
                <td class="horse-number">${item.tercero || ''}</td>
                <td><input type="text" data-race="${item.race}" data-field="divTercero" value="${item.divTercero || ''}" placeholder="-" /></td>
                ${showTieFirst ? `
                  <td>${item.empatePrimero || ''}</td>
                  <td><input type="text" data-race="${item.race}" data-field="empatePrimeroGanador" value="${item.empatePrimeroGanador ?? ''}" placeholder="-" /></td>
                  <td><input type="text" data-race="${item.race}" data-field="empatePrimeroDivSegundo" value="${item.empatePrimeroDivSegundo ?? ''}" placeholder="-" /></td>
                  <td><input type="text" data-race="${item.race}" data-field="empatePrimeroDivTercero" value="${item.empatePrimeroDivTercero ?? ''}" placeholder="-" /></td>
                ` : ''}
                ${showTieSecond ? `
                  <td>${item.empateSegundo || ''}</td>
                  <td><input type="text" data-race="${item.race}" data-field="empateSegundoDivSegundo" value="${item.empateSegundoDivSegundo ?? ''}" placeholder="-" /></td>
                  <td><input type="text" data-race="${item.race}" data-field="empateSegundoDivTercero" value="${item.empateSegundoDivTercero ?? ''}" placeholder="-" /></td>
                ` : ''}
                ${showTieThird ? `
                  <td>${item.empateTercero || ''}</td>
                  <td><input type="text" data-race="${item.race}" data-field="empateTerceroDivTercero" value="${item.empateTerceroDivTercero ?? ''}" placeholder="-" /></td>
                ` : ''}
                <td>${item.favorito || ''}</td>
                <td>${safeArray(item.retiros).join(', ') || [item.retiro1, item.retiro2].filter(Boolean).join(', ') || ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  return `${renderTeletrakImportPanel(currentEvent)}${renderResultCopyPanel(operationDate, currentEvent)}${renderStatusBanner()}<section class="panel"><div class="toolbar"><div class="panel-head"><h4>Resultados registrados</h4><p>Lo que ya esta guardado para esta fecha operativa. Haz clic en un dividendo para editarlo.</p></div><button class="ghost-button" id="refreshResultsButton" title="Refrescar resultados"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3-6.7"/><polyline points="21 3 21 9 15 9"/></svg></button></div><div id="resultsTableContainer">${renderEditableResultsTable()}</div></section><form class="editor-form" data-form="result"><div class="panel-head"><h4>Cargar resultado manual</h4><p>Carga por fecha operativa. Si la fecha tiene varias campanas activas, todas reciben el mismo resultado.</p></div><div class="result-grid"><div class="field"><label>Carrera</label><input name="race" type="number" min="1" max="${currentEvent.races}" value="${defaultRace}" /></div><div class="field"><label>Primero</label><input name="primero" type="text" value="${current.primero || ""}" /></div><div class="field"><label>Div 1°</label><input name="ganador" type="text" value="${current.ganador || ""}" /></div><div class="field"><label>Div 1° / 2°</label><input name="divSegundoPrimero" type="text" value="${current.divSegundoPrimero || ""}" /></div><div class="field"><label>Div 1° / 3°</label><input name="divTerceroPrimero" type="text" value="${current.divTerceroPrimero || ""}" /></div><div class="field"><label>Segundo</label><input name="segundo" type="text" value="${current.segundo || ""}" /></div><div class="field"><label>Div 2°</label><input name="divSegundo" type="text" value="${current.divSegundo || ""}" /></div><div class="field"><label>Div 2° / 3°</label><input name="divTerceroSegundo" type="text" value="${current.divTerceroSegundo || ""}" /></div><div class="field"><label>Tercero</label><input name="tercero" type="text" value="${current.tercero || ""}" /></div><div class="field"><label>Div 3°</label><input name="divTercero" type="text" value="${current.divTercero || ""}" /></div><div class="field"><label>Empate 1°</label><input name="empatePrimero" type="text" value="${current.empatePrimero || ""}" /></div><div class="field"><label>Empate 1° / Ganador</label><input name="empatePrimeroGanador" type="text" value="${current.empatePrimeroGanador || ""}" /></div><div class="field"><label>Empate 1° / Div 2°</label><input name="empatePrimeroDivSegundo" type="text" value="${current.empatePrimeroDivSegundo || ""}" /></div><div class="field"><label>Empate 1° / Div 3°</label><input name="empatePrimeroDivTercero" type="text" value="${current.empatePrimeroDivTercero || ""}" /></div><div class="field"><label>Empate 2°</label><input name="empateSegundo" type="text" value="${current.empateSegundo || ""}" /></div><div class="field"><label>Empate 2° / Div 2°</label><input name="empateSegundoDivSegundo" type="text" value="${current.empateSegundoDivSegundo || ""}" /></div><div class="field"><label>Empate 2° / Div 3°</label><input name="empateSegundoDivTercero" type="text" value="${current.empateSegundoDivTercero || ""}" /></div><div class="field"><label>Empate 3°</label><input name="empateTercero" type="text" value="${current.empateTercero || ""}" /></div><div class="field"><label>Empate 3° / Div 3°</label><input name="empateTerceroDivTercero" type="text" value="${current.empateTerceroDivTercero || ""}" /></div><div class="field"><label>Favorito</label><input name="favorito" type="text" value="${current.favorito || ""}" /></div><div class="field"><label>Retiros</label><input name="retiros" type="text" value="${retirosValue}" placeholder="Ej. 6, 8, 11" /></div><div class="field"><label><input name="hasTie" type="checkbox"${hasTie ? " checked" : ""} /> Activar bloque de empates</label></div></div><div class="actions"><span class="hint">Guarda una vez por fecha y el sistema replica a las campanas activas de ese dia.</span><button class="primary-button" type="submit">Guardar resultado</button></div></form>`;
};

bindEventForms = function bindEventFormsDateDriven(container, event) {
  const resultForm = container.querySelector('[data-form="result"]');
  const loadTeletrakTracks = async (operationDate, silent = false) => {
    if (!operationDate) return;
    const select = container.querySelector("[data-teletrak-track]");
    if (select) {
      select.innerHTML = '<option value="">Cargando hipodromos...</option>';
    }
    try {
      const response = await fetch(`/api/import/teletrak/tracks?date=${encodeURIComponent(operationDate)}`);
      const data = await response.json();
      if (!response.ok) {
        if (select) {
          select.innerHTML = '<option value="">Sin hipodromos para esa fecha</option>';
        }
        if (!silent) showToast(data.detail || data.error || "No se pudieron cargar los hipodromos de Teletrak.");
        return;
      }
      state.teletrakImport.lastDate = operationDate;
      state.teletrakImport.tracks = safeArray(data.tracks);
      const nextSelected = state.teletrakImport.tracks.some((track) => String(track.id) === String(state.teletrakImport.selectedTrackId))
        ? String(state.teletrakImport.selectedTrackId)
        : String(state.teletrakImport.tracks[0]?.id || "");
      state.teletrakImport.selectedTrackId = nextSelected;
      if (select) {
        select.innerHTML = state.teletrakImport.tracks.length
          ? state.teletrakImport.tracks.map((track) => `<option value="${track.id}"${String(track.id) === nextSelected ? " selected" : ""}>${track.name}</option>`).join("")
          : '<option value="">Sin hipodromos para esa fecha</option>';
      }
    } catch (error) {
      const select = container.querySelector("[data-teletrak-track]");
      if (select) {
        select.innerHTML = '<option value="">Sin hipodromos para esa fecha</option>';
      }
      if (!silent) showToast("No se pudieron cargar los hipodromos de Teletrak.");
    }
  };
  const formatSummaryValue = (value) => {
    const rounded = Math.round(value * 100) / 100;
    if (!rounded) return "";
    return String(rounded).replace(".", ",");
  };
  const fillResultForm = (result) => {
    if (!resultForm || !result) return;
    const setField = (name, value) => {
      const input = resultForm.querySelector(`[name="${name}"]`);
      if (input) input.value = value || "";
    };
    setField("race", result.race);
    setField("primero", result.primero);
    setField("ganador", result.ganador);
    setField("divSegundoPrimero", result.divSegundoPrimero);
    setField("divTerceroPrimero", result.divTerceroPrimero);
    setField("segundo", result.segundo);
    setField("divSegundo", result.divSegundo);
    setField("divTerceroSegundo", result.divTerceroSegundo);
    setField("tercero", result.tercero);
    setField("divTercero", result.divTercero);
    setField("favorito", result.favorito);
    setField("retiros", Array.isArray(result.retiros) && result.retiros.length ? result.retiros.join(", ") : [result.retiro1, result.retiro2].filter(Boolean).join(", "));
    setField("empatePrimero", result.empatePrimero);
    setField("empatePrimeroGanador", result.empatePrimeroGanador);
    setField("empatePrimeroDivSegundo", result.empatePrimeroDivSegundo);
    setField("empatePrimeroDivTercero", result.empatePrimeroDivTercero);
    setField("empateSegundo", result.empateSegundo);
    setField("empateSegundoDivSegundo", result.empateSegundoDivSegundo);
    setField("empateSegundoDivTercero", result.empateSegundoDivTercero);
    setField("empateTercero", result.empateTercero);
    setField("empateTerceroDivTercero", result.empateTerceroDivTercero);
  };
  const syncResultSummary = () => {
    if (!resultForm) return;
    const ganador = toNumeric(resultForm.querySelector('[name="ganador"]')?.value) || 0;
    const divSegundoPrimero = toNumeric(resultForm.querySelector('[name="divSegundoPrimero"]')?.value) || 0;
    const divTerceroPrimero = toNumeric(resultForm.querySelector('[name="divTerceroPrimero"]')?.value) || 0;
    const divSegundo = toNumeric(resultForm.querySelector('[name="divSegundo"]')?.value) || 0;
    const divTerceroSegundo = toNumeric(resultForm.querySelector('[name="divTerceroSegundo"]')?.value) || 0;
    const divTercero = toNumeric(resultForm.querySelector('[name="divTercero"]')?.value) || 0;
    const writeValue = (selector, value) => {
      const input = resultForm.querySelector(selector);
      if (input) input.value = formatSummaryValue(value);
    };
    writeValue("[data-sum-first]", ganador + divSegundoPrimero);
    writeValue("[data-sum-second]", divSegundo);
    writeValue("[data-sum-third]", divTercero);
    writeValue("[data-sum-tie-first]", divSegundoPrimero + divTerceroPrimero);
    writeValue("[data-sum-tie-second]", divSegundo + divTerceroSegundo);
  };
  const getForecastTargets = () => {
    const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    const resolved = resolveCampaignTargetIds({
      operationDate,
      daily: safeArray(state.adminTargetSelections.daily),
      weekly: safeArray(state.adminTargetSelections.weekly),
      monthly: safeArray(state.adminTargetSelections.monthly),
    });
    return {
      targetEventIds: resolved.ids.length ? resolved.ids : [event.id],
      warnings: resolved.warnings,
    };
  };
  const getResultTargets = () => {
    const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    const resolved = getResultTargetsByDate(operationDate);
    return {
      targetEventIds: resolved.targetEventIds.length ? resolved.targetEventIds : [event.id],
      warnings: resolved.targetEventIds.length ? [] : [`No hay campanas activas para ${operationDate}.`],
    };
  };

  resultForm?.querySelectorAll('[name="ganador"], [name="divSegundoPrimero"], [name="divTerceroPrimero"], [name="divSegundo"], [name="divTerceroSegundo"], [name="divTercero"]').forEach((input) => {
    input.addEventListener("input", syncResultSummary);
  });
  resultForm?.querySelector('[name="race"]')?.addEventListener("change", (raceEvent) => {
    state.adminResultRace = String(raceEvent.currentTarget.value || "");
    const saved = event.results.find((item) => String(item.race) === String(raceEvent.currentTarget.value || ""));
    if (saved) fillResultForm(saved);
  });
  container.querySelector("[data-operation-date]")?.addEventListener("change", (changeEvent) => {
    state.resultOperationDate = changeEvent.currentTarget.value || toLocalDateInputValue();
    render();
  });
  
  // Event listener para el nuevo input de fecha en el primer recuadro
  container.querySelector("#resultOperationDateInput")?.addEventListener("change", (changeEvent) => {
    state.resultOperationDate = changeEvent.currentTarget.value || toLocalDateInputValue();
    render();
  });
  
  // Event listener para el botón de refrescar resultados
  container.querySelector("#refreshResultsButton")?.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/data");
      const payload = await response.json();
      if (!response.ok) return showToast(payload.detail || payload.error || "No se pudieron refrescar los datos.");
      state.data = payload;
      render();
      showToast("Resultados actualizados correctamente.");
    } catch (error) {
      showToast("Error al refrescar los resultados.");
    }
  });
  
  // Event listener para guardar dividendos editados directamente en la tabla
  container.querySelector("#saveDividendsButton")?.addEventListener("click", async () => {
    try {
      // Recopilar todos los inputs editados
      const inputs = container.querySelectorAll("#resultsTableContainer input[data-race][data-field]");
      const updatesByRace = {};

      inputs.forEach(input => {
        const race = input.dataset.race;
        const field = input.dataset.field;
        const value = input.value.trim();

        if (!updatesByRace[race]) updatesByRace[race] = {};
        updatesByRace[race][field] = value;
      });

      if (Object.keys(updatesByRace).length === 0) {
        return showToast("No hay dividendos editados para guardar.");
      }

      // Obtener targets para guardar (campañas activas)
      const { targetEventIds, warnings } = getResultTargets();
      
      // SIEMPRE guardar en el evento genérico importado-${operationDate} primero
      const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
      const genericEventId = `imported-${operationDate}`;
      
      const allTargetIds = [genericEventId, ...targetEventIds.filter(id => id !== genericEventId)];

      // Guardar cada carrera editada en TODOS los targets
      for (const race of Object.keys(updatesByRace)) {
        const updates = updatesByRace[race];

        for (const targetEventId of allTargetIds) {
          const response = await fetch(`/api/events/${encodeURIComponent(targetEventId)}/results/${encodeURIComponent(race)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ race, ...updates }),
          });

          if (!response.ok) {
            const data = await response.json();
            return showToast(data.detail || data.error || `No se pudo guardar el resultado de la carrera ${race}.`);
          }
        }
      }

      showToast(warnings.length ? `${warnings.join(" ")} Dividendos guardados correctamente en ${allTargetIds.length} evento(s).` : "Dividendos guardados correctamente.");

      // Recargar datos
      const response = await fetch("/api/data");
      const payload = await response.json();
      if (response.ok) {
        state.data = payload;
        render();
      }
    } catch (error) {
      showToast("Error al guardar los dividendos: " + error.message);
    }
  });
  container.querySelector("[data-refresh-teletrak]")?.addEventListener("click", async () => {
    const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    await loadTeletrakTracks(operationDate);
    showToast("Hipodromos de Teletrak actualizados.");
  });
  container.querySelector("[data-save-race-count]")?.addEventListener("click", async () => {
    const raceCount = Number(container.querySelector("[data-event-race-count]")?.value || 0);
    if (!Number.isFinite(raceCount) || raceCount < 1) return showToast("La cantidad de carreras debe ser al menos 1.");
    const { targetEventIds, warnings } = getResultTargets();
    let latestData = null;
    for (const targetEventId of targetEventIds) {
      const response = await fetch(`/api/events/${encodeURIComponent(targetEventId)}/meta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raceCount }),
      });
      const data = await response.json();
      if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar la cantidad de carreras.");
      latestData = data;
    }
    if (latestData) state.data = latestData;
    render();
    showToast(warnings.length ? warnings.join(" ") : "Cantidad de carreras guardada.");
  });
  container.querySelector("[data-import-teletrak]")?.addEventListener("click", async () => {
    const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    const trackId = Number(container.querySelector("[data-teletrak-track]")?.value || 0);
    if (!operationDate || !Number.isFinite(trackId) || trackId < 1) return showToast("Elige una fecha y un hipodromo de Teletrak para importar.");
    const { targetEventIds, warnings } = getResultTargets();
    const response = await fetch("/api/import/teletrak/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: operationDate, trackId, targetEventIds }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudieron importar los resultados de Teletrak.");
    state.data = data;
    render();
    showToast(warnings.length ? `${warnings.join(" ")} Resultados importados desde Teletrak para ${operationDate}.` : `Resultados importados desde Teletrak para ${operationDate}.`);
  });
  container.querySelector("[data-copy-results-source]")?.addEventListener("change", (changeEvent) => {
    state.adminResultCopySourceId = String(changeEvent.currentTarget.value || "");
  });
  container.querySelector("[data-copy-results]")?.addEventListener("click", async () => {
    const sourceEventId = String(container.querySelector("[data-copy-results-source]")?.value || "");
    if (!sourceEventId) return showToast("Elige primero la jornada origen para copiar resultados.");
    const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    const targetIds = getResultTargetsByDate(operationDate).targetEventIds;
    if (!targetIds.length) return showToast("No hay campanas activas para copiar en esa fecha.");
    const response = await fetch("/api/events/copy-results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceEventId, targetEventIds: Array.from(new Set(targetIds.filter(Boolean))) }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudieron copiar los resultados.");
    state.data = data;
    render();
    const sourceEvent = findEventById(sourceEventId);
    const copiedCount = safeArray(sourceEvent?.results).length;
    showToast(`Se copiaron ${copiedCount} resultado${copiedCount === 1 ? "" : "s"} desde la jornada origen.`);
  });
  loadTeletrakTracks(container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue(), true);
  container.querySelector('[data-form="result"]')?.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const form = new FormData(submitEvent.currentTarget);
    const { targetEventIds, warnings } = getResultTargets();
    const raceNumber = Number(form.get("race"));
    if (!Number.isFinite(raceNumber) || raceNumber < 1) return showToast("La carrera debe ser valida.");
    const response = await fetch("/api/operations/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        targetEventIds,
        result: {
          race: String(raceNumber),
          primero: form.get("primero"),
          ganador: form.get("ganador"),
          divSegundoPrimero: form.get("divSegundoPrimero"),
          divTerceroPrimero: form.get("divTerceroPrimero"),
          segundo: form.get("segundo"),
          divSegundo: form.get("divSegundo"),
          divTerceroSegundo: form.get("divTerceroSegundo"),
          tercero: form.get("tercero"),
          divTercero: form.get("divTercero"),
          empatePrimero: form.get("empatePrimero"),
          empatePrimeroGanador: form.get("empatePrimeroGanador"),
          empatePrimeroDivSegundo: form.get("empatePrimeroDivSegundo"),
          empatePrimeroDivTercero: form.get("empatePrimeroDivTercero"),
          empateSegundo: form.get("empateSegundo"),
          empateSegundoDivSegundo: form.get("empateSegundoDivSegundo"),
          empateSegundoDivTercero: form.get("empateSegundoDivTercero"),
          empateTercero: form.get("empateTercero"),
          empateTerceroDivTercero: form.get("empateTerceroDivTercero"),
          favorito: form.get("favorito"),
          retiros: parseRetirosInput(form.get("retiros")),
          retiro1: "",
          retiro2: "",
        },
      }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el resultado.");
    state.data = data;
    render();
    showToast(warnings.length ? warnings.join(" ") : `Resultado de carrera ${raceNumber} guardado para la fecha operativa.`);
  });
};

loadDashboard = async function loadDashboardV2() {
  const response = await fetch("/api/data");
  const payload = await response.json();
  if (!response.ok) return showToast(payload.detail || payload.error || "No se pudo cargar la app.");
  const persistedSession = loadPersistedAdminSession();
  state.data = payload;
  if (persistedSession.currentView && ["admin", "daily", "weekly", "monthly"].includes(persistedSession.currentView)) {
    state.currentView = persistedSession.currentView;
  }
  if (persistedSession.adminTab) {
    state.adminTab = persistedSession.adminTab;
  }
  if (persistedSession.campaignsTab) {
    state.campaignsTab = persistedSession.campaignsTab;
  }
  if (persistedSession.adminUnlocked) {
    state.adminUnlocked = true;
    state.currentAdminUser = persistedSession.currentAdminUser || null;
  }
  state.dailyEventId = getDailyCampaignEvents(toLocalDateInputValue())[0]?.id || null;
  state.adminOpsEventId = state.data.semanal.events[0]?.id || state.data.mensual.events[0]?.id || null;
  state.weeklyCampaignId = getWeeklyCampaignGroups()[0]?.id || null;
  state.weeklyTab = state.data.settings.weekly.showTotalsByDefault ? "total" : (getWeeklyEvents()[0]?.id || "total");
  state.monthlyTab = state.data.settings.monthly.showTotalsByDefault ? "total" : (getMonthlyEvents()[0]?.id || "total");
  state.resultOperationDate = toLocalDateInputValue();
  state.adminTargetSelections = {
    operationDate: toLocalDateInputValue(),
    groupId: "",
    programTrackId: "",
    daily: [],
    weekly: [],
    monthly: [],
  };
  render();
}

const originalRenderAdminContent = renderAdminContent;
const originalBindEventForms = bindEventForms;

function renderScoringFieldsEditable(prefix = "", scoring = null) {
  const mode = scoring?.mode === "points" ? "points" : "dividend";
  const points = scoring?.points || {};
  const doubleLastRace = mode === "dividend" ? scoring?.doubleLastRace !== false : false;
  return `<div class="field"><label>Tipo de puntuacion</label><select name="${prefix}scoringMode" data-scoring-mode><option value="dividend"${mode === "dividend" ? " selected" : ""}>Por dividendo</option><option value="points"${mode === "points" ? " selected" : ""}>Por puntos</option></select></div><div class="check-grid" data-dividend-fields><label class="check-chip"><input type="checkbox" name="${prefix}doubleLastRace"${doubleLastRace ? " checked" : ""} /> Ultima carrera x2 en dividendos</label></div><div class="form-grid" data-points-fields${mode === "points" ? "" : " hidden"}><div class="field"><label>Puntos 1Â°</label><input name="${prefix}pointsFirst" type="number" min="0" value="${points.first ?? 10}" /></div><div class="field"><label>Puntos 2Â°</label><input name="${prefix}pointsSecond" type="number" min="0" value="${points.second ?? 5}" /></div><div class="field"><label>Puntos 3Â°</label><input name="${prefix}pointsThird" type="number" min="0" value="${points.third ?? 1}" /></div><div class="field"><label>Exclusivo 1Â°</label><input name="${prefix}pointsExclusiveFirst" type="number" min="0" value="${points.exclusiveFirst ?? 20}" /></div></div><p class="hint">Si eliges "por puntos", se usan estos valores. Si eliges "por dividendo", se usa ganador + segundo + tercero para el 1Â°, segundo + tercero para el 2Â° y solo tercero para el 3Â°. La opcion de ultima x2 solo aplica en dividendo.</p>`;
}

function upsertCampaign(kind, campaign) {
  const campaigns = getCampaigns(kind);
  const exists = campaigns.some((item) => item.id === campaign.id);
  return exists ? campaigns.map((item) => (item.id === campaign.id ? campaign : item)) : [...campaigns, campaign];
}

async function persistRegisteredParticipantsForMatches(names, selectedMatches = [], baseData = state.data) {
  const normalizedNames = Array.from(new Set(safeArray(names).map((name) => String(name || "").trim()).filter(Boolean)));
  if (!normalizedNames.length) return baseData;
  const targetKinds = ["weekly", "monthly"];
  const nextCampaigns = {
    daily: getCampaigns("daily"),
    weekly: getCampaigns("weekly"),
    monthly: getCampaigns("monthly"),
  };
  let changed = false;
  targetKinds.forEach((kind) => {
    const selectedIds = new Set(
      safeArray(selectedMatches)
        .filter((match) => match.campaignKind === kind)
        .map((match) => match.campaign?.id)
        .filter(Boolean),
    );
    if (!selectedIds.size) return;
    nextCampaigns[kind] = safeArray(nextCampaigns[kind]).map((campaign) => {
      if (!selectedIds.has(campaign.id)) return campaign;
      const registeredParticipants = Array.from(new Set([
        ...safeArray(campaign.registeredParticipants).map((name) => String(name || "").trim()).filter(Boolean),
        ...normalizedNames,
      ])).sort((a, b) => a.localeCompare(b, "es"));
      if (registeredParticipants.join("|") === safeArray(campaign.registeredParticipants).join("|")) {
        return campaign;
      }
      changed = true;
      return {
        ...campaign,
        registeredParticipants,
      };
    });
  });
  if (!changed) return baseData;
  const response = await fetch("/api/admin/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      campaigns: {
        weekly: nextCampaigns.weekly,
        monthly: nextCampaigns.monthly,
      },
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.detail || payload.error || "No se pudieron fijar los inscritos de la campaña.");
  }
  return payload;
}

function getWeeklySelectedDays(draft = {}) {
  const baseDays = safeArray(draft.activeDays || state.data.settings.weekly.activeDays);
  const finalDays = safeArray(draft.finalDays || state.data.settings.weekly.finalDays);
  return Array.from(new Set([...baseDays, ...finalDays]));
}

function getWeeklyRaceCountDrafts(campaignId, draft = {}) {
  const selectedEventIds = safeArray(draft.eventIds);
  if (selectedEventIds.length) {
    return state.data.semanal.events
      .filter((event) => selectedEventIds.includes(event.id))
      .map((event) => ({
        key: event.id,
        label: event.sheetName,
        value: Number(draft.raceCountsByEvent?.[event.id]) || Number(draft.raceCount) || event.races || 12,
      }));
  }
  const selectedDays = getWeeklySelectedDays(draft);
  return selectedDays.map((day) => {
    const eventId = `${campaignId}-${normalizeIdPart(day)}`;
    return {
      key: day,
      label: day,
      value: Number(draft.raceCountsByEvent?.[eventId]) || Number(draft.raceCount) || 12,
    };
  });
}

function getResultTargetsByDate(operationDate) {
  const matchesByKind = ["daily", "weekly", "monthly"].map((kind) => ({
    kind,
    label: kind === "daily" ? "Diarias" : kind === "weekly" ? "Semanales" : "Mensuales",
    matches: getCampaignMatchesByDate(kind, operationDate),
  }));
  const targetEventIds = Array.from(new Set(matchesByKind.flatMap((item) => item.matches.flatMap((match) => safeArray(match.eventIds)))));
  return { matchesByKind, targetEventIds };
}

function getResultSourceForDate(operationDate) {
  const sources = getOperationSources();
  const matchedSource = sources.find((source) => {
    const event = getOperationEventForDate(source, operationDate);
    return safeArray(event?.participants).length || safeArray(event?.results).length;
  });
  return matchedSource || sources[0] || null;
}

function renderResultDateSummary(operationDate) {
  const { matchesByKind, targetEventIds } = getResultTargetsByDate(operationDate);
  const totalNames = matchesByKind.flatMap((item) => item.matches.map((match) => match.label)).join(" · ");
  return `<section class="panel compact"><div class="panel-head"><h4>Fecha operativa</h4><p>Todo resultado guardado aqui se replica a las campanas activas de esta fecha.</p></div><div class="form-grid"><div class="field"><label>Fecha operativa</label><input id="resultOperationDateInput" type="date" value="${operationDate}" /></div></div><div class="result-metrics"><article><span>Diarias</span><strong>${matchesByKind[0]?.matches.length || 0}</strong></article><article><span>Semanales</span><strong>${matchesByKind[1]?.matches.length || 0}</strong></article><article><span>Mensuales</span><strong>${matchesByKind[2]?.matches.length || 0}</strong></article><article><span>Destino total</span><strong>${targetEventIds.length}</strong></article></div><p class="hint">${totalNames || "No hay campanas activas para esta fecha."}</p></section>`;
}

function renderResultCopyPanel(operationDate, sourceEvent) {
  const validEventIds = new Set(
    ["daily", "weekly", "monthly"].flatMap((kind) => getCampaigns(kind).flatMap((campaign) => {
      if (kind === "daily") return [campaign.eventId || `campaign-${campaign.id}`];
      return safeArray(campaign.eventIds);
    })).filter(Boolean),
  );
  const sourceOptions = [
    ...safeArray(state.data?.semanal?.events),
    ...safeArray(state.data?.mensual?.events),
  ]
    .filter((item) => validEventIds.has(item.id))
    .filter((item) => item.id !== sourceEvent?.id)
    .filter((item) => safeArray(item.results).length > 0)
    .map((item) => {
      const inferredKind = String(item.id || "").startsWith("monthly-")
        ? "monthly"
        : String(item.id || "").startsWith("campaign-daily-")
          ? "daily"
          : "weekly";
      const kindKey = item.campaignType || inferredKind;
      const kind = kindKey === "monthly" ? "Mensual" : kindKey === "daily" ? "Diaria" : "Semanal";
      const label = item.campaignName || item.name || item.sheetName || item.id;
      const date = item.date || item.sheetName || "";
      const resultsCount = safeArray(item.results).length;
      return `<option value="${item.id}"${item.id === state.adminResultCopySourceId ? " selected" : ""}>[${kind}] ${label}${date ? ` · ${date}` : ""} · ${resultsCount} resultados</option>`;
    })
    .join("");
  return `<section class="panel compact"><div class="panel-head"><h4>Copiar resultados</h4><p>Elige una jornada origen y el sistema la copiara a todas las campanas activas de esa fecha.</p></div><div class="form-grid"><div class="field"><label>Jornada origen</label><select data-copy-results-source><option value="">Selecciona una jornada con resultados</option>${sourceOptions}</select></div></div><div class="actions"><span class="hint">Solo aparecen jornadas que siguen perteneciendo a campanas existentes. La copia se aplica a todos los destinos activos de la fecha operativa.</span><button type="button" class="ghost-button" data-copy-results>Copiar resultados</button></div></section>`;
}

function getMonthlyRaceCountDrafts(campaignId, draft = {}) {
  const calendarEntries = buildMonthlyCalendarEntries(campaignId, draft);
  if (calendarEntries.length) {
    return calendarEntries.map((entry) => ({
      key: entry.key,
      label: entry.label,
      value: Number(draft.raceCountsByEvent?.[entry.key]) || Number(draft.raceCount) || 12,
    }));
  }
  const selectedEventIds = safeArray(draft.eventIds || state.data.settings.monthly.selectedEventIds);
  if (selectedEventIds.length) {
    return state.data.mensual.events
      .filter((event) => selectedEventIds.includes(event.id))
      .map((event) => ({
        key: event.id,
        label: event.sheetName,
        value: Number(draft.raceCountsByEvent?.[event.id]) || Number(draft.raceCount) || event.races || 12,
      }));
  }
  const existingIds = safeArray(draft.eventIds);
  if (existingIds.length) {
    return existingIds.map((id, index) => ({
      key: id,
      label: safeArray(draft.eventNames)[index] || `Jornada ${index + 1}`,
      value: Number(draft.raceCountsByEvent?.[id]) || Number(draft.raceCount) || 12,
    }));
  }
  return [{
    key: `${campaignId}-general`,
    label: "Jornada general",
    value: Number(draft.raceCount) || 12,
  }];
}

function renderRaceCountBlocks(title, entries, inputPrefix) {
  return `<div class="stack"><p class="label">${title}</p><div class="grid-2">${entries
    .map((entry) => `<div class="field"><label>${entry.label}</label><input name="${inputPrefix}${entry.key}" type="number" min="1" max="40" value="${entry.value}" /></div>`)
    .join("")}</div><p class="hint">Cada jornada puede tener su propia cantidad de carreras.</p></div>`;
}

function readWeeklyDraftFromForm(formElement, existing = {}) {
  const form = new FormData(formElement);
  const draft = {
    ...existing,
    id: existing?.id,
    enabled: existing?.enabled,
    name: String(form.get("name") || "").trim(),
    format: String(form.get("format") || ""),
    activeDays: form.getAll("activeDays"),
    finalDays: form.getAll("finalDays"),
    startDate: String(form.get("startDate") || ""),
    endDate: String(form.get("endDate") || ""),
    groupSize: Number(form.get("groupSize")) || 2,
    qualifiersPerGroup: Number(form.get("qualifiersPerGroup")) || 1,
    pairMode: form.get("pairMode") === "on",
    showTotalsByDefault: form.get("showTotalsByDefault") === "on",
    eventIds: form.getAll("eventIds"),
    scoring: readScoringFromForm(form),
  };
  const raceCountsByEvent = {};
  if (draft.eventIds.length) {
    draft.eventIds.forEach((id) => {
      raceCountsByEvent[id] = Number(form.get(`raceCountEvent::${id}`)) || Number(existing?.raceCountsByEvent?.[id]) || 12;
    });
  } else {
    getWeeklySelectedDays(draft).forEach((day) => {
      const key = `${draft.id || "weekly-preview"}-${normalizeIdPart(day)}`;
      raceCountsByEvent[key] = Number(form.get(`raceCountEvent::${day}`)) || Number(existing?.raceCountsByEvent?.[key]) || 12;
    });
  }
  draft.raceCountsByEvent = raceCountsByEvent;
  return draft;
}

function readMonthlyDraftFromForm(formElement, existing = {}) {
  const form = new FormData(formElement);
  const draft = {
    ...existing,
    id: existing?.id,
    enabled: existing?.enabled,
    name: String(form.get("name") || "").trim(),
    groupId: String(form.get("groupId") || "").trim(),
    entryValue: Number(form.get("entryValue")) || 0,
    hipodromos: form.getAll("hipodromos"),
    startDate: String(form.get("startDate") || ""),
    endDate: String(form.get("endDate") || ""),
    scoring: readScoringFromForm(form),
    promoEnabled: form.get("promoEnabled") === "on",
    promoPrice: Number(form.get("promoPrice")) || 0,
    promoQuantity: 2,
    competitionMode: String(form.get("competitionMode") || "individual"),
    qualifiersCount: Number(form.get("qualifiersCount")) || 0,
    qualifiersPerGroup: Number(form.get("qualifiersPerGroup")) || 0,
    eliminatePerDay: Number(form.get("eliminatePerDay")) || 0,
    showTotalsByDefault: form.get("showTotalsByDefault") === "on",
  };
  const calendarEntries = buildMonthlyCalendarEntries(draft.id || "monthly-preview", draft);
  if (calendarEntries.length) {
    draft.eventIds = calendarEntries.map((entry) => entry.key);
    draft.eventNames = calendarEntries.map((entry) => entry.label);
    draft.eventDates = calendarEntries.map((entry) => entry.date);
  } else {
    draft.eventIds = safeArray(existing?.eventIds);
    draft.eventNames = safeArray(existing?.eventNames);
    draft.eventDates = safeArray(existing?.eventDates);
  }
  const raceCountsByEvent = {};
  if (draft.eventIds.length) {
    draft.eventIds.forEach((id) => {
      raceCountsByEvent[id] = Number(form.get(`raceCountEvent::${id}`)) || Number(existing?.raceCountsByEvent?.[id]) || Number(existing?.raceCount) || 12;
    });
  } else {
    raceCountsByEvent[`${draft.id || "monthly-preview"}-general`] = Number(form.get("raceCount")) || Number(existing?.raceCount) || 12;
  }
  draft.raceCount = Object.values(raceCountsByEvent)[0] || Number(existing?.raceCount) || 12;
  draft.raceCountsByEvent = raceCountsByEvent;
  return draft;
}

renderAdminContent = function renderAdminContentPatched() {
  if (state.adminTab === "results") {
    if (!state.adminUnlocked) {
      return originalRenderAdminContent();
    }
    adminView.innerHTML = `${renderHero("Administrador", "Aqui decides como se juega la diaria, la semanal y la mensual. Puedes definir formato semanal, dias activos, finales, hipodromos, fechas y el padron maestro de participantes.", [
      { label: "Padron", value: state.data.registry.length },
      { label: "Semanal", value: state.data.settings.weekly.format },
      { label: "Hipodromos", value: safeArray(state.data.settings.monthly.hipodromos).length },
      { label: "Usuario", value: state.currentAdminUser?.displayName || state.currentAdminUser?.username || "Activo" },
    ])}<section class="panel"><div class="toolbar"><div class="toolbar-group" id="adminTabs"></div><button id="adminLogout" class="ghost-button">Cerrar administrador</button></div></section><section id="adminBody"></section>`;
    [["registry", "Padron"], ["campaigns", "Campanas"], ["prizes", "Premios"], ["forecasts", "Pronostico"], ["results", "Resultados"], ["programs", "Programa de carreras"], ["calendar", "Calendario"], ["automation", "Automatizacion"], ["users", "Usuarios"]].forEach(([id, label]) => {
      const button = document.createElement("button");
      button.className = `subnav-button${state.adminTab === id ? " active" : ""}`;
      button.textContent = label;
      button.addEventListener("click", () => {
        state.adminTab = id;
        render();
      });
      adminView.querySelector("#adminTabs").appendChild(button);
    });
    adminView.querySelector("#adminLogout").addEventListener("click", () => {
      state.adminUnlocked = false;
      state.currentAdminUser = null;
      clearPersistedAdminSession();
      render();
    });
    const body = adminView.querySelector("#adminBody");
    const operationDate = state.resultOperationDate || toLocalDateInputValue();
    const source = getResultSourceForDate(operationDate);
    const event = source ? getOperationEventForDate(source, operationDate) : null;
    state.adminOpsEventId = event?.id || null;
    body.innerHTML = `<section class="panel"><div class="panel-head"><h3>Resultados</h3><p>Carga por fecha operativa. Todas las campanas activas de esa fecha comparten el mismo resultado.</p></div>${renderResultDateSummary(operationDate)}</section><section class="panel"><div class="panel-head"><h3>Carga de resultados</h3><p>Importa desde Teletrak o guarda manualmente con la fecha operativa.</p></div><div id="adminOpsForms" class="stack"></div></section>`;
    const holder = body.querySelector("#adminOpsForms");
    if (!event) {
      holder.innerHTML = `<section class="panel"><div class="panel-head"><h3>Sin campanas para operar</h3><p>No hay jornada disponible para la fecha seleccionada.</p></div></section>`;
      return;
    }
    holder.innerHTML = `${renderResultsForm(event)}`;
    bindEventForms(holder, event);
    return;
  }

  if (state.adminTab !== "campaigns") {
    return originalRenderAdminContent();
  }

  if (!state.adminUnlocked) {
    return originalRenderAdminContent();
  }

  adminView.innerHTML = `${renderHero("Administrador", "Aqui decides como se juega la diaria, la semanal y la mensual. Puedes definir formato semanal, dias activos, finales, hipodromos, fechas y el padron maestro de participantes.", [
    { label: "Padron", value: state.data.registry.length },
    { label: "Semanal", value: state.data.settings.weekly.format },
    { label: "Hipodromos", value: safeArray(state.data.settings.monthly.hipodromos).length },
    { label: "Usuario", value: state.currentAdminUser?.displayName || state.currentAdminUser?.username || "Activo" },
  ])}<section class="panel"><div class="toolbar"><div class="toolbar-group" id="adminTabs"></div><button id="adminLogout" class="ghost-button">Cerrar administrador</button></div></section><section id="adminBody"></section>`;

  [["registry", "Padron"], ["campaigns", "Campanas"], ["prizes", "Premios"], ["forecasts", "Pronostico"], ["results", "Resultados"], ["programs", "Programa de carreras"], ["calendar", "Calendario"], ["automation", "Automatizacion"], ["users", "Usuarios"]].forEach(([id, label]) => {
    const button = document.createElement("button");
    button.className = `subnav-button${state.adminTab === id ? " active" : ""}`;
    button.textContent = label;
    button.addEventListener("click", () => {
      state.adminTab = id;
      render();
    });
    adminView.querySelector("#adminTabs").appendChild(button);
  });
  adminView.querySelector("#adminLogout").addEventListener("click", () => {
    state.adminUnlocked = false;
    state.currentAdminUser = null;
    clearPersistedAdminSession();
    render();
  });

  const body = adminView.querySelector("#adminBody");
  const days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
  const dailyDraft = state.campaignEditors.daily || {};
  const weeklyDraft = state.campaignEditors.weekly || {};
  const monthlyDraft = state.campaignEditors.monthly || {};
  const campaignReferenceDate = state.campaignFilterDate || toLocalDateInputValue();
  const weeklyDraftId = weeklyDraft.id || "weekly-preview";
  const monthlyDraftId = monthlyDraft.id || "monthly-preview";
  const weeklyRaceCountEntries = getWeeklyRaceCountDrafts(weeklyDraftId, weeklyDraft);
  const monthlyRaceCountEntries = getMonthlyRaceCountDrafts(monthlyDraftId, monthlyDraft);
  const registryGroupOptions = `<option value="">Todos los participantes</option>${getRegistryGroupOptions().map((group) => `<option value="${group.id}">${group.name}</option>`).join("")}`;
  const campaignListToolbar = `<div class="toolbar"><div class="field" style="min-width:220px"><label>Fecha a revisar</label><input id="campaignFilterDate" type="date" value="${campaignReferenceDate}" /></div><span class="hint">Se muestran las campanas vigentes para esa fecha, aunque hoy ya esten vencidas.</span></div>`;

  const campaignsTabNav = `<section class="panel"><div class="toolbar"><div><p class="label">Tipo de campana</p><div class="toolbar-group" id="campaignTabs"></div></div></div></section>`;
  const dailySection = `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>${dailyDraft.id ? "Editar campana diaria" : "Campana diaria"}</h3><p>Una jornada puntual.</p></div><form id="dailyCampaignForm" class="editor-form"><div class="field"><label>Nombre</label><input name="name" type="text" placeholder="Ej. Diaria martes 08" value="${dailyDraft.name || ""}" /></div><div class="field"><label>Fecha</label><input name="date" type="date" value="${dailyDraft.date || ""}" /></div><div class="form-grid"><div class="field"><label>Grupo asociado</label><select name="groupId">${registryGroupOptions}</select></div><div class="field"><label>Valor de campana</label><input name="entryValue" type="number" min="0" step="100" value="${Number(dailyDraft.entryValue) || 0}" /></div></div><div class="field"><label>Carreras del dia</label><input name="raceCount" type="number" min="1" max="30" value="${dailyDraft.raceCount || 12}" /></div>${renderDailyCampaignFields(dailyDraft)}${renderScoringFieldsEditable("", dailyDraft.scoring)}<div class="actions"><span class="hint">${dailyDraft.id ? "Aqui puedes corregir grupo, valor, promo y puntuacion de la campana." : "Con nombre, fecha, carreras, promo 2x y tipo de puntuacion basta para dejar lista la diaria."}</span>${dailyDraft.id ? '<button type="button" class="ghost-button" id="cancelDailyEdit">Cancelar edicion</button>' : ""}<button class="primary-button" type="submit">${dailyDraft.id ? "Guardar cambios" : "Guardar diaria"}</button></div></form></section><section class="panel"><div class="panel-head"><h3>Campanas diarias por fecha</h3><p>Revisa que campanas estaban vigentes en la fecha elegida.</p></div>${campaignListToolbar}${renderCampaignAdminList("daily", getCampaignsForReferenceDate("daily", campaignReferenceDate))}</section></section>`;
  const weeklySection = `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>${weeklyDraft.id ? "Editar campana semanal" : "Configuracion semanal + campana"}</h3><p>La informacion aparece segun la modalidad que elijas.</p></div><form id="weeklyCampaignForm" class="editor-form"><div class="field"><label>Nombre</label><input name="name" type="text" placeholder="Ej. Semanal 06 al 11" value="${weeklyDraft.name || ""}" /></div><div class="form-grid"><div class="field"><label>Grupo asociado</label><select name="groupId">${registryGroupOptions}</select></div><div class="field"><label>Valor de campana</label><input name="entryValue" type="number" min="0" step="100" value="${Number(weeklyDraft.entryValue) || 0}" /></div></div><div class="field"><label>Formato</label><select name="format">${getCompetitionModeOptions().map(([value, label]) => `<option value="${value}"${(weeklyDraft.format || state.data.settings.weekly.format) === value ? " selected" : ""}>${label}</option>`).join("")}</select><p class="hint" data-weekly-mode-description>${getCompetitionModeDescription(weeklyDraft.format || state.data.settings.weekly.format || "individual")}</p></div><div><p class="label">Dias que se juegan</p><div class="check-grid days">${days.map((day) => `<label class="check-chip"><input type="checkbox" name="activeDays" value="${day}"${safeArray(weeklyDraft.activeDays || state.data.settings.weekly.activeDays).includes(day) ? " checked" : ""} /> ${day}</label>`).join("")}</div></div><div class="form-grid"><div class="field"><label>Inicio</label><input name="startDate" type="date" value="${weeklyDraft.startDate || ""}" /></div><div class="field"><label>Termino</label><input name="endDate" type="date" value="${weeklyDraft.endDate || ""}" /></div></div>${renderRaceCountBlocks("Carreras por dia", weeklyRaceCountEntries, "raceCountEvent::")}${renderCampaignPromoFields(weeklyDraft)}${renderScoringFieldsEditable("", weeklyDraft.scoring)}<div class="check-grid"><label class="check-chip"><input type="checkbox" name="showTotalsByDefault"${(weeklyDraft.showTotalsByDefault ?? state.data.settings.weekly.showTotalsByDefault) ? " checked" : ""} /> Abrir vista en total</label></div><div class="actions"><span class="hint">${weeklyDraft.id ? "Aqui puedes corregir grupo, valor, rango, promo y modalidad competitiva." : "Parte por nombre, dias, carreras y promo 2x. El resto se despliega solo cuando la modalidad lo necesita."}</span>${weeklyDraft.id ? '<button type="button" class="ghost-button" id="cancelWeeklyEdit">Cancelar edicion</button>' : ""}<button class="primary-button" type="submit">${weeklyDraft.id ? "Guardar cambios" : "Guardar semanal"}</button></div></form></section><section class="panel"><div class="panel-head"><h3>Campanas semanales por fecha</h3><p>Revisa que campanas estaban vigentes en la fecha elegida.</p></div>${campaignListToolbar}${renderCampaignAdminList("weekly", getCampaignsForReferenceDate("weekly", campaignReferenceDate))}</section></section>`;
  const monthlyCalendarPreview = buildMonthlyCalendarEntries(monthlyDraftId, {
    ...monthlyDraft,
    hipodromos: safeArray(monthlyDraft.hipodromos || state.data.settings.monthly.hipodromos),
    startDate: monthlyDraft.startDate || state.data.settings.monthly.startDate || "",
    endDate: monthlyDraft.endDate || state.data.settings.monthly.endDate || "",
  });
  const monthlySection = `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>${monthlyDraft.id ? "Editar campana mensual" : "Configuracion mensual + campana"}</h3><p>Hipodromos, fechas y jornadas.</p></div><form id="monthlyCampaignForm" class="editor-form"><div class="field"><label>Nombre</label><input name="name" type="text" placeholder="Ej. Mensual Club Hipico abril" value="${monthlyDraft.name || ""}" /></div><div class="form-grid"><div class="field"><label>Grupo asociado</label><select name="groupId">${registryGroupOptions}</select></div><div class="field"><label>Valor de campana</label><input name="entryValue" type="number" min="0" step="100" value="${Number(monthlyDraft.entryValue) || 0}" /></div></div><div><p class="label">Hipodromos</p><div class="check-grid">${["Club Hipico", "Hipodromo Chile", "Sporting", "Concepcion"].map((item) => `<label class="check-chip"><input type="checkbox" name="hipodromos" value="${item}"${safeArray(monthlyDraft.hipodromos || state.data.settings.monthly.hipodromos).includes(item) ? " checked" : ""} /> ${item}</label>`).join("")}</div></div><div class="form-grid"><div class="field"><label>Inicio</label><input name="startDate" type="date" value="${monthlyDraft.startDate || state.data.settings.monthly.startDate || ""}" /></div><div class="field"><label>Termino</label><input name="endDate" type="date" value="${monthlyDraft.endDate || state.data.settings.monthly.endDate || ""}" /></div></div><div class="panel compact"><div class="panel-head"><h4>Jornadas detectadas automaticamente</h4><p>Se arman segun rango de fechas e hipodromos marcados.</p></div>${monthlyCalendarPreview.length ? `<div class="result-metrics"><article><span>Jornadas</span><strong>${monthlyCalendarPreview.length}</strong></article><article><span>Primera</span><strong>${monthlyCalendarPreview[0]?.date || "-"}</strong></article><article><span>Ultima</span><strong>${monthlyCalendarPreview[monthlyCalendarPreview.length - 1]?.date || "-"}</strong></article></div><p class="hint">${monthlyCalendarPreview.map((entry) => entry.label).join(" · ")}</p>` : '<p class="hint">Marca al menos un hipodromo y define inicio/termino para poblar las jornadas automaticas.</p>'}</div>${renderRaceCountBlocks("Carreras por jornada", monthlyRaceCountEntries, "raceCountEvent::")}${renderCampaignPromoFields(monthlyDraft)}${renderCompetitionModeFields("", monthlyDraft)}${renderScoringFieldsEditable("", monthlyDraft.scoring)}<div class="check-grid"><label class="check-chip"><input type="checkbox" name="showTotalsByDefault"${(monthlyDraft.showTotalsByDefault ?? state.data.settings.monthly.showTotalsByDefault) ? " checked" : ""} /> Abrir vista en total</label></div><div class="actions"><span class="hint">${monthlyDraft.id ? "Aqui puedes corregir grupo, valor, fechas, promo, carreras y modalidad." : "Las fechas mensuales ahora salen automaticas segun el calendario del hipodromo y el rango elegido."}</span>${monthlyDraft.id ? '<button type="button" class="ghost-button" id="cancelMonthlyEdit">Cancelar edicion</button>' : ""}<button class="primary-button" type="submit">${monthlyDraft.id ? "Guardar cambios" : "Guardar mensual"}</button></div></form></section><section class="panel"><div class="panel-head"><h3>Campanas mensuales por fecha</h3><p>Revisa que campanas estaban vigentes en la fecha elegida.</p></div>${campaignListToolbar}${renderCampaignAdminList("monthly", getCampaignsForReferenceDate("monthly", campaignReferenceDate))}</section></section>`;
  body.innerHTML = campaignsTabNav + (state.campaignsTab === "daily" ? dailySection : state.campaignsTab === "weekly" ? weeklySection : monthlySection);

  const weeklyFormInjected = body.querySelector("#weeklyCampaignForm");
  const weeklyActions = weeklyFormInjected?.querySelector(".actions");
  if (weeklyFormInjected && weeklyActions && !weeklyFormInjected.querySelector('[name="finalists"]')) {
    weeklyActions.insertAdjacentHTML("beforebegin", renderWeeklyCompetitionFields(weeklyDraft));
  }
  const dailyGroupSelect = body.querySelector('#dailyCampaignForm select[name="groupId"]');
  const weeklyGroupSelect = body.querySelector('#weeklyCampaignForm select[name="groupId"]');
  const monthlyGroupSelect = body.querySelector('#monthlyCampaignForm select[name="groupId"]');
  if (dailyGroupSelect) dailyGroupSelect.value = dailyDraft.groupId || "";
  if (weeklyGroupSelect) weeklyGroupSelect.value = weeklyDraft.groupId || "";
  if (monthlyGroupSelect) monthlyGroupSelect.value = monthlyDraft.groupId || "";
  const campaignFilterDateInput = body.querySelector("#campaignFilterDate");
  if (campaignFilterDateInput) {
    campaignFilterDateInput.addEventListener("change", (event) => {
      state.campaignFilterDate = event.currentTarget.value || "";
      render();
    });
  }

  const campaignTabs = body.querySelector("#campaignTabs");
  [["daily", "Diaria"], ["weekly", "Semanal"], ["monthly", "Mensual"]].forEach(([id, label]) => {
    const button = document.createElement("button");
    button.className = `subnav-button${state.campaignsTab === id ? " active" : ""}`;
    button.textContent = label;
    button.addEventListener("click", () => {
      state.campaignsTab = id;
      render();
    });
    campaignTabs.appendChild(button);
  });
  bindScoringFieldVisibility(body.querySelector("#dailyCampaignForm"));
  bindScoringFieldVisibility(body.querySelector("#weeklyCampaignForm"));
  bindScoringFieldVisibility(body.querySelector("#monthlyCampaignForm"));
  bindCampaignPromoVisibility(body.querySelector("#dailyCampaignForm"));
  bindCampaignPromoVisibility(body.querySelector("#weeklyCampaignForm"));
  bindCampaignPromoVisibility(body.querySelector("#monthlyCampaignForm"));
  bindWeeklyCompetitionVisibility(body.querySelector("#weeklyCampaignForm"));

  body.querySelectorAll("[data-edit-campaign]").forEach((button) => {
    button.addEventListener("click", () => {
      const kind = button.dataset.editCampaign;
      const id = button.dataset.campaignId;
      state.campaignEditors[kind] = getCampaigns(kind).find((item) => item.id === id) || null;
      state.campaignsTab = kind;
      render();
    });
  });

  body.querySelectorAll("[data-toggle-campaign-detail]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextState = state.campaignDetail?.kind === button.dataset.toggleCampaignDetail && state.campaignDetail?.id === button.dataset.campaignId
        ? null
        : { kind: button.dataset.toggleCampaignDetail, id: button.dataset.campaignId };
      state.campaignDetail = nextState;
      render();
    });
  });

  body.querySelectorAll("[data-campaign-entry-form]").forEach((formElement) => {
    formElement.addEventListener("submit", (submitEvent) => {
      const form = new FormData(submitEvent.currentTarget);
      const kind = submitEvent.currentTarget.dataset.campaignEntryForm;
      const campaignId = submitEvent.currentTarget.dataset.campaignId;
      const currentCampaign = getCampaigns(kind).find((item) => item.id === campaignId);
      if (!currentCampaign) {
        submitEvent.preventDefault();
        return showToast("No se encontro la campana para guardar el cobro.");
      }
      const entryModes = {};
      Array.from(form.entries()).forEach(([key, value]) => {
        if (!key.startsWith("entryMode::")) return;
        const participantName = key.slice("entryMode::".length);
        entryModes[participantName] = String(value || "individual");
      });
      saveSettings(submitEvent, {
        campaigns: {
          [kind]: upsertCampaign(kind, {
            ...currentCampaign,
            entryModes,
          }),
        },
      }, "Cobro por participante guardado.");
    });
  });

  body.querySelector("#cancelDailyEdit")?.addEventListener("click", () => {
    state.campaignEditors.daily = null;
    render();
  });
  body.querySelector("#cancelWeeklyEdit")?.addEventListener("click", () => {
    state.campaignEditors.weekly = null;
    render();
  });
  body.querySelector("#cancelMonthlyEdit")?.addEventListener("click", () => {
    state.campaignEditors.monthly = null;
    render();
  });

  body.querySelector("#dailyCampaignForm")?.addEventListener("submit", (event) => {
    const form = new FormData(event.currentTarget);
    const existing = state.campaignEditors.daily;
    const campaignId = existing?.id || `daily-${Date.now()}`;
    saveSettings(event, {
      campaigns: {
        daily: upsertCampaign("daily", {
          id: campaignId,
          name: String(form.get("name") || "").trim(),
          date: form.get("date"),
          groupId: String(form.get("groupId") || "").trim(),
          entryValue: Number(form.get("entryValue")) || 0,
          competitionMode: String(form.get("competitionMode") || "individual"),
          promoEnabled: form.get("promoEnabled") === "on",
          promoPrice: Number(form.get("promoPrice")) || 0,
          promoQuantity: 2,
          raceCount: Number(form.get("raceCount")) || 12,
          enabled: existing?.enabled !== false,
          scoring: readScoringFromForm(form),
          eventId: existing?.eventId || `campaign-${campaignId}`,
          eventName: String(form.get("date") || "").trim() || String(form.get("name") || "").trim(),
        }),
      },
    }, existing ? "Campana diaria actualizada." : "Campana diaria guardada.");
    state.campaignEditors.daily = null;
  });

  body.querySelector("#weeklyCampaignForm")?.addEventListener("submit", (event) => {
    const form = new FormData(event.currentTarget);
    const existing = state.campaignEditors.weekly;
    const campaignId = existing?.id || `weekly-${Date.now()}`;
    const activeDays = form.getAll("activeDays").length ? form.getAll("activeDays") : ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
    const finalDays = form.get("hasFinalStage") === "on"
      ? (form.getAll("finalDays").length ? form.getAll("finalDays") : ["Sabado", "Domingo"])
      : [];
    const selectedDays = Array.from(new Set([...activeDays, ...finalDays]));
    const eventIds = selectedDays.map((day) => `${campaignId}-${normalizeIdPart(day)}`);
    const eventNames = selectedDays;
    const raceCountsByEvent = Object.fromEntries(
      eventIds.map((id, index) => {
        const sourceKey = selectedDays[index];
        return [id, Number(form.get(`raceCountEvent::${sourceKey}`)) || Number(existing?.raceCountsByEvent?.[id]) || 12];
      }),
    );
    saveSettings(event, {
      weekly: {
        format: form.get("format"),
        activeDays,
        finalDays,
        hasFinalStage: form.get("hasFinalStage") === "on",
        promoEnabled: form.get("promoEnabled") === "on",
        promoPrice: Number(form.get("promoPrice")) || 0,
        groupSize: Number(form.get("groupSize")),
        qualifiersPerGroup: Number(form.get("qualifiersPerGroup")),
        pairMode: String(form.get("format") || "") === "pairs",
        showTotalsByDefault: form.get("showTotalsByDefault") === "on",
      },
      campaigns: {
        weekly: upsertCampaign("weekly", {
          id: campaignId,
          name: String(form.get("name") || "").trim(),
          groupId: String(form.get("groupId") || "").trim(),
          entryValue: Number(form.get("entryValue")) || 0,
          startDate: form.get("startDate"),
          endDate: form.get("endDate"),
          raceCount: Object.values(raceCountsByEvent)[0] || 12,
          raceCountsByEvent,
          enabled: existing?.enabled !== false,
          scoring: readScoringFromForm(form),
          format: form.get("format"),
          competitionMode: String(form.get("competitionMode") || form.get("format") || "round-robin"),
          activeDays,
          finalDays,
          hasFinalStage: form.get("hasFinalStage") === "on",
          promoEnabled: form.get("promoEnabled") === "on",
          promoPrice: Number(form.get("promoPrice")) || 0,
          promoQuantity: 2,
          groupSize: Number(form.get("groupSize")),
          qualifiersCount: Number(form.get("qualifiersCount")) || 0,
          qualifiersPerGroup: Number(form.get("qualifiersPerGroup")),
          pairMode: String(form.get("format") || "") === "pairs",
          showTotalsByDefault: form.get("showTotalsByDefault") === "on",
          finalists: parseNameLines(form.get("finalists")),
          groups: parseGroupDefinitions(form.get("groups")),
          pairs: parsePairDefinitions(form.get("pairs")),
          eliminatePerDay: Number(form.get("eliminatePerDay")) || 0,
          eventIds,
          eventNames,
        }),
      },
    }, existing ? "Campana semanal actualizada." : "Campana semanal guardada.");
    state.campaignEditors.weekly = null;
  });

  body.querySelector("#weeklyCampaignForm")?.addEventListener("change", (changeEvent) => {
    const target = changeEvent.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    if (!["activeDays", "finalDays", "eventIds"].includes(target.name)) return;
    state.campaignEditors.weekly = readWeeklyDraftFromForm(changeEvent.currentTarget, state.campaignEditors.weekly || {});
    render();
  });

  body.querySelector("#monthlyCampaignForm")?.addEventListener("change", (changeEvent) => {
    const target = changeEvent.target;
    if (!(target instanceof HTMLInputElement) && !(target instanceof HTMLSelectElement)) return;
    if (!["hipodromos", "startDate", "endDate"].includes(target.name)) return;
    state.campaignEditors.monthly = readMonthlyDraftFromForm(changeEvent.currentTarget, state.campaignEditors.monthly || {});
    render();
  });

  body.querySelector("#monthlyCampaignForm")?.addEventListener("submit", (event) => {
    const existing = state.campaignEditors.monthly;
    const campaignId = existing?.id || `monthly-${Date.now()}`;
    const draft = readMonthlyDraftFromForm(event.currentTarget, { ...(existing || {}), id: campaignId });
    if (!safeArray(draft.hipodromos).length) {
      event.preventDefault();
      return showToast("Marca al menos un hipodromo para la mensual.");
    }
    if (!draft.startDate || !draft.endDate) {
      event.preventDefault();
      return showToast("Define fecha de inicio y termino para poblar la mensual.");
    }
    if (!safeArray(draft.eventIds).length) {
      event.preventDefault();
      return showToast("No hay jornadas del calendario dentro del rango elegido.");
    }
    saveSettings(event, {
      monthly: {
        hipodromos: draft.hipodromos,
        startDate: draft.startDate,
        endDate: draft.endDate,
        selectedEventIds: draft.eventIds,
        promoEnabled: draft.promoEnabled,
        promoPrice: draft.promoPrice,
        showTotalsByDefault: draft.showTotalsByDefault,
      },
      campaigns: {
        monthly: upsertCampaign("monthly", {
          id: campaignId,
          name: draft.name,
          groupId: draft.groupId,
          entryValue: draft.entryValue,
          hipodromos: draft.hipodromos,
          startDate: draft.startDate,
          endDate: draft.endDate,
          raceCount: draft.raceCount,
          raceCountsByEvent: draft.raceCountsByEvent,
          enabled: existing?.enabled !== false,
          scoring: draft.scoring,
          promoEnabled: draft.promoEnabled,
          promoPrice: draft.promoPrice,
          promoQuantity: draft.promoQuantity,
          competitionMode: draft.competitionMode,
          qualifiersCount: draft.qualifiersCount,
          qualifiersPerGroup: draft.qualifiersPerGroup,
          eliminatePerDay: draft.eliminatePerDay,
          showTotalsByDefault: draft.showTotalsByDefault,
          eventIds: draft.eventIds,
          eventNames: draft.eventNames,
          eventDates: draft.eventDates,
        }),
      },
    }, existing ? "Campana mensual actualizada." : "Campana mensual guardada.");
    state.campaignEditors.monthly = null;
  });

  body.querySelectorAll("[data-campaign-action]").forEach((button) => {
    button.addEventListener("click", () => applyCampaignAction(button.dataset.campaignKind, button.dataset.campaignId, button.dataset.campaignAction));
  });
};

renderForecastForm = function renderForecastFormPatched(event) {
  const roster = state.data.registry.filter((item) => item.diaria || item.semanal || item.mensual).map((item) => item.name);
  const names = roster.length ? roster : event.participants.map((item) => item.name);
  const defaultParticipant = event.participants[0];
  const nextIndex = Math.max(0, ...event.participants.map((item) => Number(item.index) || 0)) + 1;
  return `${renderOperationTargets(event)}<form class="editor-form" data-form="participant"><div class="panel-head"><h4>PronÃ³stico</h4><p>Ingreso por jornada.</p></div><div class="form-grid"><div class="field"><label>NÃºmero</label><input name="index" type="number" min="1" value="${defaultParticipant?.index || nextIndex}" /></div><div class="field"><label>Stud</label><select name="name">${names.map((name) => `<option value="${name}"${name === defaultParticipant?.name ? " selected" : ""}>${name}</option>`).join("")}</select></div></div><div class="field"><label>Pegar en lote</label><textarea name="bulkPicks" rows="6" placeholder="Ej. 1 5 1 6 7 8 9&#10;o&#10;1. 5-12&#10;2. 12-1&#10;3. 11-5"></textarea><p class="hint">Lista simple: reparte en C1, C2, C3. Formato doble: 1. 5-12. El nÃºmero 1 toma el valor izquierdo y el nÃºmero 2 toma el valor derecho.</p><div class="toolbar-group"><button type="button" class="ghost-button" data-apply-bulk-picks>Aplicar pegado</button><button type="button" class="ghost-button" data-clear-bulk-picks>Limpiar picks</button></div></div><div class="form-grid">${Array.from({ length: Math.min(event.races, 30) }, (_, index) => `<div class="field"><label>C${index + 1}</label><input name="pick-${index + 1}" type="text" value="${defaultParticipant?.picks[index]?.horse || ""}" /></div>`).join("")}</div><div class="actions"><span class="hint">Cada celda muestra el caballo elegido. En la vista pÃºblica verÃ¡s tambiÃ©n cuÃ¡nto sumÃ³ por carrera.</span><button class="primary-button" type="submit">Guardar pronÃ³stico</button></div></form>`;
};

bindEventForms = function bindEventFormsPatched(container, event) {
  originalBindEventForms(container, event);
  const participantForm = container.querySelector('[data-form="participant"]');
  const applyBulkButton = container.querySelector("[data-apply-bulk-picks]");
  const clearBulkButton = container.querySelector("[data-clear-bulk-picks]");
  const bulkInput = participantForm?.querySelector('[name="bulkPicks"]');
  const fillPickInputs = (values) => {
    Array.from({ length: Math.min(event.races, 30) }, (_, index) => {
      const input = participantForm?.querySelector(`[name="pick-${index + 1}"]`);
      if (input) input.value = values[index] || "";
    });
  };
  applyBulkButton?.addEventListener("click", () => {
    const participantIndex = Number(participantForm?.querySelector('[name="index"]')?.value || 1);
    const raceLimit = Math.min(event.races, 30);
    const values = parseSingleOrDualBulkPicks(bulkInput?.value || "", event.races, participantIndex);
    fillPickInputs(values);
    showToast(`Pegado aplicado en ${Math.min(values.filter(Boolean).length, raceLimit)} carreras.`);
  });
  clearBulkButton?.addEventListener("click", () => {
    fillPickInputs([]);
    if (bulkInput) bulkInput.value = "";
    showToast("PronÃ³sticos limpiados.");
  });
};

function normalizeBulkPasteText(rawText) {
  return String(rawText || "")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\t/g, " ")
    .trim();
}

function parseStructuredBulkLine(line) {
  const cleaned = String(line || "").trim();
  if (!cleaned) return null;
  const match = cleaned.match(/^\s*(\d+)\s*(?:[.)@:a]|[-/])\s*(.+?)\s*$/i);
  if (!match) return null;

  const race = Number(match[1]) || 0;
  const payload = String(match[2] || "").trim();
  if (!race || !payload) return null;

  const values = payload
    .split(/\s*-\s*/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    race,
    first: values[0] || "",
    second: values[1] || "",
  };
}

function parseBulkPickPayload(rawText, raceCount) {
  const raceLimit = Math.min(raceCount, 30);
  const normalized = normalizeBulkPasteText(rawText);
  const lines = normalized
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const first = Array.from({ length: raceLimit }, () => "");
  const second = Array.from({ length: raceLimit }, () => "");
  const structuredEntries = lines.map((line) => parseStructuredBulkLine(line)).filter(Boolean);

  if (structuredEntries.length) {
    structuredEntries.forEach((entry) => {
      const race = Math.max(1, Math.min(entry.race, raceLimit));
      first[race - 1] = entry.first || "";
      second[race - 1] = entry.second || "";
    });
    return { first, second };
  }

  normalized
    .split(/[\s,;|]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, raceLimit)
    .forEach((value, index) => {
      first[index] = value;
    });

  return { first, second };
}

function parseDualBulkPicks(rawText, raceCount) {
  const parsed = parseBulkPickPayload(rawText, raceCount);
  return { first: parsed.first, second: parsed.second };
}

const previousRenderForecastForm = renderForecastForm;
renderForecastForm = function renderForecastFormDualPaste(event) {
  const roster = state.data.registry.filter((item) => item.diaria || item.semanal || item.mensual).map((item) => item.name);
  const names = roster.length ? roster : event.participants.map((item) => item.name);
  const defaultParticipant = event.participants[0];
  const secondParticipant = event.participants[1];
  const nextIndex = Math.max(0, ...event.participants.map((item) => Number(item.index) || 0)) + 1;
  return `${renderOperationTargets(event)}<form class="editor-form" data-form="participant"><div class="panel-head"><h4>PronÃ³stico</h4><p>Ingreso por jornada.</p></div><div class="form-grid"><div class="field"><label>NÃºmero Stud 1</label><input name="index" type="number" min="1" value="${defaultParticipant?.index || nextIndex}" /></div><div class="field"><label>Stud 1</label><select name="name">${names.map((name) => `<option value="${name}"${name === defaultParticipant?.name ? " selected" : ""}>${name}</option>`).join("")}</select></div><div class="field"><label>NÃºmero Stud 2</label><input name="indexSecond" type="number" min="1" value="${secondParticipant?.index || (nextIndex + 1)}" /></div><div class="field"><label>Stud 2</label><select name="nameSecond"><option value="">No usar</option>${names.map((name) => `<option value="${name}"${name === secondParticipant?.name ? " selected" : ""}>${name}</option>`).join("")}</select></div></div><div class="field"><label>Pegar formato doble stud</label><textarea name="bulkDualPicks" rows="8" placeholder="1. 5-12&#10;2. 12-1&#10;3. 11-5"></textarea><p class="hint">Formato esperado: numero de carrera, punto y luego stud1-stud2. Ejemplo: 1. 5-12. El primer valor llena Stud 1 y el segundo llena Stud 2.</p><div class="toolbar-group"><button type="button" class="ghost-button" data-apply-dual-bulk>Aplicar pegado doble</button><button type="button" class="ghost-button" data-clear-dual-bulk>Limpiar ambos</button></div></div><div class="panel-head"><h4>Stud 1</h4><p>Picks del primer stud.</p></div><div class="form-grid">${Array.from({ length: Math.min(event.races, 30) }, (_, index) => `<div class="field"><label>C${index + 1}</label><input name="pick-${index + 1}" type="text" value="${defaultParticipant?.picks[index]?.horse || ""}" /></div>`).join("")}</div><div class="panel-head"><h4>Stud 2</h4><p>Picks del segundo stud, opcional.</p></div><div class="form-grid">${Array.from({ length: Math.min(event.races, 30) }, (_, index) => `<div class="field"><label>C${index + 1}</label><input name="pick2-${index + 1}" type="text" value="${secondParticipant?.picks[index]?.horse || ""}" /></div>`).join("")}</div><div class="actions"><span class="hint">Puedes guardar solo el Stud 1 con el botÃ³n normal, o guardar ambos studs juntos.</span><button class="primary-button" type="submit">Guardar Stud 1</button><button class="ghost-button" type="button" data-save-double-picks>Guardar ambos studs</button></div></form>`;
};

const previousBindEventForms = bindEventForms;
bindEventForms = function bindEventFormsDualPaste(container, event) {
  previousBindEventForms(container, event);

  const participantForm = container.querySelector('[data-form="participant"]');
  if (!participantForm) return;

  const fillPickInputs = (prefix, values) => {
    Array.from({ length: Math.min(event.races, 30) }, (_, index) => {
      const input = participantForm.querySelector(`[name="${prefix}${index + 1}"]`);
      if (input) input.value = values[index] || "";
    });
  };

  participantForm.querySelector("[data-apply-dual-bulk]")?.addEventListener("click", () => {
    const parsed = parseDualBulkPicks(participantForm.querySelector('[name="bulkDualPicks"]')?.value || "", event.races);
    fillPickInputs("pick-", parsed.first);
    fillPickInputs("pick2-", parsed.second);
    showToast("Pegado doble aplicado a Stud 1 y Stud 2.");
  });

  participantForm.querySelector("[data-clear-dual-bulk]")?.addEventListener("click", () => {
    fillPickInputs("pick-", []);
    fillPickInputs("pick2-", []);
    const area = participantForm.querySelector('[name="bulkDualPicks"]');
    if (area) area.value = "";
    showToast("Se limpiaron ambos studs.");
  });

  participantForm.querySelector("[data-save-double-picks]")?.addEventListener("click", async () => {
    const form = new FormData(participantForm);
    const secondName = String(form.get("nameSecond") || "").trim();
    if (!secondName) {
      return showToast("Primero selecciona el Stud 2 para guardar ambos.");
    }

    const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    const resolved = resolveCampaignTargetIds({
      operationDate,
      daily: safeArray(state.adminTargetSelections.daily),
      weekly: safeArray(state.adminTargetSelections.weekly),
      monthly: safeArray(state.adminTargetSelections.monthly),
    });
    const targetEventIds = resolved.ids.length ? resolved.ids : [event.id];

    const participants = [
      {
        index: Number(form.get("index")),
        name: form.get("name"),
        picks: Array.from({ length: Math.min(event.races, 30) }, (_, index) => form.get(`pick-${index + 1}`) || ""),
      },
      {
        index: Number(form.get("indexSecond")),
        name: secondName,
        picks: Array.from({ length: Math.min(event.races, 30) }, (_, index) => form.get(`pick2-${index + 1}`) || ""),
      },
    ];

    let latestData = null;
    for (const participant of participants) {
      const response = await fetch("/api/operations/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEventIds,
          participant,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        return showToast(data.detail || data.error || "No se pudieron guardar ambos studs.");
      }
      latestData = data;
    }

    if (latestData) {
      state.data = latestData;
      render();
      showToast("Se guardaron ambos studs en las campaÃ±as seleccionadas.");
    }
  });
};

function parseSingleOrDualBulkPicks(rawText, raceCount, participantIndex) {
  const parsed = parseBulkPickPayload(rawText, raceCount);
  return Number(participantIndex) === 2 ? parsed.second : parsed.first;
}

renderForecastForm = function renderForecastFormFinal(event) {
  const roster = state.data.registry.filter((item) => item.diaria || item.semanal || item.mensual).map((item) => item.name);
  const names = roster.length ? roster : event.participants.map((item) => item.name);
  const firstParticipant = event.participants[0];
  const secondParticipant = event.participants[1];
  const nextIndex = Math.max(0, ...event.participants.map((item) => Number(item.index) || 0)) + 1;
  return `${renderOperationTargets(event)}<form class="editor-form" data-form="participant"><div class="panel-head"><h4>PronÃƒÂ³stico</h4><p>Ingreso doble por jornada.</p></div><div class="form-grid"><div class="field"><label>NÃƒÂºmero Stud 1</label><input name="index" type="number" min="1" value="${firstParticipant?.index || nextIndex}" /></div><div class="field"><label>Stud 1</label><select name="name">${names.map((name) => `<option value="${name}"${name === firstParticipant?.name ? " selected" : ""}>${name}</option>`).join("")}</select></div><div class="field"><label>NÃƒÂºmero Stud 2</label><input name="indexSecond" type="number" min="1" value="${secondParticipant?.index || (nextIndex + 1)}" /></div><div class="field"><label>Stud 2</label><select name="nameSecond"><option value="">No usar</option>${names.map((name) => `<option value="${name}"${name === secondParticipant?.name ? " selected" : ""}>${name}</option>`).join("")}</select></div></div><div class="field"><label>Pegar en lote</label><textarea name="bulkPicks" rows="8" placeholder="1. 5-12&#10;2. 12-1&#10;3. 11-5"></textarea><p class="hint">Formato doble: 1. 5-12. El primer valor va al Stud 1 y el segundo al Stud 2. Si solo quieres uno, deja Stud 2 en No usar.</p><div class="toolbar-group"><button type="button" class="ghost-button" data-apply-bulk-picks>Aplicar pegado</button><button type="button" class="ghost-button" data-clear-bulk-picks>Limpiar picks</button></div></div><div class="panel-head"><h4>Stud 1</h4><p>Picks del primer stud.</p></div><div class="form-grid">${Array.from({ length: Math.min(event.races, 30) }, (_, index) => `<div class="field"><label>C${index + 1}</label><input name="pick-${index + 1}" type="text" value="${firstParticipant?.picks[index]?.horse || ""}" /></div>`).join("")}</div><div class="panel-head"><h4>Stud 2</h4><p>Picks del segundo stud.</p></div><div class="form-grid">${Array.from({ length: Math.min(event.races, 30) }, (_, index) => `<div class="field"><label>C${index + 1}</label><input name="pick2-${index + 1}" type="text" value="${secondParticipant?.picks[index]?.horse || ""}" /></div>`).join("")}</div><div class="actions"><span class="hint">Puedes guardar solo Stud 1 o guardar ambos studs juntos.</span><button class="primary-button" type="submit">Guardar Stud 1</button><button class="ghost-button" type="button" data-save-double-picks>Guardar ambos studs</button></div></form>`;
};

const bindEventFormsPreviousFinal = bindEventForms;
bindEventForms = function bindEventFormsFinal(container, event) {
  bindEventFormsPreviousFinal(container, event);

  const participantForm = container.querySelector('[data-form="participant"]');
  if (!participantForm) return;

  const applyBulkButton = container.querySelector("[data-apply-bulk-picks]");
  const clearBulkButton = container.querySelector("[data-clear-bulk-picks]");
  const bulkInput = participantForm.querySelector('[name="bulkPicks"]');
  const fillPickInputs = (prefix, values) => {
    Array.from({ length: Math.min(event.races, 30) }, (_, index) => {
      const input = participantForm.querySelector(`[name="${prefix}${index + 1}"]`);
      if (input) input.value = values[index] || "";
    });
  };

  applyBulkButton?.addEventListener("click", () => {
    const parsed = parseDualBulkPicks(bulkInput?.value || "", event.races);
    fillPickInputs("pick-", parsed.first);
    fillPickInputs("pick2-", parsed.second);
    showToast(`Pegado aplicado en ${Math.min(parsed.first.filter(Boolean).length + parsed.second.filter(Boolean).length, Math.min(event.races, 30) * 2)} casillas.`);
  });

  clearBulkButton?.addEventListener("click", () => {
    fillPickInputs("pick-", []);
    fillPickInputs("pick2-", []);
    if (bulkInput) bulkInput.value = "";
    showToast("PronÃƒÂ³sticos limpiados.");
  });

  participantForm.querySelector("[data-save-double-picks]")?.addEventListener("click", async () => {
    const form = new FormData(participantForm);
    const secondName = String(form.get("nameSecond") || "").trim();
    const operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    const resolved = resolveCampaignTargetIds({
      operationDate,
      daily: safeArray(state.adminTargetSelections.daily),
      weekly: safeArray(state.adminTargetSelections.weekly),
      monthly: safeArray(state.adminTargetSelections.monthly),
    });
    const targetEventIds = resolved.ids.length ? resolved.ids : [event.id];

    if (!secondName) {
      return showToast("Selecciona el Stud 2 para guardar ambos.");
    }
    if (!targetEventIds.length) {
      return showToast("No hay campaÃ±as activas para esa fecha.");
    }

    const participants = [
      {
        index: Number(form.get("index")),
        name: form.get("name"),
        picks: Array.from({ length: Math.min(event.races, 30) }, (_, index) => form.get(`pick-${index + 1}`) || ""),
      },
      {
        index: Number(form.get("indexSecond")),
        name: secondName,
        picks: Array.from({ length: Math.min(event.races, 30) }, (_, index) => form.get(`pick2-${index + 1}`) || ""),
      },
    ];

    let latestData = null;
    for (const participant of participants) {
      const response = await fetch("/api/operations/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetEventIds,
          participant,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        return showToast(data.detail || data.error || "No se pudieron guardar ambos studs.");
      }
      latestData = data;
    }

    if (latestData) {
      state.data = latestData;
      render();
      showToast("Se guardaron ambos studs.");
    }
  });
};

render();

renderDailyContent = function renderDailyContentV2() {
  const today = toLocalDateInputValue();
  const dailyEvents = getDailyCampaignEvents(today);
  const event = eventById(dailyEvents, state.dailyEventId);
  state.dailyEventId = event?.id || null;
  if (!event) {
    dailyView.innerHTML = `${renderOfficialBanner(
      "Diaria",
      "Sin jornada activa",
      `No hay una campana diaria asociada a ${today}. Cuando coincida la fecha, aqui aparecera el tablero oficial.`,
      [today, "Esperando jornada"]
    )}<section class="panel"><div class="empty">Todavia no hay informacion diaria para esta fecha.</div></section>`;
    return;
  }

  const nextPendingRace = getNextPendingRace(event);
  const finished = isEventFinished(event);
  const dailyCampaign = getEnabledCampaigns("daily").find((item) => item.eventId === event.id) || null;
  const scoringMode = event?.scoring?.mode || "dividend";
  const rankedEntries = sortRankingEntriesFinal(event.leaderboard);
  const leader = rankedEntries[0];
  const context = buildCampaignContextMetaFinal("daily", dailyCampaign, event, scoringMode);
  const topSummary = finished
    ? `<section class="panel"><div class="panel-head"><h3>Radiografia de la jornada</h3><p>Lo primero que quieren ver los jugadores.</p></div><div class="result-metrics"><article><span>Participantes</span><strong>${event.participants.length}</strong></article><article><span>Estado</span><strong>Jornada finalizada</strong></article><article><span>Ganador de la jornada</span><strong>${leader?.name || "-"}</strong></article></div></section>`
    : `<section class="grid-2"><section class="panel"><div class="panel-head"><h3>Radiografia de la jornada</h3><p>Lo primero que quieren ver los jugadores.</p></div><div class="result-metrics"><article><span>Participantes</span><strong>${event.participants.length}</strong></article><article><span>Proxima carrera</span><strong>C${nextPendingRace}</strong></article><article><span>Lider actual</span><strong>${leader?.name || "-"}</strong></article></div></section>${renderRaceFocusCard(event, "Caballos mas jugados", "Que ejemplares concentran mas pronosticos en la proxima carrera.")}</section>`;

  const officialBoard = renderLeaderboardSpotlight(
    rankedEntries,
    scoringMode,
    "Tabla oficial diaria",
    "Puntaje completo de todos los participantes y diferencia con el lider.",
    "daily",
    { event }
  );
  const picksPanel = renderPicksTable(
    event,
    "Pronosticos registrados",
    "Cada casilla cambia de color segun lo que sumo ese pick.",
    { theme: "daily", campaign: dailyCampaign, program: getProgramForEventFinal({ ...event, campaign: dailyCampaign }) }
  );
  const resultsPanel = renderResultsLedger(
    event,
    "Resultados de la jornada",
    "Cada carrera queda lista para informar al publico.",
    "daily"
  );

  const visibleDailyEvents = dailyEvents.filter((item) => !!(item?.participants?.length || item?.results?.length || item?.leaderboard?.length));
  const tabsPanel = visibleDailyEvents.length > 1
    ? `<section class="panel panel-compact"><div class="toolbar"><div><p class="label">Jornada diaria</p><div class="toolbar-group" id="dailyTabs"></div></div><span class="tag">Tablon oficial</span></div></section>`
    : "";

  dailyView.innerHTML = `${renderOfficialBanner(
    "Diaria",
    event.viewLabel || getEventViewLabel(event),
    "Resumen listo para compartir con los participantes, con lectura rapida y tabla viva por carrera.",
    [today, ...context.chips, `${event.races} carreras`, leader ? `${finished ? "Ganador" : "Lider"}: ${leader.name}` : "Sin lider"],
    "daily",
    context.meta
  )}${tabsPanel}${topSummary}${officialBoard}<section class="stack daily-stack"><div class="daily-stack-block">${picksPanel}</div><div class="daily-stack-block">${resultsPanel}</div></section>`;

  const tabs = dailyView.querySelector("#dailyTabs");
  if (tabs) {
    visibleDailyEvents.forEach((item) => {
      const button = document.createElement("button");
      button.className = `subnav-button${item.id === event.id ? " active" : ""}`;
      button.textContent = item.viewLabel || getEventViewLabel(item);
      button.addEventListener("click", () => {
        state.dailyEventId = item.id;
        render();
      });
      tabs.appendChild(button);
    });
  }
}

function renderForecastOperationTargets(operationDate, selectedGroupId, snapshot) {
  const groupLabel = snapshot.resolvedGroupId === null
    ? "Debes elegir un grupo"
    : snapshot.resolvedGroupId
      ? getRegistryGroupLabel(snapshot.resolvedGroupId)
      : "Todos los participantes";
  const programTrackOptions = getProgramTrackOptionsForDate(operationDate);
  const selectedProgramTrackId = getResolvedProgramTrackId(operationDate, state.adminTargetSelections.programTrackId || "");
  const selectedProgramTrack = programTrackOptions.find((item) => item.trackId === selectedProgramTrackId) || null;
  const renderTargetCheckboxes = (kind, label) => {
    const matches = snapshot.matches.filter((match) => match.campaignKind === kind);
    if (!matches.length) {
      return `<div class="panel compact"><div class="panel-head"><h4>${label}</h4><p>Sin campañas visibles para esta fecha.</p></div><p class="hint">No hay campañas ${label.toLowerCase()} activas con este filtro.</p></div>`;
    }
    const selectedIds = new Set(safeArray(state.adminTargetSelections[kind]));
    return `<div class="panel compact"><div class="panel-head"><h4>${label}</h4><p>Marca a cuáles campañas entra este pronóstico.</p></div><div class="check-grid">${matches.map((match) => `<label class="check-chip wide"><input type="checkbox" data-target-campaign="${kind}" value="${match.campaign?.id || ""}"${selectedIds.has(match.campaign?.id) ? " checked" : ""} /> ${match.campaign?.name || match.label}</label>`).join("")}</div></div>`;
  };
  return `<div class="panel"><div class="panel-head"><h4>Destino del guardado</h4><p>La fecha y el grupo muestran las campañas vigentes, y tú decides a cuáles entra este pronóstico.</p></div><div class="stack"><div class="form-grid"><div class="field"><label>Fecha operativa</label><input data-operation-date type="date" value="${operationDate}" /></div><div class="field"><label>Grupo</label><select data-operation-group><option value="">${snapshot.resolvedGroupId === null ? "Selecciona un grupo" : "Todos / automatico"}</option>${getRegistryGroupOptions().map((group) => `<option value="${group.id}"${group.id === selectedGroupId ? " selected" : ""}>${group.name}</option>`).join("")}</select></div><div class="field"><label>Roster activo</label><input type="text" value="${groupLabel}" readonly /></div><div class="field"><label>Programa del dia</label><select data-program-track><option value="">${programTrackOptions.length > 1 ? "Elegir hipodromo" : programTrackOptions.length ? "Programa detectado" : "Sin programa cargado"}</option>${programTrackOptions.map((item) => `<option value="${item.trackId}"${item.trackId === selectedProgramTrackId ? " selected" : ""}>${item.trackName} · ${item.raceCount} carreras</option>`).join("")}</select></div></div><div class="result-metrics"><article><span>Campañas visibles</span><strong>${snapshot.matches.length}</strong></article><article><span>Campañas marcadas</span><strong>${snapshot.selectedMatches.length}</strong></article><article><span>Destino total</span><strong>${snapshot.targetEventIds.length}</strong></article></div><div class="grid-3">${renderTargetCheckboxes("daily", "Diaria")}${renderTargetCheckboxes("weekly", "Semanal")}${renderTargetCheckboxes("monthly", "Mensual")}</div><p class="hint">${selectedProgramTrack ? `Los picks mostraran ejemplares de ${selectedProgramTrack.trackName}.` : (snapshot.warnings[0] || "Puedes marcar una, varias o ninguna campaña, según a quiénes quieres incluir en la carga.")}</p></div></div>`;
}

renderForecastFormAdminDouble = function renderForecastFormAdminDoubleTopActions(event) {
  const operationDate = state.adminTargetSelections.operationDate || toLocalDateInputValue();
  const selectedGroupId = state.adminTargetSelections.groupId || "";
  const selectedProgramTrackId = getResolvedProgramTrackId(operationDate, state.adminTargetSelections.programTrackId || "");
  const selectedProgram = getProgramForDateTrack(operationDate, selectedProgramTrackId);
  const snapshot = getForecastSelectionSnapshot(operationDate, selectedGroupId);
  const roster = safeArray(snapshot.roster).map((item) => String(item.name || "").trim()).filter(Boolean);
  const editTarget = state.adminForecastEdit && state.adminForecastEdit.eventId === event.id
    ? safeArray(event.participants).find((item) => Number(item.index) === Number(state.adminForecastEdit.index))
    : null;
  const firstParticipant = editTarget || null;
  const usedNames = getForecastUsedParticipantNames(snapshot.selectedMatches);
  const availableNames = roster.filter((name) => !usedNames.has(name) || name === editTarget?.name);
  const names = availableNames.length ? availableNames : roster;
  const nextIndex = Math.max(0, ...safeArray(event.participants).map((item) => Number(item.index) || 0)) + 1;
  const firstSelectedName = firstParticipant?.name || "";
  const secondNames = names.filter((name) => name !== firstSelectedName);
  const renderProgramHint = (raceNumber, horseValue) => {
    const runnerName = getRunnerNameFromProgram(selectedProgram, raceNumber, horseValue);
    return `<p class="hint pick-runner-name" data-runner-hint="${raceNumber}">${runnerName || (selectedProgram ? "Sin nombre para ese numero" : "Carga o elige un programa para ver el ejemplar")}</p>`;
  };
  return `${renderForecastOperationTargets(operationDate, selectedGroupId, snapshot)}<form class="editor-form" data-form="participant-double" autocomplete="off"><div class="panel-head"><h4>Pronostico</h4><p>${editTarget ? `Editando ${editTarget.name}. Puedes corregirlo y guardar.` : "Ingreso por jornada. Puedes agregar otro stud si lo necesitas."}</p></div><div class="form-grid"><div class="field"><label>Numero Stud 1</label><input name="index" type="number" min="1" value="${firstParticipant?.index || nextIndex}" /></div><div class="field"><label>Stud 1</label><select name="name"><option value="">${snapshot.warnings.length ? snapshot.warnings[0] : "Selecciona un stud"}</option>${names.map((name) => `<option value="${name}"${name === firstSelectedName ? " selected" : ""}>${name}</option>`).join("")}</select></div></div><div class="toolbar-group"><button type="button" class="ghost-button" data-toggle-second-stud>Agregar stud</button>${editTarget ? '<button type="button" class="ghost-button" data-cancel-forecast-edit>Cancelar edicion</button>' : ""}</div><div class="stack" data-second-stud-block hidden><div class="form-grid"><div class="field"><label>Numero Stud 2</label><input name="indexSecond" type="number" min="1" value="" /></div><div class="field"><label>Stud 2</label><select name="nameSecond"><option value="">Selecciona un stud</option>${secondNames.map((name) => `<option value="${name}">${name}</option>`).join("")}</select></div></div></div><div class="field"><label>Pegar en lote</label><textarea name="bulkDualPicks" rows="8" placeholder="1. 5-12&#10;2. 12-1&#10;3. 11-5" spellcheck="false"></textarea><p class="hint">Formato doble: 1. 5-12. El primer valor llena Stud 1 y el segundo llena Stud 2. Si solo usaras uno, no agregues el segundo stud.</p><div class="toolbar-group"><button type="button" class="ghost-button" data-apply-dual-bulk>Aplicar pegado</button><button type="button" class="ghost-button" data-clear-dual-bulk>Limpiar picks</button><button class="primary-button" type="submit"${snapshot.targetEventIds.length && names.length ? "" : " disabled"}>${editTarget ? "Guardar cambios" : "Guardar Stud 1"}</button><button class="ghost-button" type="button" data-save-double-picks hidden${snapshot.targetEventIds.length && names.length ? "" : " disabled"}>Guardar ambos studs</button></div></div><div class="panel-head"><h4>Stud 1</h4><p>Picks del primer stud.</p></div><div class="form-grid">${Array.from({ length: Math.min(event.races, 30) }, (_, index) => `<div class="field"><label>C${index + 1}</label><input name="pick-${index + 1}" type="text" value="${firstParticipant?.picks[index]?.horse || ""}" autocomplete="off" />${renderProgramHint(index + 1, firstParticipant?.picks[index]?.horse || "")}</div>`).join("")}</div><section class="stack" data-second-picks-block hidden><div class="panel-head"><h4>Stud 2</h4><p>Picks del segundo stud.</p></div><div class="form-grid">${Array.from({ length: Math.min(event.races, 30) }, (_, index) => `<div class="field"><label>C${index + 1}</label><input name="pick2-${index + 1}" type="text" value="" autocomplete="off" /><p class="hint pick-runner-name" data-runner-hint-second="${index + 1}">${selectedProgram ? "Sin nombre para ese numero" : "Carga o elige un programa para ver el ejemplar"}</p></div>`).join("")}</div></section></form>`;
};

bindForecastFormAdminDouble = function bindForecastFormAdminDoubleFinal(container, event) {
  const form = container.querySelector('[data-form="participant-double"]');
  if (!form) return;
  const getProgram = () => {
    const operationDate = container.querySelector("[data-operation-date]")?.value || state.adminTargetSelections.operationDate || toLocalDateInputValue();
    const trackId = getResolvedProgramTrackId(operationDate, container.querySelector("[data-program-track]")?.value || state.adminTargetSelections.programTrackId || "");
    return getProgramForDateTrack(operationDate, trackId);
  };
  const getSnapshot = () => getForecastSelectionSnapshot(
    container.querySelector("[data-operation-date]")?.value || state.adminTargetSelections.operationDate || toLocalDateInputValue(),
    container.querySelector("[data-operation-group]")?.value || state.adminTargetSelections.groupId || "",
  );
  const editTarget = state.adminForecastEdit && state.adminForecastEdit.eventId === event.id
    ? safeArray(event.participants).find((item) => Number(item.index) === Number(state.adminForecastEdit.index))
    : null;
  const secondStudBlock = form.querySelector("[data-second-stud-block]");
  const secondPicksBlock = form.querySelector("[data-second-picks-block]");
  const toggleSecondStudButton = form.querySelector("[data-toggle-second-stud]");
  const saveDoubleButton = form.querySelector("[data-save-double-picks]");
  const bulkArea = form.querySelector('[name="bulkDualPicks"]');
  const indexInput = form.querySelector('[name="index"]');
  const secondIndexInput = form.querySelector('[name="indexSecond"]');
  const nameSelect = form.querySelector('[name="name"]');
  const secondNameInput = form.querySelector('[name="nameSecond"]');
  const fillPickInputs = (prefix, values) => {
    Array.from({ length: Math.min(event.races, 30) }, (_, index) => {
      const input = form.querySelector(`[name="${prefix}${index + 1}"]`);
      if (input) input.value = values[index] || "";
    });
    refreshProgramHints();
  };
  const refreshProgramHints = () => {
    const program = getProgram();
    Array.from({ length: Math.min(event.races, 30) }, (_, index) => {
      const raceNumber = index + 1;
      const firstHint = form.querySelector(`[data-runner-hint="${raceNumber}"]`);
      const secondHint = form.querySelector(`[data-runner-hint-second="${raceNumber}"]`);
      const firstValue = form.querySelector(`[name="pick-${raceNumber}"]`)?.value || "";
      const secondValue = form.querySelector(`[name="pick2-${raceNumber}"]`)?.value || "";
      if (firstHint) {
        const runnerName = getRunnerNameFromProgram(program, raceNumber, firstValue);
        firstHint.textContent = runnerName || (program ? "Sin nombre para ese numero" : "Carga o elige un programa para ver el ejemplar");
      }
      if (secondHint) {
        const runnerName = getRunnerNameFromProgram(program, raceNumber, secondValue);
        secondHint.textContent = runnerName || (program ? "Sin nombre para ese numero" : "Carga o elige un programa para ver el ejemplar");
      }
    });
  };
  const currentMaxIndex = Math.max(0, ...safeArray(event.participants).map((item) => Number(item.index) || 0));
  state.adminForecastNextIndex = editTarget ? Number(editTarget.index) : currentMaxIndex + 1;
  const getRoster = () => safeArray(getSnapshot().roster).map((item) => String(item.name || "").trim()).filter(Boolean);
  const getUsedNames = () => getForecastUsedParticipantNames(getSnapshot().selectedMatches);
  const setSelectOptions = (select, values, selectedValue = "") => {
    if (!select) return;
    select.innerHTML = [`<option value="">Selecciona un stud</option>`, ...values.map((value) => `<option value="${value}">${value}</option>`)].join("");
    select.value = values.includes(selectedValue) ? selectedValue : "";
  };
  const refreshStudOptions = () => {
    const roster = getRoster();
    const usedNames = getUsedNames();
    const firstOptions = roster.filter((name) => !usedNames.has(name) || name === editTarget?.name);
    const safeFirst = firstOptions.length ? firstOptions : roster;
    const currentFirst = String(nameSelect?.value || "").trim();
    const selectedFirst = currentFirst && safeFirst.includes(currentFirst)
      ? currentFirst
      : (editTarget?.name && safeFirst.includes(editTarget.name) ? editTarget.name : "");
    if (nameSelect) {
      nameSelect.innerHTML = [`<option value="">Selecciona un stud</option>`, ...safeFirst.map((value) => `<option value="${value}">${value}</option>`)].join("");
      nameSelect.value = selectedFirst;
    }
    const secondOptions = safeFirst.filter((name) => name !== (nameSelect?.value || selectedFirst));
    const currentSecond = String(secondNameInput?.value || "").trim();
    if (secondNameInput) {
      secondNameInput.innerHTML = [`<option value="">Selecciona un stud</option>`, ...secondOptions.map((name) => `<option value="${name}">${name}</option>`)].join("");
      if (currentSecond && secondOptions.includes(currentSecond)) {
        secondNameInput.value = currentSecond;
      } else {
        secondNameInput.value = "";
      }
    }
  };
  const refreshSecondStudOptions = () => {
    const roster = getRoster();
    const selectedFirst = String(nameSelect?.value || "").trim();
    const usedNames = getUsedNames();
    const firstOptions = roster.filter((name) => !usedNames.has(name) || name === editTarget?.name);
    const safeFirst = firstOptions.length ? firstOptions : roster;
    const secondOptions = safeFirst.filter((name) => name !== selectedFirst);
    const currentSecond = String(secondNameInput?.value || "").trim();
    if (secondNameInput) {
      secondNameInput.innerHTML = [`<option value="">Selecciona un stud</option>`, ...secondOptions.map((name) => `<option value="${name}">${name}</option>`)].join("");
      secondNameInput.value = secondOptions.includes(currentSecond) ? currentSecond : "";
    }
  };
  const syncSecondIndex = () => {
    if (secondIndexInput) secondIndexInput.value = String((Number(indexInput?.value || 0) || 0) + 1 || "");
  };
  const rerenderForFilters = () => {
    const nextOperationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    const nextGroupId = String(container.querySelector("[data-operation-group]")?.value || "").trim();
    const nextProgramTrackId = String(container.querySelector("[data-program-track]")?.value || "").trim();
    state.adminTargetSelections.operationDate = container.querySelector("[data-operation-date]")?.value || toLocalDateInputValue();
    state.adminTargetSelections.groupId = String(container.querySelector("[data-operation-group]")?.value || "").trim();
    state.adminTargetSelections.programTrackId = String(container.querySelector("[data-program-track]")?.value || "").trim();
    ["daily", "weekly", "monthly"].forEach((kind) => {
      state.adminTargetSelections[kind] = Array.from(container.querySelectorAll(`[data-target-campaign="${kind}"]:checked`)).map((item) => item.value).filter(Boolean);
    });
    state.adminTargetSelections.operationDate = nextOperationDate;
    state.adminTargetSelections.groupId = nextGroupId;
    state.adminTargetSelections.programTrackId = nextProgramTrackId;
    state.adminForecastEdit = null;
    state.adminForecastSecondStudVisible = false;
    render();
  };
  const resetSelectionForScope = () => {
    state.adminTargetSelections.scopeKey = "";
    state.adminTargetSelections.selectionTouched = false;
    state.adminTargetSelections.daily = [];
    state.adminTargetSelections.weekly = [];
    state.adminTargetSelections.monthly = [];
    rerenderForFilters();
  };
  const setSecondVisible = (visible) => {
    state.adminForecastSecondStudVisible = visible;
    if (secondStudBlock) secondStudBlock.hidden = !visible;
    if (secondPicksBlock) secondPicksBlock.hidden = !visible;
    if (saveDoubleButton) saveDoubleButton.hidden = !visible;
    if (toggleSecondStudButton) toggleSecondStudButton.textContent = visible ? "Ocultar stud 2" : "Agregar stud";
    if (visible) syncSecondIndex();
    if (!visible) {
      if (secondNameInput) secondNameInput.value = "";
      if (secondIndexInput) secondIndexInput.value = "";
      fillPickInputs("pick2-", []);
    }
  };
  refreshStudOptions();
  refreshProgramHints();
  if (editTarget) {
    if (indexInput) indexInput.value = editTarget.index;
    fillPickInputs("pick-", safeArray(editTarget.picks).map((pick) => pick?.horse || ""));
  } else {
    if (indexInput) indexInput.value = String(state.adminForecastNextIndex || "");
    if (nameSelect) nameSelect.value = "";
    if (secondNameInput) secondNameInput.value = "";
    if (bulkArea) bulkArea.value = "";
    fillPickInputs("pick-", []);
    fillPickInputs("pick2-", []);
    setTimeout(() => {
      if (!state.adminForecastEdit) {
        if (nameSelect) nameSelect.value = "";
        if (secondNameInput) secondNameInput.value = "";
        refreshSecondStudOptions();
      }
    }, 0);
  }
  setSecondVisible(false);
  const clearForecastForm = () => {
    state.adminForecastEdit = null;
    state.adminForecastNextIndex = Math.max(0, ...safeArray(state.data?.events?.[event.id]?.participants || event.participants).map((item) => Number(item.index) || 0)) + 1;
    if (indexInput) indexInput.value = String(state.adminForecastNextIndex || "");
    if (nameSelect) nameSelect.value = "";
    if (secondNameInput) secondNameInput.value = "";
    if (bulkArea) bulkArea.value = "";
    fillPickInputs("pick-", []);
    fillPickInputs("pick2-", []);
    refreshStudOptions();
    setSecondVisible(false);
  };
  indexInput?.addEventListener("input", () => {
    if (!secondStudBlock?.hidden) syncSecondIndex();
  });
  nameSelect?.addEventListener("change", () => {
    refreshSecondStudOptions();
    refreshProgramHints();
  });
  form.querySelectorAll('input[name^="pick-"], input[name^="pick2-"]').forEach((input) => {
    input.addEventListener("input", refreshProgramHints);
  });
  container.querySelector("[data-operation-date]")?.addEventListener("change", resetSelectionForScope);
  container.querySelector("[data-operation-group]")?.addEventListener("change", resetSelectionForScope);
  container.querySelector("[data-program-track]")?.addEventListener("change", rerenderForFilters);
  container.querySelectorAll("[data-target-campaign]").forEach((input) => {
    input.addEventListener("change", () => {
      state.adminTargetSelections.selectionTouched = true;
      rerenderForFilters();
    });
  });
  toggleSecondStudButton?.addEventListener("click", () => setSecondVisible(secondStudBlock?.hidden));
  form.querySelector("[data-clear-dual-bulk]")?.addEventListener("click", () => {
    if (bulkArea) bulkArea.value = "";
    fillPickInputs("pick-", []);
    fillPickInputs("pick2-", []);
    showToast("Pronosticos limpiados.");
  });
  form.querySelector("[data-apply-dual-bulk]")?.addEventListener("click", () => {
    const parsed = parseDualBulkPicks(bulkArea?.value || "", event.races);
    fillPickInputs("pick-", parsed.first);
    if (parsed.second.some(Boolean)) {
      setSecondVisible(true);
      fillPickInputs("pick2-", parsed.second);
    }
    showToast(parsed.second.some(Boolean) ? "Pegado aplicado a ambos studs." : "Pegado aplicado al Stud 1.");
  });
  const getPickValues = (prefix) => Array.from({ length: Math.min(event.races, 30) }, (_, index) => String(form.querySelector(`[name="${prefix}${index + 1}"]`)?.value || "").trim());
  const validateCompletePicks = (participantName, picks) => {
    const missing = picks.map((value, index) => !value ? index + 1 : null).filter(Boolean);
    if (!missing.length) return true;
    showToast(`Faltan pronosticos en ${participantName || "este stud"}: ${missing.map((race) => `C${race}`).join(", ")}`);
    return false;
  };
  const resolveTargets = () => {
    const snapshot = getSnapshot();
    return snapshot.targetEventIds.length ? snapshot.targetEventIds : [];
  };
  form.addEventListener("submit", async (submitEvent) => {
    submitEvent.preventDefault();
    const dataForm = new FormData(form);
    const firstPicks = getPickValues("pick-");
    const participant = { index: Number(dataForm.get("index")), name: dataForm.get("name"), picks: firstPicks };
    if (!participant.name) return showToast("Selecciona el Stud 1 antes de guardar.");
    if (!validateCompletePicks(participant.name, firstPicks)) return;
    const targetEventIds = resolveTargets();
    if (!targetEventIds.length) return showToast(getSnapshot().warnings[0] || "No hay campañas visibles para guardar este pronostico.");
    const response = await fetch("/api/operations/batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetEventIds, participant }),
    });
    const data = await response.json();
    if (!response.ok) return showToast(data.detail || data.error || "No se pudo guardar el Stud 1.");
    let latestData = data;
    try {
      latestData = await persistRegisteredParticipantsForMatches([participant.name], getSnapshot().selectedMatches, latestData);
    } catch (error) {
      showToast(error.message || "El pronostico se guardo, pero no se pudo fijar el inscrito.");
    }
    state.data = latestData;
    clearForecastForm();
    render();
    showToast(editTarget ? "Stud editado." : "Stud 1 guardado.");
  });
  form.querySelector("[data-save-double-picks]")?.addEventListener("click", async () => {
    const dataForm = new FormData(form);
    const firstName = String(dataForm.get("name") || "").trim();
    const secondName = String(dataForm.get("nameSecond") || "").trim();
    const firstPicks = getPickValues("pick-");
    const secondPicks = getPickValues("pick2-");
    const participants = [
      { index: Number(dataForm.get("index")), name: firstName, picks: firstPicks },
      { index: Number(dataForm.get("indexSecond")), name: secondName, picks: secondPicks },
    ];
    if (!firstName) return showToast("Selecciona el Stud 1 antes de guardar.");
    if (!secondName) return showToast("Selecciona el Stud 2 para guardar ambos.");
    if (!validateCompletePicks(participants[0].name, firstPicks) || !validateCompletePicks(participants[1].name, secondPicks)) return;
    const targetEventIds = resolveTargets();
    if (!targetEventIds.length) return showToast(getSnapshot().warnings[0] || "No hay campañas visibles para guardar este pronostico.");
    let latestData = null;
    for (const participant of participants) {
      const response = await fetch("/api/operations/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetEventIds, participant }),
      });
      const data = await response.json();
      if (!response.ok) return showToast(data.detail || data.error || "No se pudieron guardar ambos studs.");
      latestData = data;
    }
    try {
      latestData = await persistRegisteredParticipantsForMatches(participants.map((participant) => participant.name), getSnapshot().selectedMatches, latestData);
    } catch (error) {
      showToast(error.message || "Los pronosticos se guardaron, pero no se pudieron fijar los inscritos.");
    }
    state.data = latestData;
    clearForecastForm();
    render();
    showToast("Se guardaron ambos studs.");
  });
  container.querySelectorAll("[data-edit-forecast]").forEach((button) => {
    button.addEventListener("click", () => {
      state.adminForecastEdit = { eventId: button.dataset.editForecast, index: Number(button.dataset.editIndex) };
      render();
    });
  });
  container.querySelectorAll("[data-delete-forecast]").forEach((button) => {
    button.addEventListener("click", async () => {
      const response = await fetch(`/api/events/${button.dataset.deleteForecast}/participants/${Number(button.dataset.deleteIndex)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) return showToast(data.detail || data.error || "No se pudo eliminar el pronostico.");
      state.data = data;
      state.adminForecastEdit = null;
      render();
      showToast("Pronostico eliminado.");
    });
  });
  form.querySelector("[data-cancel-forecast-edit]")?.addEventListener("click", () => {
    state.adminForecastEdit = null;
    render();
  });
};

render();

render();

const WEEKDAY_ORDER_FINAL = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];

function normalizeWeekdayFinal(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function getEventLabelFinal(event) {
  return String(event?.sheetName || event?.viewLabel || event?.title || event?.id || "").trim();
}

renderWeeklyCompetitionFields = function renderWeeklyCompetitionFieldsFinal(draft = {}) {
  const registryGroups = getRegistryGroups();
  const groupsValue = serializeGroupDefinitions(safeArray(draft.groups).length ? draft.groups : registryGroups);
  const selectedFinalDays = safeArray(draft.finalDays).length ? safeArray(draft.finalDays) : ["Sabado", "Domingo"];
  const hasFinalStage = draft.hasFinalStage ?? safeArray(draft.finalDays).length > 0;
  return `<div class="stack">
    <div class="field checkbox-field" data-weekly-final-toggle>
      <label><input name="hasFinalStage" type="checkbox" ${hasFinalStage ? "checked" : ""} /> Esta semanal necesita final</label>
      <p class="hint" data-weekly-final-summary>Aqui eliges si la final se juega solo el Sabado, solo el Domingo o ambos dias.</p>
    </div>
    <div class="check-grid" data-weekly-final-only>
      <label class="check-chip"><input type="checkbox" name="finalDays" value="Sabado"${selectedFinalDays.includes("Sabado") ? " checked" : ""} /> Sabado</label>
      <label class="check-chip"><input type="checkbox" name="finalDays" value="Domingo"${selectedFinalDays.includes("Domingo") ? " checked" : ""} /> Domingo</label>
      <p class="hint">Los dias que marques aqui quedan reservados para la etapa final.</p>
    </div>
    <div class="form-grid" data-weekly-visible="groups">
      <div class="field"><label>Tamano de grupo</label><input name="groupSize" type="number" min="2" value="${Number(draft.groupSize) || Number(state.data.settings.weekly.groupSize) || 4}" /></div>
      <div class="field"><label>Clasifican por grupo</label><input name="qualifiersPerGroup" type="number" min="1" value="${Number(draft.qualifiersPerGroup) || Number(state.data.settings.weekly.qualifiersPerGroup) || 2}" /></div>
    </div>
    <div class="field" data-weekly-visible="groups" data-weekly-final-only>
      <label>Grupos competitivos (solo si eliges "Por grupos")</label>
      <textarea name="groups" rows="5" placeholder="Grupo 1: SIN FE, ALF&#10;Grupo 2: STUD 5, STUD 6">${groupsValue}</textarea>
      <p class="hint">Esto no es el grupo asociado del padron. Aqui defines los grupos internos de competencia para esa semanal. Si no usas la modalidad "Por grupos", este bloque no afecta la campana.</p>
    </div>
    <div class="field" data-weekly-visible="pairs">
      <label>Parejas</label>
      <textarea name="pairs" rows="5" placeholder="Pareja 1: SIN FE + SIN FIA&#10;Pareja 2: ALF + SERVIFRENOS">${serializePairDefinitions(draft.pairs)}</textarea>
      <p class="hint">Formato sugerido: Pareja 1: Stud A + Stud B. Si la campana es en parejas, solo se podran cargar studs que esten en una pareja registrada.</p>
    </div>
    <div class="field" data-weekly-visible="round-robin,pairs,groups,final-qualification" data-weekly-final-only>
      <label>Clasificados totales</label>
      <input name="qualifiersCount" type="number" min="0" value="${Number(draft.qualifiersCount) || 0}" />
      <p class="hint">Si hay final, define aqui cuantos pasan a la etapa del Sabado y Domingo.</p>
    </div>
    <div class="field" data-weekly-visible="round-robin,final-qualification,groups,pairs" data-weekly-final-only>
      <label>Clasificados a la final</label>
      <textarea name="finalists" rows="5" placeholder="SIN FE&#10;ALF&#10;SERVIFRENOS">${serializeNameLines(draft.finalists)}</textarea>
      <p class="hint">Un participante por linea. Si esta cargado, solo ellos podran entrar a la etapa final en los dias que marcaste. La idea es que salgan de quienes enviaron pronostico; aqui puedes fijarlos manualmente si quieres cerrar la final.</p>
    </div>
    <div class="field checkbox-field" data-weekly-visible="progressive-elimination">
      <label><input name="eliminationMode" type="checkbox" ${draft.eliminationMode ? "checked" : ""} /> Activar eliminacion diaria</label>
      <p class="hint">Se van eliminando los peores acumulados dia a dia segun la regla que definas abajo.</p>
    </div>
    <div class="grid-2" data-weekly-visible="progressive-elimination">
      <div class="field"><label>Eliminados por dia</label><input name="eliminatePerDay" type="number" min="0" max="50" value="${Number(draft.eliminatePerDay) || 0}" /></div>
      <div class="field"><label>Referencia</label><input value="Se calcula sobre el total acumulado hasta ese dia." disabled /></div>
    </div>
  </div>`;
};

readWeeklyDraftFromForm = function readWeeklyDraftFromFormFinal(formElement, existing = {}) {
  const form = new FormData(formElement);
  const weekDays = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado", "Domingo"];
  const selectedActiveDays = form.getAll("activeDays");
  const hasFinalStage = form.get("hasFinalStage") === "on";
  const selectedFinalDays = hasFinalStage ? form.getAll("finalDays") : [];
  const parsedGroups = parseGroupDefinitions(form.get("groups"));
  const fallbackGroups = getRegistryGroups();
  const draft = {
    ...existing,
    id: existing?.id,
    enabled: existing?.enabled,
    name: String(form.get("name") || "").trim(),
    format: String(form.get("format") || ""),
    activeDays: selectedActiveDays.length ? selectedActiveDays : weekDays,
    hasFinalStage,
    finalDays: hasFinalStage ? (selectedFinalDays.length ? selectedFinalDays : ["Sabado", "Domingo"]) : [],
    startDate: String(form.get("startDate") || ""),
    endDate: String(form.get("endDate") || ""),
    groupSize: Number(form.get("groupSize")) || 2,
    qualifiersPerGroup: Number(form.get("qualifiersPerGroup")) || 1,
    eliminationMode: form.get("eliminationMode") === "on",
    eliminatePerDay: Number(form.get("eliminatePerDay")) || 0,
    pairMode: form.get("pairMode") === "on",
    showTotalsByDefault: form.get("showTotalsByDefault") === "on",
    eventIds: [],
    scoring: readScoringFromForm(form),
    finalists: parseNameLines(form.get("finalists")),
    groups: parsedGroups.length ? parsedGroups : fallbackGroups,
    pairs: parsePairDefinitions(form.get("pairs")),
  };
  const raceCountsByEvent = {};
  if (draft.eventIds.length) {
    draft.eventIds.forEach((id) => {
      raceCountsByEvent[id] = Number(form.get(`raceCountEvent::${id}`)) || Number(existing?.raceCountsByEvent?.[id]) || 12;
    });
  } else {
    getWeeklySelectedDays(draft).forEach((day) => {
      const key = `${draft.id || "weekly-preview"}-${normalizeIdPart(day)}`;
      raceCountsByEvent[key] = Number(form.get(`raceCountEvent::${day}`)) || Number(existing?.raceCountsByEvent?.[key]) || 12;
    });
  }
  draft.raceCountsByEvent = raceCountsByEvent;
  return draft;
};

const originalSaveSettingsFinal = saveSettings;
saveSettings = function saveSettingsFinal(event, payload, message) {
  if (event?.currentTarget?.id === "weeklyCampaignForm") {
    const form = new FormData(event.currentTarget);
    const eliminationMode = form.get("eliminationMode") === "on";
    const eliminatePerDay = Number(form.get("eliminatePerDay")) || 0;
    payload.weekly = {
      ...(payload.weekly || {}),
      eliminationMode,
      eliminatePerDay,
    };
    if (payload.campaigns?.weekly) {
      payload.campaigns.weekly = {
        ...payload.campaigns.weekly,
        eliminationMode,
        eliminatePerDay,
      };
    }
  }
  return originalSaveSettingsFinal(event, payload, message);
};

function buildAccumulatedRowsFinal(events, labels) {
  const map = new Map();
  safeArray(events).forEach((event, index) => {
    const label = labels[index] || getEventLabelFinal(event) || `Jornada ${index + 1}`;
    safeArray(event.participants).forEach((participant) => {
      const current = map.get(participant.name) || { name: participant.name, totalPoints: 0, breakdown: {} };
      const score = toNumeric(participant.points) || 0;
      current.totalPoints += score;
      current.breakdown[label] = score;
      map.set(participant.name, current);
    });
  });
  return Array.from(map.values())
    .map((row) => ({
      ...row,
      breakdown: Object.fromEntries(labels.map((label) => [label, row.breakdown[label] || 0])),
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name, "es"));
}

function buildPairRowsFinal(campaign, rows, labels) {
  return safeArray(campaign?.pairs)
    .map((pair, index) => {
      const members = safeArray(pair.members);
      const memberRows = members.map((name) => rows.find((row) => row.name === name)).filter(Boolean);
      const breakdown = Object.fromEntries(labels.map((label) => [
        label,
        memberRows.reduce((sum, row) => sum + (toNumeric(row.breakdown[label]) || 0), 0),
      ]));
      return {
        name: pair.name || `Pareja ${index + 1}`,
        members,
        totalPoints: Object.values(breakdown).reduce((sum, value) => sum + (toNumeric(value) || 0), 0),
        breakdown,
      };
    })
    .sort((a, b) => b.totalPoints - a.totalPoints || a.name.localeCompare(b.name, "es"));
}

function buildWeeklyStatusMapFinal(campaign, rows, labels) {
  const map = new Map();
  const qualifiersPerGroup = Number(campaign?.qualifiersPerGroup) || 0;
  const finalists = safeArray(campaign?.finalists);
  if (safeArray(campaign?.groups).length) {
    safeArray(campaign.groups).forEach((group) => {
      const members = safeArray(group.members);
      const ranked = rows.filter((row) => members.includes(row.name));
      ranked.forEach((row, index) => {
        map.set(row.name, {
          tone: qualifiersPerGroup > 0 && index < qualifiersPerGroup ? "pass" : "out",
          label: qualifiersPerGroup > 0 && index < qualifiersPerGroup ? `Clasifica ${group.name}` : group.name || "Grupo",
        });
      });
    });
  } else if (finalists.length) {
    rows.forEach((row) => {
      map.set(row.name, {
        tone: finalists.includes(row.name) ? "pass" : "out",
        label: finalists.includes(row.name) ? "Finalista" : "Fuera",
      });
    });
  } else if (campaign?.eliminationMode && Number(campaign?.eliminatePerDay) > 0) {
    let survivors = rows.map((row) => row.name);
    const eliminated = new Map();
    safeArray(labels).forEach((label) => {
      const ranked = rows
        .filter((row) => survivors.includes(row.name))
        .map((row) => ({
          name: row.name,
          total: safeArray(labels)
            .slice(0, safeArray(labels).indexOf(label) + 1)
            .reduce((sum, currentLabel) => sum + (toNumeric(row.breakdown[currentLabel]) || 0), 0),
        }))
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name, "es"));
      const removeCount = Math.min(Number(campaign.eliminatePerDay) || 0, Math.max(0, ranked.length - 1));
      ranked.slice(-removeCount).forEach((row) => {
        if (!eliminated.has(row.name)) {
          eliminated.set(row.name, label);
        }
      });
      survivors = ranked.slice(0, Math.max(1, ranked.length - removeCount)).map((row) => row.name);
    });
    rows.forEach((row) => {
      map.set(row.name, eliminated.has(row.name)
        ? { tone: "out", label: `Eliminado tras ${eliminated.get(row.name)}` }
        : { tone: "pass", label: "Sigue" });
    });
  } else if (safeArray(campaign?.finalDays).length) {
    const passingCount = Math.max(1, Math.ceil(rows.length / 2));
    rows.forEach((row, index) => {
      map.set(row.name, {
        tone: index < passingCount ? "pass" : "out",
        label: index < passingCount ? "Va pasando" : "Fuera del corte",
      });
    });
  }
  return map;
}

function renderAccumulatedBoardFinal(title, subtitle, rows, labels, scoringMode, statusMap = new Map(), theme = "weekly") {
  const palette = getViewAccentPalette(theme);
  if (!rows.length) {
    return `<section class="panel panel-total-view" style="border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt});"><div class="panel-head"><h3>${title}</h3><p>${subtitle}</p></div><div class="empty">Todavia no hay posiciones para mostrar.</div></section>`;
  }
  const leaderScore = toNumeric(rows[0]?.totalPoints) || 0;
  return `<section class="panel panel-total-view" style="border:1px solid ${palette.border}; background:linear-gradient(180deg, ${palette.surface}, ${palette.surfaceAlt});"><div class="panel-head"><h3>${title}</h3><p>${subtitle}</p></div><div class="table-scroll accumulated-scroll"><table class="accum-table"><thead><tr><th style="background:${palette.accentSoft}; color:${palette.accentText}">#</th><th style="background:${palette.accentSoft}; color:${palette.accentText}">Stud</th>${labels.map((label) => `<th style="background:${palette.accentSoft}; color:${palette.accentText}">${label}</th>`).join("")}<th style="background:${palette.accentSoft}; color:${palette.accentText}">Total</th><th style="background:${palette.accentSoft}; color:${palette.accentText}">Dif.</th>${statusMap.size ? `<th style="background:${palette.accentSoft}; color:${palette.accentText}">Estado</th>` : ""}</tr></thead><tbody>${rows.map((row, index) => {
    const gap = Math.max(0, leaderScore - (toNumeric(row.totalPoints) || 0));
    const status = statusMap.get(row.name);
    return `<tr style="background:${index === 0 ? palette.accentSoft2 : index % 2 === 0 ? "rgba(255,255,255,0.78)" : "rgba(255,255,255,0.94)"}"><td><strong style="color:${palette.accentText}">${index + 1}</strong></td><td><strong>${row.name}</strong></td>${labels.map((label) => `<td>${formatScoreValue(row.breakdown[label] || 0, scoringMode)}</td>`).join("")}<td><strong style="color:${palette.accentText}">${formatScoreValue(row.totalPoints, scoringMode)}</strong></td><td>${index === 0 ? "Lider" : formatScoreValue(gap, scoringMode)}</td>${statusMap.size ? `<td>${status ? `<span class="status-pill status-${status.tone}">${status.label}</span>` : "-"}</td>` : ""}</tr>`;
  }).join("")}</tbody></table></div></section>`;
}

function renderGroupBoardsFinal(campaign, rows, labels, scoringMode, theme = "weekly") {
  if (!safeArray(campaign?.groups).length) return "";
  return `<section class="panel panel-total-view"><div class="panel-head"><h3>Grupos</h3><p>Clasificacion interna por grupo.</p></div><div class="group-board-grid">${safeArray(campaign.groups).map((group) => {
    const members = safeArray(group.members);
    const ranked = rows.filter((row) => members.includes(row.name));
    const statusMap = new Map();
    ranked.forEach((row, index) => {
      statusMap.set(row.name, {
        tone: index < (Number(campaign.qualifiersPerGroup) || 0) ? "pass" : "out",
        label: index < (Number(campaign.qualifiersPerGroup) || 0) ? "Clasifica" : "Fuera",
      });
    });
    return `<div class="group-board-card">${renderAccumulatedBoardFinal(group.name || "Grupo", "Posiciones dentro del grupo.", ranked, labels, scoringMode, statusMap, theme)}</div>`;
  }).join("")}</div></section>`;
}

function renderPairBoardFinal(campaign, rows, labels, scoringMode, theme = "weekly") {
  if (!(campaign?.pairMode || safeArray(campaign?.pairs).length)) return "";
  const pairRows = buildPairRowsFinal(campaign, rows, labels);
  return renderAccumulatedBoardFinal("Parejas", "Total combinado de cada pareja.", pairRows, labels, scoringMode, new Map(), theme);
}

function renderEventLikeDailyFinal(kindLabel, event, campaignName, scoringMode, officialTitle, options = {}) {
  const finished = isEventFinished(event);
  const rankedParticipants = sortRankingEntriesFinal(event?.participants || event?.leaderboard || []);
  const rankedEvent = {
    ...event,
    participants: rankedParticipants,
    leaderboard: rankedParticipants,
    results: safeArray(event?.results).slice().sort((a, b) => Number(a.race) - Number(b.race)),
  };
  const leader = rankedParticipants[0];
  const nextPending = getNextPendingRace(rankedEvent);
  const campaignKind = normalizeText(kindLabel).includes("mensual") ? "monthly" : normalizeText(kindLabel).includes("semanal") ? "weekly" : "daily";
  const campaign = getEnabledCampaigns(campaignKind).find((item) => {
    if (campaignKind === "daily") return item.eventId === event.id;
    return safeArray(item.eventIds).includes(event.id);
  }) || null;
  const context = buildCampaignContextMetaFinal(campaignKind, campaign, rankedEvent, scoringMode);
  const heroChips = [
    event.date || getEventLabelFinal(event),
    ...context.chips,
    `${event.races} carreras`,
    finished ? `Ganador: ${leader?.name || "-"}` : `Proxima: C${nextPending || "1"}`,
  ];
  const summaryTitle = finished ? "Ganador de la jornada" : "Lider actual";
  const summaryValue = leader?.name || "-";
  const topSummary = `<section class="panel panel-summary"><div class="panel-head"><h3>Radiografia de la jornada</h3><p>Lo primero que quieren ver los jugadores.</p></div><div class="summary-grid"><article><span class="label">Participantes</span><strong>${safeArray(event.participants).length}</strong></article><article><span class="label">Estado</span><strong>${finished ? "Jornada finalizada" : `Proxima carrera C${nextPending || "1"}`}</strong></article><article><span class="label">${summaryTitle}</span><strong>${summaryValue}</strong></article></div></section>`;
  const header = options.compactHeader
    ? renderCompactContextHeaderFinal(
      campaignName || event.title || getEventLabelFinal(event),
      "Jornada puntual dentro del acumulado, con lectura rapida del dia y su tabla oficial.",
      campaignKind,
      heroChips,
      context.meta
      )
    : renderOfficialBanner(
      kindLabel,
      campaignName || event.title || getEventLabelFinal(event),
      "Resumen listo para compartir con los participantes, con lectura rapida y tabla viva por carrera.",
      heroChips,
      campaignKind,
      context.meta
    );
  return `${header}<section class="panel"><div class="panel-head"><h3>${kindLabel}</h3><p>${finished ? "Tablon oficial" : "Jornada en curso."}</p></div><div class="daily-tabs">${`<button class="day-chip active">${getEventLabelFinal(rankedEvent)}</button>`}</div></section>${topSummary}${renderLeaderboardSpotlight(rankedParticipants, scoringMode, officialTitle, "Puntaje completo de todos los participantes y diferencia con el lider.", campaignKind, { event: rankedEvent })}<section class="stack daily-stack"><div class="daily-stack-block">${renderPicksTable(rankedEvent, "Pronosticos registrados", "Cada casilla cambia de color segun lo que sumo ese pick.", { theme: campaignKind, campaign })}</div><div class="daily-stack-block">${renderResultsLedger(rankedEvent, "Resultados de la jornada", "Cada carrera queda lista para informar al publico.", campaignKind)}</div></section>`;
}

function getMonthlyCampaignGroupsFinal() {
  const events = getMonthlyEvents();
  const groups = new Map();
  events.forEach((event) => {
    const campaign = safeArray(getEnabledCampaigns("monthly")).find((item) => safeArray(item.eventIds).includes(event.id));
    const key = campaign?.id || event.title || event.id;
    const existing = groups.get(key) || { id: key, name: campaign?.name || event.title || "Mensual", campaign, events: [] };
    existing.events.push(event);
    groups.set(key, existing);
  });
  return Array.from(groups.values());
}

renderWeeklyContent = function renderWeeklyContentFinal() {
  const groups = getWeeklyCampaignGroups();
  if (!groups.length) {
    weeklyView.innerHTML = `${renderHero("Semanal", "La semanal muestra solo lo que corresponde a ese producto. Puedes ver el total acumulado o entrar a un dia puntual.", [
      { label: "Formato", value: state.data?.settings?.weekly?.format || "sin-datos" },
      { label: "Dias activos", value: safeArray(state.data?.settings?.weekly?.activeDays).length },
      { label: "Final", value: safeArray(state.data?.settings?.weekly?.finalDays).join(", ") || "-" },
      { label: "Modo", value: state.data?.settings?.weekly?.pairMode ? "Parejas" : "Individual" },
    ])}<section class="panel"><div class="empty">Todavia no hay jornadas semanales configuradas.</div></section>`;
    return;
  }
  const campaignGroup = groups.find((group) => group.id === state.weeklyCampaignId) || groups[0];
  state.weeklyCampaignId = campaignGroup.id;
  const campaign = campaignGroup.campaign || getCampaigns("weekly").find((item) => item.id === campaignGroup.id) || {};
  const eventTabs = safeArray(campaignGroup.events)
    .sort((a, b) => WEEKDAY_ORDER_FINAL.indexOf(normalizeWeekdayFinal(a.sheetName)) - WEEKDAY_ORDER_FINAL.indexOf(normalizeWeekdayFinal(b.sheetName)));
  const selectedId = state.weeklyEventId && (state.weeklyEventId === "total" || eventTabs.some((event) => event.id === state.weeklyEventId))
    ? state.weeklyEventId
    : "total";
  state.weeklyEventId = selectedId;
  const scoringMode = campaign?.scoring?.mode || state.data?.settings?.weekly?.scoring?.mode || "points";
  const weeklyContext = buildCampaignContextMetaFinal("weekly", campaign, eventTabs[0], scoringMode);
  const hero = renderOfficialBanner(
    "Semanal",
    campaignGroup.name || "Torneo semanal",
    "Vista oficial del torneo semanal, con total acumulado y entrada por cada dia jugado.",
    [
      ...weeklyContext.chips,
      `Formato: ${campaign.format || state.data?.settings?.weekly?.format || "individual"}`,
      `Dias: ${safeArray(campaign.activeDays || state.data?.settings?.weekly?.activeDays).length}`,
      `Final: ${safeArray(campaign.finalDays || state.data?.settings?.weekly?.finalDays).join(", ") || "-"}`,
    ],
    "weekly",
    [
      ...weeklyContext.meta,
      { label: "Formato", value: campaign.format || state.data?.settings?.weekly?.format || "individual" },
      { label: "Dias activos", value: safeArray(campaign.activeDays || state.data?.settings?.weekly?.activeDays).length || "-" },
      { label: "Final", value: safeArray(campaign.finalDays || state.data?.settings?.weekly?.finalDays).join(", ") || "-" },
    ],
  );
  const campaignSelector = groups.length > 1 ? `<section class="panel"><div class="panel-head"><h3>Campana semanal</h3><p>Primero eliges la campana y luego el dia o el total.</p></div><div class="chip-row">${groups.map((group) => `<button class="day-chip${group.id === campaignGroup.id ? " active" : ""}" data-weekly-campaign="${group.id}">${group.name}</button>`).join("")}</div></section>` : "";
  const tabs = `<section class="panel"><div class="panel-head"><h3>Vista semanal</h3><p>Configurable desde administrador.</p></div><div class="day-tabs"><button class="day-chip${selectedId === "total" ? " active" : ""}" data-weekly-tab="total">TOTAL</button>${eventTabs.map((event) => `<button class="day-chip${selectedId === event.id ? " active" : ""}" data-weekly-tab="${event.id}">${event.sheetName}</button>`).join("")}</div></section>`;
  if (selectedId === "total") {
    const labels = eventTabs.map((event) => event.sheetName);
    const rows = buildAccumulatedRowsFinal(eventTabs, labels);
    const statusMap = buildWeeklyStatusMapFinal(campaign, rows, labels);
weeklyView.innerHTML = `${hero}${campaignSelector}${tabs}${renderAccumulatedBoardFinal(`Total semanal · ${campaignGroup.name}`, "Acumulado por dia para mostrar quien va pasando y quien queda fuera.", rows, labels, scoringMode, statusMap, "weekly")}${renderGroupBoardsFinal(campaign, rows, labels, scoringMode, "weekly")}${renderPairBoardFinal(campaign, rows, labels, scoringMode, "weekly")}`;
  } else {
    const event = eventTabs.find((item) => item.id === selectedId) || eventTabs[0];
    state.weeklyEventId = event.id;
weeklyView.innerHTML = `${campaignSelector}${tabs}${renderEventLikeDailyFinal("Semanal", event, `${campaignGroup.name} · ${event.sheetName}`, scoringMode, "Tabla oficial semanal", { compactHeader: true })}`;
  }
  weeklyView.querySelectorAll("[data-weekly-campaign]").forEach((button) => {
    button.addEventListener("click", () => {
      state.weeklyCampaignId = button.dataset.weeklyCampaign;
      state.weeklyEventId = "total";
      render();
    });
  });
  weeklyView.querySelectorAll("[data-weekly-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.weeklyEventId = button.dataset.weeklyTab;
      render();
    });
  });
};

renderMonthlyContent = function renderMonthlyContentFinal() {
  const groups = getMonthlyCampaignGroupsFinal();
  if (!groups.length) {
    monthlyView.innerHTML = `${renderHero("Mensual", "La mensual tiene una vista total y otra por jornada. Lo que entra al calculo se define en administrador por fechas, hipodromos y jornadas.", [
      { label: "Hipodromos", value: safeArray(state.data?.settings?.monthly?.hipodromos).join(", ") || "-" },
      { label: "Inicio", value: state.data?.settings?.monthly?.startDate || "-" },
      { label: "Termino", value: state.data?.settings?.monthly?.endDate || "-" },
      { label: "Jornadas", value: safeArray(state.data?.settings?.monthly?.selectedEventIds).length || 0 },
    ])}<section class="panel"><div class="empty">Todavia no hay jornadas mensuales configuradas.</div></section>`;
    return;
  }
  const campaignGroup = groups.find((group) => group.id === state.monthlyCampaignId) || groups[0];
  state.monthlyCampaignId = campaignGroup.id;
  const campaign = campaignGroup.campaign || getCampaigns("monthly").find((item) => item.id === campaignGroup.id) || {};
  const eventTabs = safeArray(campaignGroup.events);
  const selectedId = state.monthlyEventId && (state.monthlyEventId === "total" || eventTabs.some((event) => event.id === state.monthlyEventId))
    ? state.monthlyEventId
    : "total";
  state.monthlyEventId = selectedId;
  const scoringMode = campaign?.scoring?.mode || state.data?.settings?.monthly?.scoring?.mode || "dividend";
  const monthlyContext = buildCampaignContextMetaFinal("monthly", campaign, eventTabs[0], scoringMode);
  const hero = renderOfficialBanner(
    "Mensual",
    campaignGroup.name || "Campeonato mensual",
    "Vista oficial del acumulado mensual, con identidad propia y detalle por cada jornada incluida.",
    [
      ...monthlyContext.chips,
      `Inicio: ${campaign.startDate || state.data?.settings?.monthly?.startDate || "-"}`,
      `Termino: ${campaign.endDate || state.data?.settings?.monthly?.endDate || "-"}`,
      `Jornadas: ${safeArray(campaign.eventIds || eventTabs.map((item) => item.id)).length || eventTabs.length}`,
    ],
    "monthly",
    [
      ...monthlyContext.meta,
      { label: "Inicio", value: campaign.startDate || state.data?.settings?.monthly?.startDate || "-" },
      { label: "Termino", value: campaign.endDate || state.data?.settings?.monthly?.endDate || "-" },
      { label: "Jornadas", value: safeArray(campaign.eventIds || eventTabs.map((item) => item.id)).length || eventTabs.length || "-" },
    ],
  );
  const campaignSelector = groups.length > 1 ? `<section class="panel"><div class="panel-head"><h3>Campana mensual</h3><p>Primero eliges la campana y luego la jornada o el total.</p></div><div class="chip-row">${groups.map((group) => `<button class="day-chip${group.id === campaignGroup.id ? " active" : ""}" data-monthly-campaign="${group.id}">${group.name}</button>`).join("")}</div></section>` : "";
  const tabs = `<section class="panel"><div class="panel-head"><h3>Vista mensual</h3><p>Acumulado configurable.</p></div><div class="day-tabs"><button class="day-chip${selectedId === "total" ? " active" : ""}" data-monthly-tab="total">TOTAL</button>${eventTabs.map((event) => `<button class="day-chip${selectedId === event.id ? " active" : ""}" data-monthly-tab="${event.id}">${getEventLabelFinal(event)}</button>`).join("")}</div></section>`;
  if (selectedId === "total") {
    const labels = eventTabs.map((event) => getEventLabelFinal(event));
    const rows = buildAccumulatedRowsFinal(eventTabs, labels);
monthlyView.innerHTML = `${hero}${campaignSelector}${tabs}${renderAccumulatedBoardFinal(`Total mensual · ${campaignGroup.name}`, "Acumulado por jornada para mostrar como va el mes.", rows, labels, scoringMode, new Map(), "monthly")}`;
  } else {
    const event = eventTabs.find((item) => item.id === selectedId) || eventTabs[0];
    state.monthlyEventId = event.id;
monthlyView.innerHTML = `${campaignSelector}${tabs}${renderEventLikeDailyFinal("Mensual", event, `${campaignGroup.name} · ${getEventLabelFinal(event)}`, scoringMode, "Tabla oficial mensual", { compactHeader: true })}`;
  }
  monthlyView.querySelectorAll("[data-monthly-campaign]").forEach((button) => {
    button.addEventListener("click", () => {
      state.monthlyCampaignId = button.dataset.monthlyCampaign;
      state.monthlyEventId = "total";
      render();
    });
  });
  monthlyView.querySelectorAll("[data-monthly-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.monthlyEventId = button.dataset.monthlyTab;
      render();
    });
  });
};

render();
