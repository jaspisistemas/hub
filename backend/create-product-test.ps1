$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImJiY2EwZGU3LTZkNWMtNDAxZS05Y2M2LTk0NWRjYTJkOTY0MiIsImVtYWlsIjoiYWRtaW5AYWRtaW4uY29tIiwiaWF0IjoxNzM4ODUzNTk1LCJleHAiOjE3Mzg5Mzk5OTV9.BjNcKuFRINFbKbxI-pDiG7f-y4hYHa4F8uQe_7MqJQE"
    "Content-Type" = "application/json"
}

$body = @{
    name = "Notebook Dell Inspiron 15 3000"
    description = "Notebook Dell com processador Intel Core i5, 8GB RAM, SSD 256GB, tela 15.6 polegadas Full HD"
    price = 3499.90
    sku = "DELL-INS-15-3000"
    quantity = 25
    category = "Eletrônicos"
    brand = "Dell"
    model = "Inspiron 15 3000"
} | ConvertTo-Json

Write-Host "Criando produto..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/products" -Method POST -Headers $headers -Body $body
    Write-Host "✅ Produto criado com sucesso!" -ForegroundColor Green
    Write-Host "ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "Nome: $($response.name)" -ForegroundColor Cyan
    Write-Host "SKU: $($response.sku)" -ForegroundColor Cyan
    Write-Host "Preço: R$ $($response.price)" -ForegroundColor Cyan
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "❌ Erro ao criar produto" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $result = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($result)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Detalhes do erro:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Yellow
    }
}
