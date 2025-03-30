#!/bin/bash
# Migration to update reservations table schema

echo "Migrating reservations table to update columns..."

# Import common functions
source "$(dirname "$0")/../migrate-db.sh" >/dev/null 2>&1 || {
  # If the source fails, define functions directly
  execute_query() {
    PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "$1"
    return $?
  }
}

# Check the seat_numbers column type in reservations table
SEAT_NUMBERS_TYPE=$(execute_query "
  SELECT data_type 
  FROM information_schema.columns 
  WHERE table_name='reservations' AND column_name='seat_numbers';
" | grep -o 'ARRAY\|jsonb' || echo "not_found")

if [ "$SEAT_NUMBERS_TYPE" = "ARRAY" ]; then
  echo "Converting seat_numbers column from ARRAY to JSONB..."
  
  # Create a temporary column
  execute_query "ALTER TABLE reservations ADD COLUMN temp_seat_numbers JSONB;" || exit 1
  
  # Convert array data to jsonb
  execute_query "
    UPDATE reservations 
    SET temp_seat_numbers = CAST(seat_numbers AS jsonb);
  " || exit 1
  
  # Drop the old column
  execute_query "ALTER TABLE reservations DROP COLUMN seat_numbers;" || exit 1
  
  # Rename the temporary column
  execute_query "ALTER TABLE reservations RENAME COLUMN temp_seat_numbers TO seat_numbers;" || exit 1
  
  # Add NOT NULL constraint
  execute_query "ALTER TABLE reservations ALTER COLUMN seat_numbers SET NOT NULL;" || exit 1
  
  echo "Successfully converted seat_numbers column to JSONB"
elif [ "$SEAT_NUMBERS_TYPE" = "jsonb" ]; then
  echo "Column 'seat_numbers' is already JSONB type"
else
  echo "Error: Could not determine the type of seat_numbers column"
  exit 1
fi

# Update schema version
execute_query "
  INSERT INTO schema_versions (version, description)
  VALUES (4, 'Convert reservations.seat_numbers from ARRAY to JSONB')
  ON CONFLICT (version) DO NOTHING;
" || exit 1

echo "Reservations table migration complete!"
exit 0