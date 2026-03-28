FROM postgres:16-alpine

ENV POSTGRES_DB=todoapp \
    POSTGRES_USER=postgres \
    POSTGRES_PASSWORD=postgres

COPY init/ /docker-entrypoint-initdb.d/

EXPOSE 5432
