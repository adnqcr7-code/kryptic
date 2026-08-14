$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
  throw 'Kryptic requires Node.js 20 or newer. Install Node.js, then run this script again.'
}
node src/cli.js start
