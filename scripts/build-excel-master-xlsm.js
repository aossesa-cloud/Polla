const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const { buildMasterWorkbook } = require("./build-excel-master");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(ROOT, "outputs");
const DEFAULT_XLSM = path.join(OUTPUT_DIR, "Libro Maestro Polla Hipica Compacto.xlsm");
const TEMP_XLSX = path.join(OUTPUT_DIR, "__macro_source.xlsx");
const POWERSHELL_SCRIPT = path.join(__dirname, "build-excel-master-xlsm.ps1");
const VBA_MODULE = path.join(__dirname, "vba", "PollaAutomation.bas");

async function buildMacroWorkbook(outputPath = DEFAULT_XLSM) {
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await buildMasterWorkbook(TEMP_XLSX, outputPath);

  const result = spawnSync("powershell", [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    POWERSHELL_SCRIPT,
    "-InputXlsx",
    TEMP_XLSX,
    "-OutputXlsm",
    outputPath,
    "-ProjectRoot",
    ROOT,
    "-VbaModulePath",
    VBA_MODULE,
  ], {
    cwd: ROOT,
    encoding: "utf8",
  });

  if (result.status !== 0) {
    throw new Error([
      "No se pudo generar el .xlsm macro-habilitado.",
      result.stdout,
      result.stderr,
    ].filter(Boolean).join("\n"));
  }

  if (fs.existsSync(TEMP_XLSX)) fs.unlinkSync(TEMP_XLSX);
  return outputPath;
}

if (require.main === module) {
  const outputArg = process.argv.find((arg) => arg.startsWith("--out="));
  const outputPath = outputArg ? path.resolve(outputArg.slice("--out=".length)) : DEFAULT_XLSM;
  buildMacroWorkbook(outputPath)
    .then((filePath) => {
      console.log(`Libro Maestro macro-habilitado generado: ${filePath}`);
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}

module.exports = { buildMacroWorkbook };
