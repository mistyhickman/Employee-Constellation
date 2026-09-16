#!/bin/sh
set -e

# Applies any migrations that haven't run against this database yet —
# safe to run on every container start (a no-op once the schema is current).
npx prisma migrate deploy

if [ "$RUN_SEED_ON_START" = "true" ]; then
  npx prisma db seed
fi

exec node dist/index.js
