param([Parameter(Mandatory=$true)][string]$Target,[string]$IDE="all")
$root = Split-Path -Parent $PSScriptRoot
node (Join-Path $root "packages/cli/index.mjs") install --target $Target --ide $IDE
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
