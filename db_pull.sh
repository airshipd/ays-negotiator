#!/bin/bash

if [[ $1 == staging ]]; then
  source ./.env && mysqldump --host $STAGING_DB_HOST --port $STAGING_DB_PORT -u $STAGING_DB_USER -p$STAGING_DB_PASS $STAGING_DB_NAME > dump.sql && mysql --host $DB_HOST --port $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME < dump.sql
elif [[ $1 == production ]]; then
    source ./.env && mysqldump --host $PRODUCTION_DB_HOST --port $PRODUCTION_DB_PORT -u $PRODUCTION_DB_USER -p$PRODUCTION_DB_PASS $PRODUCTION_DB_NAME > dump.sql && mysql --host $DB_HOST --port $DB_PORT -u $DB_USER -p$DB_PASS $DB_NAME < dump.sql
else
  echo "please specify environment, either stagig or production"
fi
