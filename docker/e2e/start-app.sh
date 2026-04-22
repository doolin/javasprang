#!/bin/sh
# Start Spring Boot in the background, wait for it to be ready,
# seed the database, then keep the app in the foreground.

java -jar app.jar &
APP_PID=$!

echo "Waiting for Spring Boot to start..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:8081/login > /dev/null 2>&1; then
    echo "Spring Boot is ready."
    break
  fi
  sleep 1
done

echo "Seeding database..."
PGHOST=${PGHOST:-postgres} PGPORT=5432 PGUSER=postgres PGPASSWORD=postgres PGDATABASE=todoapp \
  psql -f /seed.sql

echo "Seed complete. App running on PID $APP_PID."
wait $APP_PID
