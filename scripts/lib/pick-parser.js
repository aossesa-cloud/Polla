function normalizeBulkPasteText(rawText) {
  return String(rawText || "")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\t/g, " ")
    .trim();
}

function extractNumbers(token) {
  const matches = String(token || "").match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

function isSimpleLine(line) {
  return /^\s*\d+([\s,;|]+\d+)+\s*$/.test(String(line || "").trim());
}

function isIndexedFormat(line) {
  const trimmed = String(line || "").trim();
  if (isSimpleLine(trimmed)) return false;
  return /^[\d]+[.)=@:a-zA-Z]+\s*\d+/i.test(trimmed) ||
    /^[\d]+[.)=@:a-zA-Z]+\d+/.test(trimmed);
}

function isMultiStudSeparator(line) {
  return /^[\d\s]+[-/+][\d\s]+$/.test(String(line || "").trim());
}

function parseMultiStudLine(line) {
  const trimmed = String(line || "").trim();
  for (const separator of ["-", "/", "+"]) {
    if (!trimmed.includes(separator)) continue;
    const parts = trimmed.split(separator).map((part) => part.trim());
    if (parts.length !== 2) continue;

    const first = extractNumbers(parts[0]);
    const second = extractNumbers(parts[1]);
    if (first.length && second.length) return [String(first[0]), String(second[0])];
  }
  return null;
}

function parseIndexedLine(line) {
  const values = extractNumbers(line);
  if (values.length >= 2) return String(values[values.length - 1]);
  if (values.length === 1) return String(values[0]);
  return "";
}

function createParseResult(first = [], second = [], format = "empty", expectedRaces = 12) {
  const raceCount = Math.max(first.length, second.length);
  const warnings = [];
  if (raceCount && expectedRaces && raceCount !== expectedRaces) {
    warnings.push(`Se detectaron ${raceCount} carreras (esperadas: ${expectedRaces})`);
  }
  return {
    studCount: second.some(Boolean) ? 2 : (first.some(Boolean) ? 1 : 0),
    studs: second.some(Boolean) ? [first, second] : [first],
    first,
    second,
    format,
    raceCount,
    warnings,
    isValid: first.some(Boolean) || second.some(Boolean),
  };
}

function parsePicks(rawText, expectedRaces = 12) {
  const normalized = normalizeBulkPasteText(rawText);
  if (!normalized) return createParseResult([], [], "empty", expectedRaces);

  const lines = normalized
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.some(isMultiStudSeparator)) {
    const first = [];
    const second = [];
    lines.forEach((line) => {
      const pair = parseMultiStudLine(line);
      if (pair) {
        first.push(pair[0]);
        second.push(pair[1]);
        return;
      }

      const values = extractNumbers(line);
      if (values.length) {
        first.push(String(values[0]));
        second.push("");
      }
    });
    return createParseResult(first, second, "multi-stud", expectedRaces);
  }

  if (lines.some(isSimpleLine)) {
    const first = [];
    lines.forEach((line) => {
      if (isSimpleLine(line)) {
        line
          .split(/[\s,;|]+/)
          .map((token) => token.trim())
          .filter(Boolean)
          .forEach((token) => {
            const values = extractNumbers(token);
            if (values.length) first.push(String(values[0]));
          });
        return;
      }

      const values = extractNumbers(line);
      if (values.length) first.push(String(values[0]));
    });
    return createParseResult(first, [], "simple", expectedRaces);
  }

  if (lines.some(isIndexedFormat)) {
    const first = lines.map(parseIndexedLine).filter(Boolean);
    return createParseResult(first, [], "indexed", expectedRaces);
  }

  if (lines.length > 1) {
    const first = lines
      .map((line) => {
        const values = extractNumbers(line);
        return values.length ? String(values[0]) : "";
      })
      .filter(Boolean);
    return createParseResult(first, [], "vertical", expectedRaces);
  }

  const first = lines[0]
    .split(/[\s,;|]+/)
    .map((token) => {
      const values = extractNumbers(token);
      return values.length ? String(values[0]) : "";
    })
    .filter(Boolean);
  return createParseResult(first, [], "simple", expectedRaces);
}

function fitToRaceCount(values, raceCount) {
  const output = Array.from({ length: raceCount }, () => "");
  values.slice(0, raceCount).forEach((value, index) => {
    output[index] = value;
  });
  return output;
}

function parseBulkPickPayload(rawText, raceCount) {
  const raceLimit = Math.min(Number(raceCount) || 0, 30);
  const parsed = parsePicks(rawText, raceLimit || 12);
  return {
    first: fitToRaceCount(parsed.first || [], raceLimit),
    second: fitToRaceCount(parsed.second || [], raceLimit),
    meta: {
      studCount: parsed.studCount,
      format: parsed.format,
      raceCount: parsed.raceCount,
      warnings: parsed.warnings,
      isValid: parsed.isValid,
    },
  };
}

module.exports = {
  normalizeBulkPasteText,
  parseBulkPickPayload,
  parsePicks,
};
