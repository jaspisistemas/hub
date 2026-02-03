param($token)

if (-not $token) {
  Write-Error "Token required as parameter"
  exit 1
}

$products = @(
  @{sku="SKU002"; name="Fone Bluetooth"; price=299.99; quantity=120; category="Acessórios"},
  @{sku="SKU003"; name="Carregador Rápido"; price=89.99; quantity=85; category="Acessórios"},
  @{sku="SKU004"; name="Cabo USB-C"; price=29.99; quantity=200; category="Acessórios"},
  @{sku="SKU005"; name="Tablet 10 polegadas"; price=899.99; quantity=30; category="Eletrônicos"}
)

$headers = @{
  "Content-Type" = "application/json"
  "Authorization" = "Bearer $token"
}

foreach ($product in $products) {
  $body = $product | ConvertTo-Json
  $response = Invoke-WebRequest -Uri "http://localhost:3000/products" -Method POST -Headers $headers -Body $body
  Write-Host "✅ Produto '$($product.name)' criado"
}

Write-Host "`n✨ Todos os produtos foram criados com sucesso!"
