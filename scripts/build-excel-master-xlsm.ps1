param(
  [Parameter(Mandatory=$true)]
  [string]$InputXlsx,

  [Parameter(Mandatory=$true)]
  [string]$OutputXlsm,

  [Parameter(Mandatory=$true)]
  [string]$ProjectRoot,

  [Parameter(Mandatory=$true)]
  [string]$VbaModulePath
)

$ErrorActionPreference = "Stop"

$resolvedInput = (Resolve-Path -LiteralPath $InputXlsx).Path
$resolvedRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$resolvedVbaModule = (Resolve-Path -LiteralPath $VbaModulePath).Path
$resolvedOutput = [System.IO.Path]::GetFullPath($OutputXlsm)

if (Test-Path -LiteralPath $resolvedOutput) {
  Remove-Item -LiteralPath $resolvedOutput -Force
}

function Add-Button {
  param(
    [object]$Sheet,
    [double]$Left,
    [double]$Top,
    [double]$Width,
    [double]$Height,
    [string]$Caption,
    [string]$MacroName
  )

  $button = $Sheet.Buttons().Add($Left, $Top, $Width, $Height)
  $button.Caption = $Caption
  $button.OnAction = $MacroName
  $button.Font.Bold = $true
}

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

try {
  $workbook = $excel.Workbooks.Open($resolvedInput)

  $moduleCode = Get-Content -LiteralPath $resolvedVbaModule -Raw
  $moduleCode = $moduleCode.Replace("__PROJECT_ROOT__", $resolvedRoot.Replace("""", """"""))
  $moduleCode = $moduleCode.Replace("__MASTER_XLSM__", $resolvedOutput.Replace("""", """"""))

  $component = $workbook.VBProject.VBComponents.Add(1)
  $component.Name = "PollaAutomation"
  $component.CodeModule.AddFromString($moduleCode)

  $sheet = $workbook.Worksheets.Item("Ingreso Picks")
  Add-Button $sheet 690 92 170 28 "Guardar Picks Rapido" "ProcesarPicks"
  Add-Button $sheet 870 92 170 28 "Actualizar Resultados" "ActualizarResultados"
  Add-Button $sheet 1050 92 150 28 "Regenerar Libro" "RegenerarLibro"

  $workbook.SaveAs($resolvedOutput, 52)
  $workbook.Close($false)
} finally {
  if ($workbook) {
    try { $workbook.Close($false) } catch {}
  }
  $excel.Quit()
  [System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) | Out-Null
}
