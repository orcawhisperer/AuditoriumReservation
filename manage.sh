#!/bin/bash
# Shahbaaz Auditorium Management Script
# A comprehensive utility to manage the application deployment

# Set default environment file
ENV_FILE=".env"

# Create .env file from example if it doesn't exist
if [ ! -f "$ENV_FILE" ]; then
  cp .env.example "$ENV_FILE"
  echo "Created $ENV_FILE from template. Please update with your settings."
fi

# Source environment variables
source "$ENV_FILE"

# Text styling
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display the Shahbaaz Auditorium banner
function show_banner {
  echo -e "${BLUE}${BOLD}"
  echo "  _____  _           _     _                      "
  echo " / ____|| |         | |   | |                     "
  echo "| (___  | |__   __ _| |__ | |__   __ _  __ _ ____ "
  echo " \___ \ | '_ \ / _\` | '_ \| '_ \ / _\` |/ _\` |_  /"
  echo " ____) || | | | (_| | | | | |_) | (_| | (_| |/ / "
  echo "|_____/ |_| |_|\__,_|_| |_|_.__/ \__,_|\__,_/___| "
  echo "    _             _ _ _             _             "
  echo "   / \  _   _  __| (_) |_ ___  _ __(_)_   _ _ __ ___ "
  echo "  / _ \| | | |/ _\` | | __/ _ \| '__| | | | | '_ \` _ \\"
  echo " / ___ \ |_| | (_| | | || (_) | |  | | |_| | | | | | |"
  echo "/_/   \_\__,_|\__,_|_|\__\___/|_|  |_|\__,_|_| |_| |_|"
  echo -e "${NC}"
  echo -e "${YELLOW}Management Script${NC}"
  echo ""
}

# Check docker and docker-compose are installed
function check_prerequisites {
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
  fi
  
  if ! command -v docker compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
  fi
}

# Show help message
function show_help {
  echo -e "${BOLD}Usage:${NC}"
  echo "  ./manage.sh [command]"
  echo ""
  echo -e "${BOLD}Available Commands:${NC}"
  echo "  start               Start application in development mode"
  echo "  start:prod          Start application in production mode"
  echo "  stop                Stop the application"
  echo "  restart             Restart the application"
  echo "  status              Check the status of all services"
  echo "  logs                View application logs"
  echo "  backup              Create a database backup"
  echo "  restore <file>      Restore database from a backup file"
  echo "  list-backups        List all available database backups"
  echo "  build               Rebuild application containers"
  echo "  clean               Stop containers and remove volumes (caution: data loss)"
  echo "  shell:<service>     Open a shell in a container (app, postgres, nginx)"
  echo "  psql                Open PostgreSQL interactive terminal"
  echo "  help                Show this help message"
  echo ""
  echo -e "${BOLD}Examples:${NC}"
  echo "  ./manage.sh start                 # Start in development mode"
  echo "  ./manage.sh start:prod            # Start in production mode"
  echo "  ./manage.sh backup                # Create database backup"
  echo "  ./manage.sh restore backups/file.sql.gz  # Restore from backup"
  echo "  ./manage.sh shell:app             # Open shell in app container"
  echo ""
}

# Start application in development mode
function start_dev {
  echo -e "${BLUE}Starting application in development mode...${NC}"
  
  # Start the database first
  docker compose up -d postgres
  sleep 5  # Wait for database to be ready
  
  # Check if database schema exists
  echo "Checking if database schema exists..."
  if ! docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1 FROM users LIMIT 1" &>/dev/null; then
    echo "Database schema not found. Running migrations..."
    docker compose up -d app
    sleep 5
    docker compose exec app npm run db:push
  else
    echo "Database schema already exists."
    docker compose up -d
  fi
  
  echo -e "${GREEN}Application started. Access at http://localhost:5000${NC}"
}

