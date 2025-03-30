#!/bin/bash
# Migration to add new required columns to users table

echo "Migrating users table to add new columns..."

# Import common functions
source "$(dirname "$0")/../migrate-db.sh" >/dev/null 2>&1 || {
  # If the source fails, define functions directly
  execute_query() {
    PGPASSWORD="$PGPASSWORD" psql -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" -c "$1"
    return $?
  }
}

# Check if name column exists in users table
NAME_EXISTS=$(execute_query "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='name';" | grep -c "name")

if [ "$NAME_EXISTS" -eq "0" ]; then
  echo "Adding name column to users table..."
  execute_query "ALTER TABLE users ADD COLUMN name TEXT;" || exit 1
else
  echo "Column 'name' already exists in users table"
fi

# Check if gender column exists in users table
GENDER_EXISTS=$(execute_query "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='gender';" | grep -c "gender")

if [ "$GENDER_EXISTS" -eq "0" ]; then
  echo "Adding gender column to users table..."
  execute_query "ALTER TABLE users ADD COLUMN gender TEXT;" || exit 1
else
  echo "Column 'gender' already exists in users table"
fi

# Check if date_of_birth column exists in users table
DOB_EXISTS=$(execute_query "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='date_of_birth';" | grep -c "date_of_birth")

if [ "$DOB_EXISTS" -eq "0" ]; then
  echo "Adding date_of_birth column to users table..."
  execute_query "ALTER TABLE users ADD COLUMN date_of_birth TEXT;" || exit 1
else
  echo "Column 'date_of_birth' already exists in users table"
fi

# Update admin user with required data if any columns were added
if [ "$NAME_EXISTS" -eq "0" ] || [ "$GENDER_EXISTS" -eq "0" ] || [ "$DOB_EXISTS" -eq "0" ]; then
  echo "Updating admin user with default values for new columns..."
  execute_query "
    UPDATE users 
    SET 
      name = COALESCE(name, 'System Administrator'),
      gender = COALESCE(gender, 'other'),
      date_of_birth = COALESCE(date_of_birth, '2000-01-01')
    WHERE username = 'admin';
  " || exit 1
fi

# Update schema version
execute_query "
  INSERT INTO schema_versions (version, description)
  VALUES (2, 'Add name, gender, and date_of_birth columns to users')
  ON CONFLICT (version) DO NOTHING;
" || exit 1

echo "Users table migration complete!"
exit 0