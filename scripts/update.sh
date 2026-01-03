#!/bin/bash

# Script para atualizar o Sistema Financeiro no servidor
# Uso: ./scripts/update.sh [--no-restart] [--no-build]
# 
# Opções:
#   --no-restart: Não reinicia o serviço após a atualização
#   --no-build: Não executa o build (útil para atualizações rápidas)

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Flags
NO_RESTART=false
NO_BUILD=false

# Processar argumentos
for arg in "$@"; do
    case $arg in
        --no-restart)
            NO_RESTART=true
            shift
            ;;
        --no-build)
            NO_BUILD=true
            shift
            ;;
        *)
            # Argumento desconhecido
            ;;
    esac
done

echo "=========================================="
echo "  Atualização do Sistema Financeiro"
echo "=========================================="
echo ""

# Descobrir diretório do projeto
if [ -f ".env" ]; then
    PROJECT_DIR=$(pwd)
elif [ -f "../.env" ]; then
    PROJECT_DIR=$(cd .. && pwd)
else
    echo -e "${RED}Erro: Arquivo .env não encontrado${NC}"
    echo "Execute este script a partir do diretório do projeto"
    exit 1
fi

cd "$PROJECT_DIR"
echo -e "${BLUE}Diretório do projeto: $PROJECT_DIR${NC}"
echo ""

# Verificar se é um repositório git
if [ ! -d ".git" ]; then
    echo -e "${RED}Erro: Este diretório não é um repositório Git${NC}"
    exit 1
fi

# Verificar se o serviço systemd existe
SERVICE_NAME="financeiro"
if systemctl list-unit-files | grep -q "${SERVICE_NAME}.service"; then
    SERVICE_EXISTS=true
    echo -e "${GREEN}Serviço systemd detectado: ${SERVICE_NAME}.service${NC}"
else
    SERVICE_EXISTS=false
    echo -e "${YELLOW}Aviso: Serviço systemd não encontrado. O serviço não será reiniciado automaticamente.${NC}"
fi

# Passo 1: Verificar status do Git
echo -e "${GREEN}[1/7]${NC} Verificando status do Git..."
git status --short || true
echo ""

# Passo 2: Buscar atualizações do GitHub
echo -e "${GREEN}[2/7]${NC} Buscando atualizações do GitHub..."
if git fetch origin; then
    echo -e "${GREEN}  Fetch executado com sucesso ✓${NC}"
else
    echo -e "${RED}  Erro ao executar git fetch${NC}"
    exit 1
fi
echo ""

# Passo 3: Verificar se há atualizações
echo -e "${GREEN}[3/7]${NC} Verificando se há atualizações disponíveis..."
LOCAL=$(git rev-parse @)
REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
BASE=$(git merge-base @ @{u} 2>/dev/null || echo "")

if [ -z "$REMOTE" ]; then
    echo -e "${YELLOW}  Aviso: Branch de rastreamento não configurado${NC}"
    echo "  Tentando pull direto da branch main..."
    BRANCH=$(git branch --show-current)
    echo "  Branch atual: $BRANCH"
elif [ "$LOCAL" = "$REMOTE" ]; then
    echo -e "${GREEN}  Sistema já está atualizado ✓${NC}"
    if [ "$NO_BUILD" = false ] && [ "$SERVICE_EXISTS" = true ]; then
        echo ""
        read -p "Deseja fazer rebuild mesmo assim? (s/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Ss]$ ]]; then
            echo -e "${BLUE}Atualização cancelada pelo usuário${NC}"
            exit 0
        fi
    else
        echo -e "${BLUE}Nenhuma atualização necessária${NC}"
        exit 0
    fi
elif [ "$LOCAL" = "$BASE" ]; then
    echo -e "${GREEN}  Atualizações disponíveis!${NC}"
    NEEDS_UPDATE=true
elif [ "$REMOTE" = "$BASE" ]; then
    echo -e "${YELLOW}  Você tem commits locais não enviados${NC}"
    read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${BLUE}Atualização cancelada pelo usuário${NC}"
        exit 0
    fi
    NEEDS_UPDATE=true
else
    echo -e "${YELLOW}  Divergência detectada entre local e remoto${NC}"
    read -p "Deseja continuar? Isso pode causar conflitos. (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${BLUE}Atualização cancelada pelo usuário${NC}"
        exit 0
    fi
    NEEDS_UPDATE=true
fi

# Passo 4: Parar o serviço (se existir)
if [ "$SERVICE_EXISTS" = true ] && [ "$NO_RESTART" = false ]; then
    echo -e "${GREEN}[4/7]${NC} Parando o serviço..."
    if sudo systemctl stop "${SERVICE_NAME}.service"; then
        echo -e "${GREEN}  Serviço parado com sucesso ✓${NC}"
    else
        echo -e "${YELLOW}  Aviso: Não foi possível parar o serviço (pode não estar rodando)${NC}"
    fi
    echo ""
else
    echo -e "${YELLOW}[4/7]${NC} Pulando parada do serviço (--no-restart ou serviço não encontrado)"
    echo ""