# Start application in production mode
function start_prod {
  echo -e "${BLUE}Starting application in production mode...${NC}"
  
  # Start the database first
  docker compose -f docker-compose.prod.yml up -d postgres
  sleep 5  # Wait for database to be ready
  
  # Check if database schema exists
  echo "Checking if database schema exists..."
  if ! docker compose -f docker-compose.prod.yml exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1 FROM users LIMIT 1" &>/dev/null; then
    echo "Database schema not found. Running migrations..."
    docker compose -f docker-compose.prod.yml up -d app
    sleep 5
    docker compose -f docker-compose.prod.yml exec app npm run db:push
    
    # Start the rest of the services
    docker compose -f docker-compose.prod.yml up -d
  else
    echo "Database schema already exists."
    docker compose -f docker-compose.prod.yml up -d
  fi
  
  echo -e "${GREEN}Application started in production mode.${NC}"
  echo -e "Access at http://localhost or https://your-domain.com when configured"
}

# Stop application
function stop_app {
  echo -e "${BLUE}Stopping the application...${NC}"
  if [ "$1" == "prod" ]; then
    docker compose -f docker-compose.prod.yml down
  else
    docker compose down
  fi
  echo -e "${GREEN}Application stopped${NC}"
}

# Restart application
function restart_app {
  echo -e "${BLUE}Restarting the application...${NC}"
  
  # Check if we're running in production
  if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    docker compose -f docker-compose.prod.yml down
    docker compose -f docker-compose.prod.yml up -d
    echo -e "${GREEN}Application restarted in production mode${NC}"
  else
    docker compose down
    docker compose up -d
    echo -e "${GREEN}Application restarted in development mode${NC}"
  fi
}

# Get application status
function get_status {
  echo -e "${BLUE}Application Status:${NC}"
  echo -e "${BOLD}Development Environment:${NC}"
  docker compose ps
  
  echo -e "\n${BOLD}Production Environment:${NC}"
  docker compose -f docker-compose.prod.yml ps
}

# View application logs
function view_logs {
  if [ -z "$1" ]; then
    echo -e "${BLUE}Showing application logs (press Ctrl+C to exit)...${NC}"
    # Check if we're running in production
    if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
      docker compose -f docker-compose.prod.yml logs -f
    else
      docker compose logs -f
    fi
  else
    echo -e "${BLUE}Showing logs for $1 container (press Ctrl+C to exit)...${NC}"
    # Check if we're running in production
    if docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
      docker compose -f docker-compose.prod.yml logs -f "$1"
    else
      docker compose logs -f "$1"
    fi
  fi
}

# Create database backup
function backup_db {
  echo -e "${BLUE}Creating database backup...${NC}"
  
  # Check if postgres container is running
  if ! docker compose ps | grep -q "postgres.*Up"; then
    echo -e "${YELLOW}PostgreSQL container is not running. Starting it...${NC}"
    docker compose up -d postgres
    sleep 5 # Wait for PostgreSQL to start
  fi
  
  # Create backups directory if it doesn't exist
  mkdir -p backups
  
  # Create timestamp for backup filename
  TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
  BACKUP_FILE="backups/shahbaaz_backup_$TIMESTAMP.sql"

  # Run pg_dump command inside the container
  echo -e "${BLUE}Dumping database to $BACKUP_FILE...${NC}"
  docker compose exec postgres pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" > "$BACKUP_FILE"
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Database backup failed!${NC}"
    rm -f "$BACKUP_FILE"
    exit 1
  fi
  
  # Compress the backup
  echo -e "${BLUE}Compressing backup...${NC}"
  gzip "$BACKUP_FILE"
  
  echo -e "${GREEN}Backup created successfully: ${BACKUP_FILE}.gz${NC}"
  
  # List all backups
  list_backups
}

# Restore database from backup
function restore_db {
  if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo -e "Usage: ./manage.sh restore <backup_file>"
    echo ""
    list_backups
    exit 1
  fi
  
  BACKUP_FILE="$1"
  
  # Check if file exists
  if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}WARNING: This will overwrite the current database. All existing data will be lost.${NC}"
  echo -e "Restore from: $BACKUP_FILE"
  echo -e "Press Ctrl+C to cancel, or any key to continue..."
  read -n 1 -s
  
  # Check if postgres container is running
  if ! docker compose ps | grep -q "postgres.*Up"; then
    echo -e "${YELLOW}PostgreSQL container is not running. Starting it...${NC}"
    docker compose up -d postgres
    sleep 5 # Wait for PostgreSQL to start
  fi
  
  # Restore based on file extension
  if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo -e "${BLUE}Restoring from compressed backup...${NC}"
    gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
  else
    echo -e "${BLUE}Restoring from uncompressed backup...${NC}"
    cat "$BACKUP_FILE" | docker compose exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
  fi
  
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Database restore failed!${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Database restored successfully from $BACKUP_FILE${NC}"
}

