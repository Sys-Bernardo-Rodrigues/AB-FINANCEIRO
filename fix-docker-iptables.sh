#!/bin/bash

# Script para corrigir problemas de iptables do Docker
# Execute com: sudo bash fix-docker-iptables.sh

echo "🔧 Corrigindo problemas de iptables do Docker..."

# Parar o Docker
echo "⏹️  Parando o serviço Docker..."
sudo systemctl stop docker
sudo systemctl stop docker.socket

# Limpar as regras do iptables relacionadas ao Docker
echo "🧹 Limpando regras antigas do iptables..."
sudo iptables -t filter -F DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
sudo iptables -t filter -F DOCKER-ISOLATION-STAGE-2 2>/dev/null || true
sudo iptables -t filter -X DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
sudo iptables -t filter -X DOCKER-ISOLATION-STAGE-2 2>/dev/null || true
sudo iptables -t filter -F DOCKER 2>/dev/null || true
sudo iptables -t filter -X DOCKER 2>/dev/null || true

# Limpar redes Docker antigas (opcional, mas recomendado)
echo "🧹 Removendo redes Docker antigas..."
sudo docker network prune -f 2>/dev/null || true

# Iniciar o Docker novamente
echo "▶️  Reiniciando o serviço Docker..."
sudo systemctl start docker

# Aguardar o Docker inicializar
sleep 3

# Verificar se o Docker está funcionando
echo "🔍 Verificando status do Docker..."
if sudo docker info > /dev/null 2>&1; then
    echo "✅ Docker está funcionando corretamente!"
    echo ""
    echo "Agora você pode executar: npm run docker:up"
else
    echo "❌ Ainda há problemas com o Docker."
    echo "Tente executar: sudo systemctl restart docker"
fi

