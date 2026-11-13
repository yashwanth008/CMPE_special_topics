FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY lead_gen_agent ./lead_gen_agent
ENV PORT=8080 LEADGEN_OUTPUT_DIR=/tmp/outputs
CMD ["sh", "-c", "adk api_server --host 0.0.0.0 --port ${PORT} ."]