# List all available backups
function list_backups {
  echo -e "${BLUE}Available database backups:${NC}"
  
  # Check if backups directory exists
  if [ ! -d "backups" ]; then
    echo -e "${YELLOW}No backups found. Backup directory doesn't exist.${NC}"
    return
  fi
  
  # Count backups
  BACKUP_COUNT=$(find backups -name "shahbaaz_backup_*.sql.gz" | wc -l)
  
  if [ $BACKUP_COUNT -eq 0 ]; then
    echo -e "${YELLOW}No backups found.${NC}"
  else
    ls -lh backups | grep "shahbaaz_backup_" | sort -r
    echo -e "${GREEN}Found $BACKUP_COUNT backup(s)${NC}"
  fi
}

# Build or rebuild application
function build_app {
  echo -e "${BLUE}Building application containers...${NC}"
  
  if [ "$1" == "prod" ]; then
    docker compose -f docker-compose.prod.yml build
    echo -e "${GREEN}Production containers built successfully${NC}"
  else
    docker compose build
    echo -e "${GREEN}Development containers built successfully${NC}"
  fi
}

# Stop and remove containers, networks, volumes, and images
function clean_app {
  echo -e "${RED}WARNING: This will remove all containers, volumes, and data!${NC}"
  echo -e "Press Ctrl+C to cancel, or any key to continue..."
  read -n 1 -s
  
  echo -e "${BLUE}Stopping containers and removing volumes...${NC}"
  
  # Stop and remove all containers from both environments
  docker compose down -v
  docker compose -f docker-compose.prod.yml down -v
  
  echo -e "${GREEN}Cleanup completed. All containers and volumes have been removed.${NC}"
}

# Open a shell in a container
function open_shell {
  CONTAINER="$1"
  
  if [ -z "$CONTAINER" ]; then
    echo -e "${RED}Error: No container specified${NC}"
    echo -e "Usage: ./manage.sh shell:<container>"
    echo -e "Available containers: app, postgres, nginx"
    exit 1
  fi
  
  echo -e "${BLUE}Opening shell in $CONTAINER container...${NC}"
  
  # Check if we're running in production
  if docker compose -f docker-compose.prod.yml ps | grep -q "$CONTAINER.*Up"; then
    docker compose -f docker-compose.prod.yml exec "$CONTAINER" sh
  else
    docker compose exec "$CONTAINER" sh
  fi
}

# Open PostgreSQL interactive terminal
function open_psql {
  echo -e "${BLUE}Opening PostgreSQL terminal...${NC}"
  
  # Check if postgres container is running
  if ! docker compose ps | grep -q "postgres.*Up"; then
    if docker compose -f docker-compose.prod.yml ps | grep -q "postgres.*Up"; then
      docker compose -f docker-compose.prod.yml exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
    else
      echo -e "${YELLOW}PostgreSQL container is not running. Starting it...${NC}"
      docker compose up -d postgres
      sleep 5 # Wait for PostgreSQL to start
      docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
    fi
  else
    docker compose exec postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
  fi
}

# Main execution
check_prerequisites
show_banner

if [ $# -eq 0 ]; then
  show_help
  exit 0
fi

case "$1" in
  start)
    start_dev
    ;;
  start:prod)
    start_prod
    ;;
  stop)
    stop_app
    ;;
  restart)
    restart_app
    ;;
  status)
    get_status
    ;;
  logs)
    view_logs "$2"
    ;;
  backup)
    backup_db
    ;;
  restore)
    restore_db "$2"
    ;;
  list-backups)
    list_backups
    ;;
  build)
    if [ "$2" == "prod" ]; then
      build_app "prod"
    else
      build_app
    fi
    ;;
  clean)
    clean_app
    ;;
  shell:*)
    CONTAINER=$(echo $1 | cut -d':' -f2)
    open_shell "$CONTAINER"
    ;;
  psql)
    open_psql
    ;;
  help)
    show_help
    ;;
  *)
    echo -e "${RED}Unknown command: $1${NC}"
    show_help
    exit 1
    ;;
esac

exit 0