const {
  loadOverrides,
  saveOverrides,
  resolveCampaignResultTargetEventIds,
} = require("../storage");

const shouldWrite = process.argv.includes("--write");
const dateFilter = getArgValue("--date");
const sourceFilter = getArgValue("--source");
const includeCampaignSources = process.argv.includes("--include-campaign-sources");
const createMissingTargets = process.argv.includes("--create-missing");

function main() {
  const overrides = loadOverrides();
  const events = overrides.events || {};
  const sourceEvents = Object.entries(events)
    .map(([eventId, event]) => ({ eventId, event, date: getEventDate(eventId, event) }))
    .filter(({ eventId, event, date }) => (
      date &&
      (!dateFilter || date === dateFilter) &&
      (!sourceFilter || eventId === sourceFilter) &&
      hasResults(event) &&
      (
        eventId.startsWith("imported-") ||
        includeCampaignSources &&
        (eventId.startsWith("campaign-") && getParticipantCount(event) === 0)
      )
    ));

  let targetEventsTouched = 0;
  let raceResultsCopied = 0;

  sourceEvents.forEach(({ eventId: sourceId, event: sourceEvent, date }) => {
    const targets = resolveCampaignResultTargetEventIds(overrides, date, {
      trackId: sourceEvent?.meta?.trackId || sourceEvent?.meta?.importedTrackId || "",
      trackName: sourceEvent?.meta?.trackName || "",
    });

    targets.forEach((target) => {
      if (target.eventId === sourceId) return;
      if (!createMissingTargets && !events[target.eventId]) return;

      const targetEvent = events[target.eventId] || {
        participants: [],
        results: {},
        meta: {},
      };
      targetEvent.results = targetEvent.results || {};

      let copiedForTarget = 0;
      Object.entries(sourceEvent.results || {}).forEach(([raceKey, sourceResult]) => {
        const race = String(sourceResult?.race || raceKey);
        const existing = targetEvent.results[race] || {};
        const merged = { ...sourceResult, ...existing };

        if (JSON.stringify(existing) !== JSON.stringify(merged)) {
          targetEvent.results[race] = merged;
          copiedForTarget += 1;
        }
      });

      if (copiedForTarget > 0) {
        targetEvent.meta = {
          ...(targetEvent.meta || {}),
          date,
          campaignId: target.campaignId,
          campaignType: target.campaignType,
          title: target.title,
          resultsBackfilledAt: new Date().toISOString(),
        };
        events[target.eventId] = targetEvent;
        targetEventsTouched += 1;
        raceResultsCopied += copiedForTarget;
        console.log(`${sourceId} -> ${target.eventId}: ${copiedForTarget} carrera(s)`);
      }
    });
  });

  if (shouldWrite && raceResultsCopied > 0) {
    overrides.events = events;
    saveOverrides(overrides);
  }

  console.log(JSON.stringify({
    mode: shouldWrite ? "write" : "dry-run",
    dateFilter: dateFilter || null,
    sourceFilter: sourceFilter || null,
    includeCampaignSources,
    createMissingTargets,
    sourceEvents: sourceEvents.length,
    targetEventsTouched,
    raceResultsCopied,
  }, null, 2));
}

function getArgValue(name) {
  const prefix = `${name}=`;
  const arg = process.argv.find((value) => value.startsWith(prefix));
  return arg ? arg.slice(prefix.length).trim() : "";
}

function getEventDate(eventId, event) {
  const raw = event?.meta?.date || event?.date || eventId;
  const ymd = String(raw || "").match(/(\d{4}-\d{2}-\d{2})/);
  return ymd ? ymd[1] : "";
}

function hasResults(event) {
  return Object.keys(event?.results || {}).length > 0;
}

function getParticipantCount(event) {
  return Array.isArray(event?.participants)
    ? event.participants.length
    : Object.keys(event?.participants || {}).length;
}

main();
