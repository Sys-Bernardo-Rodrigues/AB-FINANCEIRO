#!/bin/bash

# Script para configurar o Sistema Financeiro como serviço systemd no AlmaLinux
# Uso: sudo ./scripts/setup-service.sh

set -e  # Parar em caso de erro

echo "=========================================="
echo "  Configuração do Serviço Systemd"
echo "  Sistema Financeiro - Next.js"
echo "=========================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Erro: Este script precisa ser executado como root (use sudo)${NC}"
    exit 1
fi

# Descobrir informações do sistema
echo -e "${GREEN}[1/8]${NC} Coletando informações do sistema..."

# Descobrir usuário atual (não root)
if [ -z "$SUDO_USER" ]; then
    echo -e "${RED}Erro: Execute este script com sudo (sudo ./scripts/setup-service.sh)${NC}"
    exit 1
fi

SERVICE_USER="$SUDO_USER"
echo "  Usuário do serviço: $SERVICE_USER"

# Descobrir diretório do projeto
if [ -f ".env" ]; then
    PROJECT_DIR=$(pwd)
elif [ -f "../.env" ]; then
    PROJECT_DIR=$(cd .. && pwd)
else
    echo -e "${YELLOW}Aviso: Arquivo .env não encontrado no diretório atual${NC}"
    read -p "Digite o caminho completo do diretório do projeto: " PROJECT_DIR
    if [ ! -d "$PROJECT_DIR" ]; then
        echo -e "${RED}Erro: Diretório não existe: $PROJECT_DIR${NC}"
        exit 1
    fi
fi

echo "  Diretório do projeto: $PROJECT_DIR"

# Verificar se o diretório existe
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Erro: Diretório não existe: $PROJECT_DIR${NC}"
    exit 1
fi

# Verificar se .env existe
if [ ! -f "$PROJECT_DIR/.env" ]; then
    echo -e "${RED}Erro: Arquivo .env não encontrado em $PROJECT_DIR${NC}"
    echo "  Execute 'npm run ports:generate' primeiro para criar o .env"
    exit 1
fi

# Descobrir caminho do npm
echo -e "${GREEN}[2/8]${NC} Descobrindo caminhos dos executáveis..."

# Tentar como usuário do serviço (não root)
NPM_PATH=$(sudo -u "$SERVICE_USER" which npm 2>/dev/null || echo "")
if [ -z "$NPM_PATH" ]; then
    NPM_PATH=$(which npm 2>/dev/null || echo "")
fi

if [ -z "$NPM_PATH" ]; then
    echo -e "${RED}Erro: npm não encontrado no PATH${NC}"
    exit 1
fi

echo "  npm encontrado em: $NPM_PATH"

# Descobrir caminho do node
NODE_PATH=$(sudo -u "$SERVICE_USER" which node 2>/dev/null || echo "")
if [ -z "$NODE_PATH" ]; then
    NODE_PATH=$(which node 2>/dev/null || echo "")
fi

if [ -z "$NODE_PATH" ]; then
    echo -e "${RED}Erro: node não encontrado no PATH${NC}"
    exit 1
fi

echo "  node encontrado em: $NODE_PATH"

# Verificar se o build foi feito
echo -e "${GREEN}[3/8]${NC} Verificando build..."
if [ ! -d "$PROJECT_DIR/.next" ]; then
    echo -e "${YELLOW}Aviso: Diretório .next não encontrado. O build pode não ter sido executado.${NC}"
    read -p "Deseja executar 'npm run build' agora? (s/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        cd "$PROJECT_DIR"
        sudo -u "$SERVICE_USER" npm run build
    else
        echo -e "${YELLOW}Continuando sem build. Certifique-se de executar 'npm run build' antes de iniciar o serviço.${NC}"
    fi
else
    echo "  Build encontrado ✓"
fi

# Criar arquivo de serviço
SERVICE_NAME="financeiro"
SERVICE_FILE="/etc/systemd/system/${SERVICE_NAME}.service"

echo -e "${GREEN}[4/8]${NC} Criando arquivo de serviço systemd..."
echo "  Arquivo: $SERVICE_FILE"

# Verificar se o serviço já existe
if [ -f "$SERVICE_FILE" ]; then
    echo -e "${YELLOW}Arquivo de serviço já existe.${NC}"
    read -p "Deseja sobrescrever? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Operação cancelada."
        exit 0
    fi
    # Parar o serviço se estiver rodando
    systemctl stop "$SERVICE_NAME.service" 2>/dev/null || true
