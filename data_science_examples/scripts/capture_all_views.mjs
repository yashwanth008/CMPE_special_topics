import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const repoRoot = 'C:\\Users\\abhir\\.gemini\\antigravity-ide\\scratch\\data_science_examples';
const docsDir = path.join(repoRoot, 'docs', 'screenshots');

fs.mkdirSync(docsDir, { recursive: true });

// Start Headless Chrome with Remote Debugging
const chromeProc = spawn(chromePath, [
  '--headless=new',
  '--remote-debugging-port=9222',
  '--disable-gpu',
  '--no-sandbox',
  '--window-size=1366,850'
]);

// Helper to wait
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  await sleep(1500);

  // Get WebSocket Debugger URL from Chrome
  const versionRes = await fetch('http://127.0.0.1:9222/json/version');
  const versionData = await versionRes.json();
  const wsUrl = versionData.webSocketDebuggerUrl;

  console.log('Connected to Chrome DevTools WebSocket:', wsUrl);

  const ws = new WebSocket(wsUrl);

  let idCounter = 1;
  const pendingRequests = new Map();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pendingRequests.has(data.id)) {
      const { resolve, reject } = pendingRequests.get(data.id);
      pendingRequests.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  await new Promise((resolve) => (ws.onopen = resolve));

  const send = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pendingRequests.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  };

  // Create a new target/page
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

  const sendPage = (method, params = {}) => {
    return send('Target.sendMessageToTarget', {
      sessionId,
      message: JSON.stringify({ id: idCounter++, method, params })
    }).then(() => {
      // The response comes back on ws
    });
  };

  // Dedicated Page WebSocket
  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.id === targetId || t.type === 'page');

  const pageWs = new WebSocket(pageTarget.webSocketDebuggerUrl);
  await new Promise((resolve) => (pageWs.onopen = resolve));

  let pageId = 1;
  const pageRequests = new Map();

  pageWs.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.id && pageRequests.has(data.id)) {
      const { resolve, reject } = pageRequests.get(data.id);
      pageRequests.delete(data.id);
      if (data.error) reject(data.error);
      else resolve(data.result);
    }
  };

  const callPage = (method, params = {}) => {
    return new Promise((resolve, reject) => {
      const id = pageId++;
      pageRequests.set(id, { resolve, reject });
      pageWs.send(JSON.stringify({ id, method, params }));
    });
  };

  await callPage('Page.enable');
  await callPage('Runtime.enable');
  await callPage('Emulation.setDeviceMetricsOverride', {
    width: 1366,
    height: 850,
    deviceScaleFactor: 1,
    mobile: false
  });

  const capture = async (projDir, filename) => {
    const { data } = await callPage('Page.captureScreenshot', { format: 'png' });
    const buffer = Buffer.from(data, 'base64');
    
    const projScreenDir = path.join(repoRoot, projDir, 'screenshots');
    fs.mkdirSync(projScreenDir, { recursive: true });
    
    fs.writeFileSync(path.join(projScreenDir, filename), buffer);
    fs.writeFileSync(path.join(docsDir, filename), buffer);
    console.log(`[CAPTURED] ${projDir} -> ${filename}`);
  };

  const clickByText = async (text) => {
    await callPage('Runtime.evaluate', {
      expression: `(() => {
        const elements = Array.from(document.querySelectorAll('button, a, [role="button"], tab, div'));
        const target = elements.find(el => el.textContent && el.textContent.includes(${JSON.stringify(text)}));
        if (target) {
          target.click();
          return true;
        }
        return false;
      })()`
    });
    await sleep(600);
  };

  // ==========================================
  // 00. DYNAMIC TODO LIST APP (:5173)
  // ==========================================
  console.log('\n--- 00. Dynamic Todo List ---');
  await callPage('Page.navigate', { url: 'http://localhost:5173/' });
  await sleep(1500);
  await capture('00_dynamic_todo_workspace', 'todo_list_view.png');

  await clickByText('Kanban');
  await capture('00_dynamic_todo_workspace', 'todo_kanban_board.png');

  await clickByText('Eisenhower');
  await capture('00_dynamic_todo_workspace', 'todo_eisenhower_matrix.png');

  await clickByText('Calendar');
  await capture('00_dynamic_todo_workspace', 'todo_calendar_timeline.png');

  await clickByText('Analytics');
  await capture('00_dynamic_todo_workspace', 'todo_analytics_dashboard.png');

  await clickByText('Focus');
  await capture('00_dynamic_todo_workspace', 'todo_pomodoro_focus.png');

  // ==========================================
  // 01. NYC TAXI TRIP PREDICTION (:5174)
  // ==========================================
  console.log('\n--- 01. NYC Taxi ---');
  await callPage('Page.navigate', { url: 'http://localhost:5174/' });
  await sleep(1500);
  await capture('01_nyc_taxi_trip_prediction', 'nyc_estimator_view.png');

  await clickByText('Admin');
  await capture('01_nyc_taxi_trip_prediction', 'nyc_admin_autoresearch.png');

  await clickByText('CRISP-DM');
  await capture('01_nyc_taxi_trip_prediction', 'nyc_crisp_dm_report.png');

  // ==========================================
  // 02. NANO LLM TRANSFORMER (:5175)
  // ==========================================
  console.log('\n--- 02. NanoLlama ---');
  await callPage('Page.navigate', { url: 'http://localhost:5175/' });
  await sleep(1500);
  await capture('02_nano_llm_transformer', 'nanollama_chat_studio.png');

  await clickByText('Attention');
  await capture('02_nano_llm_transformer', 'nanollama_attention_heatmaps.png');

  await clickByText('Tokenizer');
  await capture('02_nano_llm_transformer', 'nanollama_tokenizer_studio.png');

  await clickByText('Training');
  await capture('02_nano_llm_transformer', 'nanollama_training_curves.png');

  await clickByText('Architecture');
  await capture('02_nano_llm_transformer', 'nanollama_architecture_blueprint.png');

  // ==========================================
  // 03. CUSTOMER CLUSTERING (:5176)
  // ==========================================
  console.log('\n--- 03. Customer Clustering ---');
  await callPage('Page.navigate', { url: 'http://localhost:5176/' });
  await sleep(1500);
  await capture('03_customer_segmentation_clustering', 'clustering_explorer.png');

  await clickByText('Admin');
  await capture('03_customer_segmentation_clustering', 'clustering_autoresearch.png');

  await clickByText('CRISP-DM');
  await capture('03_customer_segmentation_clustering', 'clustering_crisp_dm.png');

  // ==========================================
  // 04. ASSOCIATIVE PATTERN MINING (:5177)
  // ==========================================
  console.log('\n--- 04. Market Basket ---');
  await callPage('Page.navigate', { url: 'http://localhost:5177/' });
  await sleep(1500);
  await capture('04_associative_pattern_mining', 'market_basket_graph.png');

  await clickByText('Admin');
  await capture('04_associative_pattern_mining', 'market_basket_admin.png');

  await clickByText('CRISP-DM');
  await capture('04_associative_pattern_mining', 'market_basket_crisp_dm.png');

  // ==========================================
  // 05. DATA SCIENCE SKILLS LAB (:5178)
  // ==========================================
  console.log('\n--- 05. Skills Lab ---');
  await callPage('Page.navigate', { url: 'http://localhost:5178/' });
  await sleep(1500);
  await capture('05_data_science_skills_lab', 'skills_lab_catalog.png');

  await clickByText('Titanic');
  await capture('05_data_science_skills_lab', 'skills_lab_titanic.png');

  await clickByText('House');
  await capture('05_data_science_skills_lab', 'skills_lab_house_prices.png');

  await clickByText('Fraud');
  await capture('05_data_science_skills_lab', 'skills_lab_fraud.png');

  await clickByText('Commerce');
  await capture('05_data_science_skills_lab', 'skills_lab_ecommerce.png');

  await clickByText('Quality');
  await capture('05_data_science_skills_lab', 'skills_lab_quality_audit.png');

  // ==========================================
  // 06. ANOMALY DETECTION (:5179)
  // ==========================================
  console.log('\n--- 06. Anomaly Detection ---');
  await callPage('Page.navigate', { url: 'http://localhost:5179/' });
  await sleep(1500);
  await capture('06_anomaly_detection', 'anomaly_threat_scorer.png');

  await clickByText('Manifold');
  await capture('06_anomaly_detection', 'anomaly_manifold_2d.png');

  await clickByText('Backbones');
  await capture('06_anomaly_detection', 'anomaly_backbones_sota.png');

  await clickByText('AutoResearch');
  await capture('06_anomaly_detection', 'anomaly_autoresearch.png');

  await clickByText('Anomalies');
  await capture('06_anomaly_detection', 'anomaly_top_deviations.png');

  // ==========================================
  // 07. AUTOML AUTOGLUON (:5180)
  // ==========================================
  console.log('\n--- 07. AutoML ---');
  await callPage('Page.navigate', { url: 'http://localhost:5180/' });
  await sleep(1500);
  await capture('07_automl_autogluon', 'automl_predictor.png');

  await clickByText('Stacking');
  await capture('07_automl_autogluon', 'automl_stacking_dag.png');

  await clickByText('Leaderboard');
  await capture('07_automl_autogluon', 'automl_leaderboard.png');

  await clickByText('Importance');
  await capture('07_automl_autogluon', 'automl_feature_importance.png');

  await clickByText('AutoResearch');
  await capture('07_automl_autogluon', 'automl_autoresearch.png');

  // ==========================================
  // 08. DS VISUAL MASTERY (:5181)
  // ==========================================
  console.log('\n--- 08. DS Mastery ---');
  await callPage('Page.navigate', { url: 'http://localhost:5181/' });
  await sleep(1500);
  await capture('08_datascience_visual_mastery', 'mastery_probabilistic_bayes.png');

  await clickByText('Precision');
  await capture('08_datascience_visual_mastery', 'mastery_evaluation_pr_tradeoffs.png');

  await clickByText('Gradients');
  await capture('08_datascience_visual_mastery', 'mastery_calculus_gradients.png');

  await clickByText('Backprop');
  await capture('08_datascience_visual_mastery', 'mastery_chain_rule_backprop.png');

  await clickByText('Quiz');
  await capture('08_datascience_visual_mastery', 'mastery_chapter_quiz.png');

  await clickByText('Interview');
  await capture('08_datascience_visual_mastery', 'mastery_interview_deck.png');

  // ==========================================
  // 09. FLOWFORGE DAG ENGINE (:5182)
  // ==========================================
  console.log('\n--- 09. FlowForge ---');
  await callPage('Page.navigate', { url: 'http://localhost:5182/' });
  await sleep(1500);
  await capture('09_flowforge_dag_engine', 'flowforge_dag_canvas.png');

  await clickByText('TypeScript');
  await capture('09_flowforge_dag_engine', 'flowforge_typescript_lab.png');

  await clickByText('Architecture');
  await capture('09_flowforge_dag_engine', 'flowforge_architecture_doc.png');

  // ==========================================
  // 10. CRISP-DM MASTER'S (:5183)
  // ==========================================
  console.log('\n--- 10. CRISP-DM Master ---');
  await callPage('Page.navigate', { url: 'http://localhost:5183/' });
  await sleep(1500);
  await capture('10_crispdm_masters_curriculum', 'crispdm_phase1_eda.png');

  await clickByText('Clustering');
  await capture('10_crispdm_masters_curriculum', 'crispdm_phase2_clustering.png');

  await clickByText('Outlier');
  await capture('10_crispdm_masters_curriculum', 'crispdm_phase3_outliers.png');

  await clickByText('Regression');
  await capture('10_crispdm_masters_curriculum', 'crispdm_phase4_regression.png');

  await clickByText('Association');
  await capture('10_crispdm_masters_curriculum', 'crispdm_phase5_association.png');

  await clickByText('LSH');
  await capture('10_crispdm_masters_curriculum', 'crispdm_phase6_lsh.png');

  await clickByText('Quizzes');
  await capture('10_crispdm_masters_curriculum', 'crispdm_quiz_modal.png');

  // ==========================================
  // 11. DS AUDIT & GOVERNANCE (:5184)
  // ==========================================
  console.log('\n--- 11. DS Audit ---');
  await callPage('Page.navigate', { url: 'http://localhost:5184/' });
  await sleep(1500);
  await capture('11_enterprise_ds_audit', 'ds_audit_scorecard.png');

  await clickByText('Explorer');
  await capture('11_enterprise_ds_audit', 'ds_audit_explorer.png');

  await clickByText('Sandbox');
  await capture('11_enterprise_ds_audit', 'ds_audit_leakage_sandbox.png');

  await clickByText('Dossier');
  await capture('11_enterprise_ds_audit', 'ds_audit_dossier.png');

  // ==========================================
  // 12. TIME SERIES FORECASTING (:5185)
  // ==========================================
  console.log('\n--- 12. Time Series ---');
  await callPage('Page.navigate', { url: 'http://localhost:5185/' });
  await sleep(1500);
  await capture('12_timeseries_forecasting', 'timeseries_forecast_studio.png');

  await clickByText('CRISP-DM');
  await capture('12_timeseries_forecasting', 'timeseries_crispdm_steps.png');

  await clickByText('Decomposition');
  await capture('12_timeseries_forecasting', 'timeseries_decomposition_acf.png');

  await clickByText('Tournament');
  await capture('12_timeseries_forecasting', 'timeseries_tournament_leaderboard.png');

  await clickByText('Admin');
  await capture('12_timeseries_forecasting', 'timeseries_admin_autoresearch.png');

  console.log('\n🌟 ALL SCREENSHOTS SUCCESSFULLY CAPTURED ACROSS ALL 13 PROJECTS!');
  
  chromeProc.kill();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  chromeProc.kill();
  process.exit(1);
});
