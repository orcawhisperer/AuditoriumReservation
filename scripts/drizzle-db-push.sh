#!/bin/bash

# Push schema changes directly to the database without migration files
echo "Pushing schema changes directly to the database..."
npx drizzle-kit push:pg