fi

# Ler variáveis do .env para incluir diretamente no serviço (evita problemas de permissão)
echo -e "${GREEN}[4b/8]${NC} Carregando variáveis de ambiente..."

# Carregar variáveis do .env
set -a
source "$PROJECT_DIR/.env" 2>/dev/null || true
set +a

# Criar o conteúdo do arquivo de serviço
cat > "$SERVICE_FILE" <<EOF
[Unit]
Description=Sistema Financeiro - Next.js Application
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
WorkingDirectory=$PROJECT_DIR
Environment="NODE_ENV=production"
EOF

# Adicionar variáveis do .env diretamente (se existirem)
if [ -f "$PROJECT_DIR/.env" ]; then
    # Adicionar cada variável do .env como Environment=
    while IFS= read -r line || [ -n "$line" ]; do
        # Ignorar linhas vazias e comentários
        [[ "$line" =~ ^[[:space:]]*# ]] && continue
        [[ -z "$line" ]] && continue
        # Adicionar como Environment= se contiver =
        if [[ "$line" =~ ^[[:space:]]*([^=]+)=(.*)$ ]]; then
            VAR_NAME="${BASH_REMATCH[1]}"
            VAR_VALUE="${BASH_REMATCH[2]}"
            # Remover aspas se houver
            VAR_VALUE=$(echo "$VAR_VALUE" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
            echo "Environment=\"$VAR_NAME=$VAR_VALUE\"" >> "$SERVICE_FILE"
        fi
    done < "$PROJECT_DIR/.env"
fi

# Continuar o arquivo de serviço
cat >> "$SERVICE_FILE" <<EOF
ExecStart=$NPM_PATH start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=$SERVICE_NAME

[Install]
WantedBy=multi-user.target
EOF

echo "  Arquivo criado com sucesso ✓"

# Verificar permissões do diretório do projeto
echo -e "${GREEN}[5/8]${NC} Verificando permissões do diretório..."

# Garantir que o diretório do projeto seja acessível
chmod 755 "$PROJECT_DIR" 2>/dev/null || true
chown "$SERVICE_USER:$SERVICE_USER" "$PROJECT_DIR" 2>/dev/null || true

# Verificar se o diretório home do usuário também tem permissões corretas
USER_HOME=$(eval echo ~$SERVICE_USER)
if [ -d "$USER_HOME" ]; then
    chmod 755 "$USER_HOME" 2>/dev/null || true
fi

echo "  Permissões do diretório verificadas ✓"

# Recarregar systemd
echo -e "${GREEN}[6/8]${NC} Recarregando systemd..."
systemctl daemon-reload
echo "  Systemd recarregado ✓"

# Habilitar serviço
echo -e "${GREEN}[7/8]${NC} Habilitando serviço para iniciar no boot..."
systemctl enable "$SERVICE_NAME.service"
echo "  Serviço habilitado ✓"

# Iniciar serviço
echo -e "${GREEN}[8/8]${NC} Iniciando serviço..."
if systemctl start "$SERVICE_NAME.service"; then
    echo -e "${GREEN}  Serviço iniciado com sucesso! ✓${NC}"
else
    echo -e "${RED}  Erro ao iniciar o serviço${NC}"
    echo ""
    echo "Verifique os logs com:"
    echo "  sudo journalctl -xeu $SERVICE_NAME.service"
    echo "  sudo systemctl status $SERVICE_NAME.service"
    exit 1
fi

# Mostrar status
echo ""
echo "=========================================="
echo -e "${GREEN}Configuração concluída!${NC}"
echo "=========================================="
echo ""
echo "Status do serviço:"
systemctl status "$SERVICE_NAME.service" --no-pager -l || true

echo ""
echo "Comandos úteis:"
echo "  Ver status:     sudo systemctl status $SERVICE_NAME.service"
echo "  Ver logs:       sudo journalctl -u $SERVICE_NAME.service -f"
echo "  Reiniciar:      sudo systemctl restart $SERVICE_NAME.service"
echo "  Parar:          sudo systemctl stop $SERVICE_NAME.service"
echo "  Iniciar:        sudo systemctl start $SERVICE_NAME.service"
echo ""
echo -e "${GREEN}Serviço configurado e rodando!${NC}"
echo ""

