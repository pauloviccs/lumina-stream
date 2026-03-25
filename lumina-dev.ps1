Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Caminho do BAT
$batPath = "G:\GitHub\Vibecoding\VICCS_Git\VICCS_Websites\VICCS_Channels\lumina-stream\run-dev.bat"

# Processo global
$global:process = $null

function Start-Dev {
    if ($global:process -eq $null -or $global:process.HasExited) {
        $global:process = Start-Process "cmd.exe" -ArgumentList "/k `"$batPath`"" -WindowStyle Hidden -PassThru
    }
}

function Stop-Dev {
    if ($global:process -ne $null -and !$global:process.HasExited) {
        $global:process.Kill()
        $global:process = $null
    }
}

function Restart-Dev {
    Stop-Dev
    Start-Sleep -Seconds 1
    Start-Dev
}

function Show-Console {
    Start-Process "cmd.exe" -ArgumentList "/k `"$batPath`""
}

# =========================
# FORM (janela controladora)
# =========================
$form = New-Object System.Windows.Forms.Form
$form.Text = "Lumina Dev"
$form.Size = New-Object System.Drawing.Size(300,150)
$form.StartPosition = "CenterScreen"

# Botão abrir console
$btnOpen = New-Object System.Windows.Forms.Button
$btnOpen.Text = "Abrir Console"
$btnOpen.Size = New-Object System.Drawing.Size(120,30)
$btnOpen.Location = New-Object System.Drawing.Point(30,30)
$btnOpen.Add_Click({ Show-Console })

# Botão reiniciar
$btnRestart = New-Object System.Windows.Forms.Button
$btnRestart.Text = "Reiniciar"
$btnRestart.Size = New-Object System.Drawing.Size(120,30)
$btnRestart.Location = New-Object System.Drawing.Point(150,30)
$btnRestart.Add_Click({ Restart-Dev })

$form.Controls.Add($btnOpen)
$form.Controls.Add($btnRestart)

# =========================
# TRAY ICON
# =========================
$tray = New-Object System.Windows.Forms.NotifyIcon
$tray.Icon = [System.Drawing.SystemIcons]::Application
$tray.Text = "Lumina Dev Server"
$tray.Visible = $true

# Menu tray
$menu = New-Object System.Windows.Forms.ContextMenuStrip
$menu.Items.Add("Abrir").Add_Click({
    $form.Show()
    $form.WindowState = "Normal"
})

$menu.Items.Add("Reiniciar").Add_Click({ Restart-Dev })
$menu.Items.Add("Parar").Add_Click({ Stop-Dev })

$menu.Items.Add("Sair").Add_Click({
    Stop-Dev
    $tray.Visible = $false
    $form.Close()
})

$tray.ContextMenuStrip = $menu

# Duplo clique no tray abre janela
$tray.Add_DoubleClick({
    $form.Show()
    $form.WindowState = "Normal"
})

# =========================
# MINIMIZAR PARA TRAY
# =========================
$form.Add_Resize({
    if ($form.WindowState -eq "Minimized") {
        $form.Hide()
    }
})

# Ao fechar, vai pro tray ao invés de encerrar
$form.Add_FormClosing({
    if ($_.CloseReason -ne "ApplicationExitCall") {
        $_.Cancel = $true
        $form.Hide()
    }
})

# =========================
# START
# =========================
Start-Dev
[System.Windows.Forms.Application]::Run($form)