# =====================================================================
# Ativa a integração Clube RefriOne -> Refriclube
# Rode no PowerShell, dentro da pasta do clube-refrione:
#   .\scripts\ativar-integracao-refriclube.ps1 -PastaRefriclube "C:\caminho\refri-clube-hub"
#
# O que faz:
#  1. Gera um token secreto novo (não aparece na tela nem vai para o GitHub)
#  2. Cadastra o token como secret nos dois projetos Supabase
#  3. Publica a função do clube (sincronizar-refriclube)
#  4. Publica a função do Refriclube (parceiro-acesso)
#  5. Aplica a migração 003 do banco do clube
# Pode ser rodado de novo: gera outro token e atualiza os dois lados juntos.
# =====================================================================
param(
  [Parameter(Mandatory = $true)][string]$PastaRefriclube
)
$ErrorActionPreference = 'Stop'

$REF_REFRICLUBE = 'hyxxkkpirdeijfjvfrpk'
$REF_CLUBE = 'lrcwurytmqzoyedxdljo'

if (-not (Test-Path (Join-Path $PastaRefriclube 'supabase\functions'))) {
  throw "Não encontrei supabase\functions em '$PastaRefriclube'. Confira o caminho do projeto do Refriclube."
}

Write-Host '1/5 Gerando token secreto...' -ForegroundColor Cyan
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
$token = -join ($bytes | ForEach-Object { $_.ToString('x2') })

Write-Host '2/5 Cadastrando o token nos dois projetos...' -ForegroundColor Cyan
npx supabase secrets set "PARCEIROS_TOKENS=refrione:$token" --project-ref $REF_REFRICLUBE
if ($LASTEXITCODE -ne 0) { throw 'Falha ao cadastrar o secret no Refriclube.' }
npx supabase secrets set "REFRICLUBE_PARCEIRO_TOKEN=$token" --project-ref $REF_CLUBE
if ($LASTEXITCODE -ne 0) { throw 'Falha ao cadastrar o secret no Clube.' }
Remove-Variable token, bytes

Write-Host '3/5 Publicando a função do Clube...' -ForegroundColor Cyan
npx supabase functions deploy sincronizar-refriclube --project-ref $REF_CLUBE
if ($LASTEXITCODE -ne 0) { throw 'Falha ao publicar sincronizar-refriclube.' }

Write-Host '4/5 Publicando a função do Refriclube...' -ForegroundColor Cyan
Push-Location $PastaRefriclube
try {
  git pull
  npx supabase functions deploy parceiro-acesso --project-ref $REF_REFRICLUBE --no-verify-jwt
  if ($LASTEXITCODE -ne 0) { throw 'Falha ao publicar parceiro-acesso.' }
} finally {
  Pop-Location
}

Write-Host '5/5 Aplicando a migração do banco do Clube...' -ForegroundColor Cyan
npx supabase db push
if ($LASTEXITCODE -ne 0) { throw 'Falha ao aplicar a migração 003. Rode "npx supabase db push" de novo e veja a mensagem.' }

Write-Host ''
Write-Host 'Pronto. Falta só rodar a migração 092 no SQL Editor do Refriclube (ver instruções).' -ForegroundColor Green
