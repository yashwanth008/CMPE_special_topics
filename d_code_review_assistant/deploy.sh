#!/usr/bin/env bash
# Deploy to Cloud Run from source. Usage: PROJECT=my-proj REGION=us-central1 ./deploy.sh
set -euo pipefail
: "${PROJECT:?set PROJECT}"; REGION="${REGION:-us-central1}"
gcloud run deploy code-review-assistant --source . --project "$PROJECT" --region "$REGION" \
  --no-allow-unauthenticated --memory 1Gi --cpu 1 --timeout 900 --concurrency 4 \
  --set-env-vars "GOOGLE_GENAI_USE_VERTEXAI=TRUE,GOOGLE_CLOUD_PROJECT=$PROJECT,GOOGLE_CLOUD_LOCATION=$REGION"
