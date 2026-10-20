FROM public.ecr.aws/docker/library/maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml ./
COPY .mvn ./.mvn
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 mvn -B -DskipTests -Dmaven.wagon.http.retryHandler.count=5 -Djava.net.preferIPv4Stack=true package

FROM public.ecr.aws/docker/library/eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/rewind-0.0.1-SNAPSHOT.jar /app/rewind.jar
RUN groupadd --gid 10001 appuser \
    && useradd --uid 10001 --gid appuser --no-create-home --shell /usr/sbin/nologin appuser \
    && chown -R appuser:appuser /app
USER 10001:10001
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/rewind.jar"]
