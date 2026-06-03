Option Explicit

Private Const PROJECT_ROOT As String = "__PROJECT_ROOT__"
Private Const MASTER_XLSM As String = "__MASTER_XLSM__"

Public Sub ProcesarPicks()
    RunQuickPicks
End Sub

Public Sub ActualizarResultados()
    RunAutomation "excel:update", "Actualizando resultados y regenerando el libro..."
End Sub

Private Sub RunQuickPicks()
    Dim shell As Object
    Dim command As String
    Dim logPath As String
    Dim statusPath As String
    Dim exitCode As Long
    Dim statusText As String

    ThisWorkbook.Save
    logPath = PROJECT_ROOT & "\outputs\excel-automation.log"
    statusPath = PROJECT_ROOT & "\outputs\excel-picks-status.json"

    On Error Resume Next
    Kill statusPath
    On Error GoTo 0

    With ThisWorkbook.Worksheets("Ingreso Picks")
        .Range("I6").Value = "SI"
        .Range("I31").Value = "Procesando picks..."
        .Range("I31").Font.Color = RGB(88, 166, 255)
    End With

    command = "cmd /c " & _
        "cd /d """ & PROJECT_ROOT & """ && " & _
        "node scripts\import-picks-from-excel.js --file=""" & MASTER_XLSM & """ --status-file=""" & statusPath & """ > """ & logPath & """ 2>&1"

    Set shell = CreateObject("WScript.Shell")
    exitCode = shell.Run(command, 0, True)

    statusText = BuildStatusText(statusPath, exitCode)
    With ThisWorkbook.Worksheets("Ingreso Picks")
        .Range("I31").Value = statusText
        .Range("I31").WrapText = True
        .Range("I31").Font.Color = IIf(exitCode = 0 And InStr(1, statusText, "ERROR", vbTextCompare) = 0, RGB(34, 197, 94), RGB(248, 113, 113))
    End With

    If exitCode <> 0 Or InStr(1, statusText, "ERROR", vbTextCompare) > 0 Then
        MsgBox statusText & vbCrLf & vbCrLf & "Detalle tecnico: " & logPath, vbExclamation, "Polla Hipica"
    End If
End Sub

Public Sub RegenerarLibro()
    RunAutomation "excel:build", "Regenerando el libro maestro..."
End Sub

Private Sub RunAutomation(ByVal npmScript As String, ByVal message As String)
    Dim shell As Object
    Dim command As String
    Dim logPath As String

    ThisWorkbook.Save
    logPath = PROJECT_ROOT & "\outputs\excel-automation.log"

    MsgBox message & vbCrLf & vbCrLf & _
        "Excel cerrara este libro unos segundos, ejecutara el proceso y lo volvera a abrir.", _
        vbInformation, "Polla Hipica"

    command = "cmd /c " & _
        "timeout /t 2 /nobreak > nul && " & _
        "cd /d """ & PROJECT_ROOT & """ && " & _
        "npm run " & npmScript & " > """ & logPath & """ 2>&1 && " & _
        "start """" """ & MASTER_XLSM & """"

    Set shell = CreateObject("WScript.Shell")
    shell.Run command, 1, False
    ThisWorkbook.Close SaveChanges:=False
End Sub

Private Function BuildStatusText(ByVal statusPath As String, ByVal exitCode As Long) As String
    Dim raw As String
    Dim status As String
    Dim notes As String
    Dim destinations As String
    Dim importedRows As String
    Dim importedParticipants As String

    raw = ReadTextFile(statusPath)
    If Len(raw) = 0 Then
        BuildStatusText = "ERROR" & vbCrLf & "No se pudo leer el estado del proceso."
        Exit Function
    End If

    status = JsonFirstString(raw, "status")
    notes = JsonFirstString(raw, "notes")
    destinations = JsonFirstString(raw, "destinations")
    importedRows = JsonFirstNumber(raw, "importedRows")
    importedParticipants = JsonFirstNumber(raw, "importedParticipants")

    If Len(status) = 0 Then
        status = IIf(exitCode = 0 And importedRows <> "0", "OK", "ERROR")
    End If

    BuildStatusText = status
    If Len(destinations) > 0 Then BuildStatusText = BuildStatusText & " | " & destinations
    If Len(notes) > 0 Then BuildStatusText = BuildStatusText & vbCrLf & notes
    If Len(importedRows) > 0 Then BuildStatusText = BuildStatusText & vbCrLf & "Filas: " & importedRows & " | Participantes/destinos: " & importedParticipants
End Function

Private Function ReadTextFile(ByVal filePath As String) As String
    Dim fso As Object
    Dim file As Object
    Set fso = CreateObject("Scripting.FileSystemObject")
    If Not fso.FileExists(filePath) Then
        ReadTextFile = ""
        Exit Function
    End If
    Set file = fso.OpenTextFile(filePath, 1, False)
    ReadTextFile = file.ReadAll
    file.Close
End Function

Private Function JsonFirstString(ByVal raw As String, ByVal key As String) As String
    Dim regex As Object
    Dim matches As Object
    Set regex = CreateObject("VBScript.RegExp")
    regex.Pattern = """" & key & """\s*:\s*""([^""]*)"""
    regex.Global = False
    regex.IgnoreCase = True
    Set matches = regex.Execute(raw)
    If matches.Count = 0 Then
        JsonFirstString = ""
    Else
        JsonFirstString = Replace(matches(0).SubMatches(0), "\n", vbCrLf)
    End If
End Function

Private Function JsonFirstNumber(ByVal raw As String, ByVal key As String) As String
    Dim regex As Object
    Dim matches As Object
    Set regex = CreateObject("VBScript.RegExp")
    regex.Pattern = """" & key & """\s*:\s*(\d+)"
    regex.Global = False
    regex.IgnoreCase = True
    Set matches = regex.Execute(raw)
    If matches.Count = 0 Then
        JsonFirstNumber = ""
    Else
        JsonFirstNumber = matches(0).SubMatches(0)
    End If
End Function
