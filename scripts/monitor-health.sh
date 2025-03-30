#!/bin/bash

# Server Health Monitoring Script for Shahbaaz Auditorium VPS Deployment
# This script checks critical server components and the application status

# Set colors for output formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "===== Shahbaaz Auditorium Server Health Check ====="
echo "Date: $(date)"
echo

# Check if PM2 is running
echo -e "${YELLOW}Checking PM2 process status...${NC}"
if pm2 list | grep -q "shahbaaz-auditorium"; then
    APP_STATUS=$(pm2 list | grep "shahbaaz-auditorium" | awk '{print $10}')
    if [ "$APP_STATUS" == "online" ]; then
        echo -e "${GREEN}✓ Application is running (PM2 status: online)${NC}"
        
        # Get uptime and resource usage
        UPTIME=$(pm2 show shahbaaz-auditorium | grep -i uptime | awk '{print $2" "$3" "$4" "$5}')
        echo "  Uptime: $UPTIME"
        
        CPU=$(pm2 show shahbaaz-auditorium | grep -i "cpu" | head -1 | awk '{print $4}')
        MEMORY=$(pm2 show shahbaaz-auditorium | grep -i "memory" | head -1 | awk '{print $4}')
        echo "  CPU: $CPU, Memory: $MEMORY"
    else
        echo -e "${RED}✗ Application is not running properly (PM2 status: $APP_STATUS)${NC}"
        echo "  Run 'pm2 restart shahbaaz-auditorium' to attempt recovery"
    fi
else
    echo -e "${RED}✗ Application is not registered with PM2${NC}"
    echo "  Run 'cd $(pwd) && pm2 start npm --name \"shahbaaz-auditorium\" -- start' to start it"
fi
echo

# Check Nginx (if installed)
echo -e "${YELLOW}Checking Nginx status...${NC}"
if command -v nginx &> /dev/null; then
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✓ Nginx is running${NC}"
        
        # Check Nginx configuration
        NGINX_CONFIG_CHECK=$(nginx -t 2>&1)
        if echo "$NGINX_CONFIG_CHECK" | grep -q "syntax is ok"; then
            echo -e "  Nginx configuration: ${GREEN}OK${NC}"
        else
            echo -e "  Nginx configuration: ${RED}Error${NC}"
            echo "  $NGINX_CONFIG_CHECK"
        fi
    else
        echo -e "${RED}✗ Nginx is not running${NC}"
        echo "  Run 'sudo systemctl start nginx' to start it"
    fi
else
    echo -e "${YELLOW}⚠ Nginx not installed${NC}"
    echo "  Consider installing Nginx for production: 'sudo apt install nginx'"
fi
echo

# Check disk space
echo -e "${YELLOW}Checking disk space...${NC}"
DISK_USAGE=$(df -h . | tail -1 | awk '{print $5}' | sed 's/%//')
DISK_AVAIL=$(df -h . | tail -1 | awk '{print $4}')

if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✓ Disk space is adequate: $DISK_USAGE% used ($DISK_AVAIL available)${NC}"
elif [ "$DISK_USAGE" -lt 90 ]; then
    echo -e "${YELLOW}⚠ Disk space is getting low: $DISK_USAGE% used ($DISK_AVAIL available)${NC}"
else
    echo -e "${RED}✗ Critical disk space issue: $DISK_USAGE% used ($DISK_AVAIL available)${NC}"
    echo "  Consider cleaning up logs or increasing disk space"
fi
echo

# Check database
echo -e "${YELLOW}Checking database...${NC}"
if [ -f "sqlite.db" ]; then
    DB_SIZE=$(du -h sqlite.db | awk '{print $1}')
    echo -e "${GREEN}✓ Database file exists: $DB_SIZE${NC}"
    
    # Check database backups
    LATEST_BACKUP=$(ls -t backups/sqlite_backup_*.db 2>/dev/null | head -1)
    if [ -n "$LATEST_BACKUP" ]; then
        BACKUP_TIME=$(stat -c %y "$LATEST_BACKUP" | cut -d. -f1)
        echo -e "${GREEN}✓ Latest backup: $BACKUP_TIME${NC}"
    else
        echo -e "${RED}✗ No database backups found${NC}"
        echo "  Run './manage.sh backup' to create a backup"
    fi
else
    echo -e "${RED}✗ Database file not found${NC}"
    echo "  Run './manage.sh init-db' to initialize the database"
fi
echo

# Check application HTTP endpoint
echo -e "${YELLOW}Checking application API endpoint...${NC}"
HTTP_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/user)
if [ "$HTTP_CHECK" = "401" ] || [ "$HTTP_CHECK" = "200" ]; then
    echo -e "${GREEN}✓ Application API is responding (HTTP $HTTP_CHECK)${NC}"
else
    echo -e "${RED}✗ Application API is not responding correctly (HTTP $HTTP_CHECK)${NC}"
    echo "  Check application logs: 'pm2 logs shahbaaz-auditorium'"
fi
echo

# System load
echo -e "${YELLOW}System load and memory:${NC}"
echo "  Load average: $(cat /proc/loadavg | awk '{print $1", "$2", "$3}')"
FREE_MEM=$(free -m | grep Mem | awk '{print $4}')
TOTAL_MEM=$(free -m | grep Mem | awk '{print $2}')
MEM_PERCENT=$((FREE_MEM * 100 / TOTAL_MEM))
echo "  Free memory: ${FREE_MEM}MB / ${TOTAL_MEM}MB (${MEM_PERCENT}% free)"
echo

echo "===== Health Check Complete ====="