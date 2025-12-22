#!/bin/bash
set -e

echo "Restoring MongoDB dump..."

mongorestore \
  --username "$MONGO_INITDB_ROOT_USERNAME" \
  --password "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  /dump

echo "MongoDB restore completed"