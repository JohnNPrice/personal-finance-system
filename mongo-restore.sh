#!/bin/bash
set -e

echo "Restoring MongoDB dump (dropping existing data)..."

mongorestore \
  --drop \
  --username "$MONGO_INITDB_ROOT_USERNAME" \
  --password "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  /dump

echo "MongoDB restore completed"
