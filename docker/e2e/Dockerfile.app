FROM eclipse-temurin:17-jre
RUN apt-get update -qq && apt-get install -y -qq postgresql-client curl > /dev/null 2>&1
WORKDIR /app
COPY target/todo-app-*.jar app.jar
COPY docker/postgres/init/02_seed.sql /seed.sql
COPY docker/e2e/start-app.sh /start-app.sh
RUN chmod +x /start-app.sh
EXPOSE 8081
CMD ["/start-app.sh"]
