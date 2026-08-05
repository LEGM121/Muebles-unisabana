    Write-Host "Deteniendo contenedores..."
docker compose down

Write-Host "Construyendo proyecto..."
docker compose up --build -d

Write-Host ""
Write-Host "Esperando que los servicios inicien..."
Start-Sleep -Seconds 20

$urls = @(
    "http://localhost:8081/health",
    "http://localhost:9090/health"
)

foreach ($url in $urls)
{
    try
    {
        Invoke-RestMethod $url | Out-Null
        Write-Host "✓ $url"
    }
    catch
    {
        Write-Host "✗ $url"
    }
}

Write-Host ""
Write-Host "Proyecto iniciado."