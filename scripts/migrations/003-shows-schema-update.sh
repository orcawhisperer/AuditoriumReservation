#!/bin/bash
# Migration to add new required columns to shows table

echo "Migrating shows table to add new columns..."

# Import common functions
source "$(dirname "$0")/../migrate-db.sh" >/dev/null 2>&1 || {
  # If the source fails, define functions directly
  execute_query() {
    PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "$1"
    return $?
  }
}

# Check if description column exists in shows table
DESCRIPTION_EXISTS=$(execute_query "SELECT column_name FROM information_schema.columns WHERE table_name='shows' AND column_name='description';" | grep -c "description")

if [ "$DESCRIPTION_EXISTS" -eq "0" ]; then
  echo "Adding description column to shows table..."
  execute_query "ALTER TABLE shows ADD COLUMN description TEXT;" || exit 1
else
  echo "Column 'description' already exists in shows table"
fi

# Check if theme_color column exists in shows table
THEME_COLOR_EXISTS=$(execute_query "SELECT column_name FROM information_schema.columns WHERE table_name='shows' AND column_name='theme_color';" | grep -c "theme_color")

if [ "$THEME_COLOR_EXISTS" -eq "0" ]; then
  echo "Adding theme_color column to shows table..."
  execute_query "ALTER TABLE shows ADD COLUMN theme_color TEXT DEFAULT '#4B5320';" || exit 1
else
  echo "Column 'theme_color' already exists in shows table"
fi

# Check if emoji column exists in shows table
EMOJI_EXISTS=$(execute_query "SELECT column_name FROM information_schema.columns WHERE table_name='shows' AND column_name='emoji';" | grep -c "emoji")

if [ "$EMOJI_EXISTS" -eq "0" ]; then
  echo "Adding emoji column to shows table..."
  execute_query "ALTER TABLE shows ADD COLUMN emoji TEXT;" || exit 1
else
  echo "Column 'emoji' already exists in shows table"
fi

# Check if blocked_seats column exists in shows table
BLOCKED_SEATS_EXISTS=$(execute_query "SELECT column_name FROM information_schema.columns WHERE table_name='shows' AND column_name='blocked_seats';" | grep -c "blocked_seats")

if [ "$BLOCKED_SEATS_EXISTS" -eq "0" ]; then
  echo "Adding blocked_seats column to shows table..."
  execute_query "ALTER TABLE shows ADD COLUMN blocked_seats JSONB DEFAULT '[]'::jsonb;" || exit 1
else
  echo "Column 'blocked_seats' already exists in shows table"
fi

# Check if seat_layout column exists in shows table
SEAT_LAYOUT_EXISTS=$(execute_query "SELECT column_name FROM information_schema.columns WHERE table_name='shows' AND column_name='seat_layout';" | grep -c "seat_layout")

if [ "$SEAT_LAYOUT_EXISTS" -eq "0" ]; then
  echo "Adding seat_layout column to shows table..."
  execute_query "ALTER TABLE shows ADD COLUMN seat_layout JSONB DEFAULT '[]'::jsonb;" || exit 1
else
  echo "Column 'seat_layout' already exists in shows table"
fi

# Check if price column exists and should be removed (it's not in the Drizzle schema)
PRICE_EXISTS=$(execute_query "SELECT column_name FROM information_schema.columns WHERE table_name='shows' AND column_name='price';" | grep -c "price")

if [ "$PRICE_EXISTS" -ne "0" ]; then
  echo "Column 'price' exists but is not in the current schema - keeping for backwards compatibility"
fi

# Update schema version
execute_query "
  INSERT INTO schema_versions (version, description)
  VALUES (3, 'Add new columns to shows table')
  ON CONFLICT (version) DO NOTHING;
" || exit 1

echo "Shows table migration complete!"
exit 0