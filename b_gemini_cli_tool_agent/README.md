# (b) Advanced tool agent: Gemini CLI as a tool inside an ADK pipeline

An ADK agent that clones a GitHub repo and delegates deep code analysis to the **Gemini CLI** (`gemini -p`), then turns the raw output into a clean answer.

```mermaid
flowchart LR
  U[User: 'Explain github.com/o/r'] --> P[RequestPlanner<br/>→ {repo_url, task}]
  P --> W[CliWorker]
  W -->|tool| T1[run_gemini_cli]
  W -->|tool| T2[read_repo_file]
  T1 --> G[(git clone --depth 1<br/>+ gemini -p in repo dir)]
  W --> R[ReportWriter]
```

## Why this is "advanced"
The Gemini CLI is a full agent (file tools, 1M-token context, repo-wide reasoning). ADK orchestrates *around* it: structured intake, guardrails, synthesis, deployment on Cloud Run.

## Security (read `tools.py` docstring)
- **No shell**: argv lists only → `explain; rm -rf /` stays one literal argument (tested).
- **GitHub-only URL allow-list** with charset limits; enforced in the tool *and* in a `before_tool_callback`.
- CLI runs **without `--yolo`** → read-only analysis; repo contents are untrusted (prompt injection).
- Timeouts, output truncation, repo-confined file reads (`..`/symlink escape tested), non-root container.

## Run
```bash
npm i -g @google/gemini-cli && export GEMINI_API_KEY=...
pip install -r requirements.txt && cp .env.example .env
adk web   # pick gemini_cli_agent; ask: "Generate a test plan for https://github.com/google/adk-samples"
```
Offline proof: `python -m pytest . -q` (a fake `gemini` binary on PATH records exactly how it was invoked).

## Deploy
`Dockerfile` installs Node + Gemini CLI + ADK. `PROJECT=… ./deploy.sh` → Cloud Run. Give the service account `roles/aiplatform.user` and use Vertex env vars.