fi

# Passo 5: Fazer pull das atualizações
if [ "$NEEDS_UPDATE" = true ]; then
    echo -e "${GREEN}[5/7]${NC} Baixando atualizações do GitHub..."
    BRANCH=$(git branch --show-current)
    if git pull origin "$BRANCH" || git pull origin main; then
        echo -e "${GREEN}  Pull executado com sucesso ✓${NC}"
    else
        echo -e "${RED}  Erro ao executar git pull${NC}"
        echo "  Tentando restaurar o serviço..."
        if [ "$SERVICE_EXISTS" = true ] && [ "$NO_RESTART" = false ]; then
            sudo systemctl start "${SERVICE_NAME}.service" || true
        fi
        exit 1
    fi
    echo ""
else
    echo -e "${GREEN}[5/7]${NC} Pulando pull (sem atualizações ou rebuild forçado)"
    echo ""
fi

# Passo 6: Instalar dependências e fazer build
if [ "$NO_BUILD" = false ]; then
    echo -e "${GREEN}[6/7]${NC} Instalando dependências e fazendo build..."
    
    # Instalar dependências
    echo "  Instalando dependências npm..."
    if npm install; then
        echo -e "${GREEN}  Dependências instaladas com sucesso ✓${NC}"
    else
        echo -e "${RED}  Erro ao instalar dependências${NC}"
        if [ "$SERVICE_EXISTS" = true ] && [ "$NO_RESTART" = false ]; then
            sudo systemctl start "${SERVICE_NAME}.service" || true
        fi
        exit 1
    fi
    
    # Gerar cliente Prisma
    echo "  Gerando cliente Prisma..."
    if npm run db:generate; then
        echo -e "${GREEN}  Cliente Prisma gerado com sucesso ✓${NC}"
    else
        echo -e "${YELLOW}  Aviso: Erro ao gerar cliente Prisma${NC}"
    fi
    
    # Executar migrações do banco (se necessário)
    echo "  Verificando migrações do banco de dados..."
    if npm run db:migrate; then
        echo -e "${GREEN}  Migrações executadas com sucesso ✓${NC}"
    else
        echo -e "${YELLOW}  Aviso: Erro ao executar migrações (pode não ser necessário)${NC}"
    fi
    
    # Fazer build
    echo "  Fazendo build da aplicação..."
    if npm run build; then
        echo -e "${GREEN}  Build executado com sucesso ✓${NC}"
    else
        echo -e "${RED}  Erro ao fazer build${NC}"
        if [ "$SERVICE_EXISTS" = true ] && [ "$NO_RESTART" = false ]; then
            sudo systemctl start "${SERVICE_NAME}.service" || true
        fi
        exit 1
    fi
    echo ""
else
    echo -e "${YELLOW}[6/7]${NC} Pulando build (--no-build especificado)"
    echo ""
fi

# Passo 7: Reiniciar o serviço
if [ "$SERVICE_EXISTS" = true ] && [ "$NO_RESTART" = false ]; then
    echo -e "${GREEN}[7/7]${NC} Reiniciando o serviço..."
    if sudo systemctl restart "${SERVICE_NAME}.service"; then
        echo -e "${GREEN}  Serviço reiniciado com sucesso ✓${NC}"
        
        # Aguardar um pouco e verificar status
        sleep 2
        if sudo systemctl is-active --quiet "${SERVICE_NAME}.service"; then
            echo -e "${GREEN}  Serviço está rodando corretamente ✓${NC}"
        else
            echo -e "${YELLOW}  Aviso: Serviço pode não estar rodando. Verifique com: sudo systemctl status ${SERVICE_NAME}.service${NC}"
        fi
    else
        echo -e "${RED}  Erro ao reiniciar o serviço${NC}"
        echo "  Verifique os logs com: sudo journalctl -u ${SERVICE_NAME}.service -n 50"
        exit 1
    fi
    echo ""
else
    echo -e "${YELLOW}[7/7]${NC} Pulando reinicialização do serviço (--no-restart ou serviço não encontrado)"
    echo ""
    if [ "$NO_RESTART" = false ]; then
        echo -e "${BLUE}  Você pode iniciar o serviço manualmente com:${NC}"
        echo "    sudo systemctl start ${SERVICE_NAME}.service"
        echo "  Ou iniciar manualmente com:"
        echo "    npm start"
    fi
    echo ""
fi

# Resumo final
echo "=========================================="
echo -e "${GREEN}Atualização concluída com sucesso!${NC}"
echo "=========================================="
echo ""

if [ "$SERVICE_EXISTS" = true ]; then
    echo "Status do serviço:"
    sudo systemctl status "${SERVICE_NAME}.service" --no-pager -l | head -n 15 || true
    echo ""
fi

echo "Comandos úteis:"
echo "  Ver status:     sudo systemctl status ${SERVICE_NAME}.service"
echo "  Ver logs:       sudo journalctl -u ${SERVICE_NAME}.service -f"
echo "  Reiniciar:      sudo systemctl restart ${SERVICE_NAME}.service"
echo ""

