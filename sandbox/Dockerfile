FROM python:3.12-slim
RUN apt-get update && apt-get install -y --no-install-recommends nodejs && rm -rf /var/lib/apt/lists/* \
 && useradd --no-create-home --shell /usr/sbin/nologin --uid 10001 runner
WORKDIR /app
COPY runner.py .
USER 10001
EXPOSE 9000
CMD ["python", "runner.py"]
