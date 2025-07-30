#!/bin/bash

# Database Backup Restore Script for Qserviços
# Restaura um backup do banco de dados PostgreSQL

set -e  # Sair em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para exibir ajuda
show_help() {
    echo "Uso: $0 [opções]"
    echo ""
    echo "Opções:"
    echo "  -f, --file <arquivo>    Caminho para o arquivo de backup"
    echo "  -y, --yes              Pula confirmação (CUIDADO!)"
    echo "  -h, --help             Mostra esta ajuda"
    echo ""
    echo "Exemplos:"
    echo "  $0"
    echo "  $0 -f ./backups/meu-backup.sql"
    echo "  $0 -y -f ./backups/backup.sql"
}

# Configurações padrão
BACKUP_FILE="./backups/restore/backup_qservicos_20250730_2025-07-30.sql"
SKIP_CONFIRMATION=false

# Processar argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            BACKUP_FILE="$2"
            shift 2
            ;;
        -y|--yes)
            SKIP_CONFIRMATION=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Argumento desconhecido: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

echo -e "${BLUE}🗄️  Qserviços - Restaurador de Backup do Banco de Dados${NC}"
echo "============================================================"

# Verificar se o arquivo existe
if [[ ! -f "$BACKUP_FILE" ]]; then
    echo -e "${RED}❌ Arquivo de backup não encontrado: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}📁 Arquivo: $BACKUP_FILE${NC}"

# Verificar se DATABASE_URL está definida
if [[ -z "$DATABASE_URL" ]]; then
    echo -e "${RED}❌ DATABASE_URL não encontrada nas variáveis de ambiente${NC}"
    exit 1
fi

# Extrair informações da URL do banco
DB_URL_PARTS=$(node -e "
const url = new URL('$DATABASE_URL');
console.log(JSON.stringify({
    host: url.hostname,
    port: url.port || '5432',
    database: url.pathname.slice(1),
    username: url.username,
    password: url.password
}));
")

DB_HOST=$(echo "$DB_URL_PARTS" | node -e "console.log(JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).host)")
DB_PORT=$(echo "$DB_URL_PARTS" | node -e "console.log(JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).port)")
DB_NAME=$(echo "$DB_URL_PARTS" | node -e "console.log(JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).database)")
DB_USER=$(echo "$DB_URL_PARTS" | node -e "console.log(JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).username)")
DB_PASSWORD=$(echo "$DB_URL_PARTS" | node -e "console.log(JSON.parse(require('fs').readFileSync('/dev/stdin', 'utf8')).password)")

echo -e "${BLUE}🗄️  Database: $DB_NAME${NC}"
echo -e "${BLUE}🌐 Host: $DB_HOST:$DB_PORT${NC}"

# Confirmação de segurança
if [[ "$SKIP_CONFIRMATION" != true ]]; then
    echo ""
    echo -e "${YELLOW}⚠️  ATENÇÃO: Esta operação irá SOBRESCREVER todos os dados atuais do banco!${NC}"
    echo ""
    read -p "Tem certeza de que deseja continuar? (digite 'CONFIRMO' para continuar): " confirmation
    
    if [[ "$confirmation" != "CONFIRMO" ]]; then
        echo -e "${YELLOW}❌ Restauração cancelada pelo usuário.${NC}"
        exit 0
    fi
fi

echo ""
echo -e "${BLUE}🚀 Executando restauração...${NC}"

# Configurar senha do PostgreSQL
export PGPASSWORD="$DB_PASSWORD"

# Executar restauração
if psql \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -f "$BACKUP_FILE" \
    -1 \
    -v ON_ERROR_STOP=1; then
    
    echo ""
    echo -e "${GREEN}✅ Restauração concluída com sucesso!${NC}"
    echo -e "${GREEN}📊 Dados restaurados de: $BACKUP_FILE${NC}"
else
    echo ""
    echo -e "${RED}❌ Erro durante a restauração${NC}"
    exit 1
fi