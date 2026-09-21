import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { NaiveBayesLesson } from './components/NaiveBayesLesson';
import { EvaluationMetricsLesson } from './components/EvaluationMetricsLesson';
import { CalculusGradientsLesson } from './components/CalculusGradientsLesson';
import { BackpropagationLesson } from './components/BackpropagationLesson';
import { MasteryQuizModal } from './components/MasteryQuizModal';
import { InterviewPrepDeck } from './components/InterviewPrepDeck';
import { GhPagesDeploymentModal } from './components/GhPagesDeploymentModal';
import { api } from './utils/api';

export function App() {
  const [activeModule, setActiveModule] = useState('naive_bayes');
  const [completedModules, setCompletedModules] = useState(['naive_bayes']);
  const [modulesList, setModulesList] = useState([]);
  const [currentModuleData, setCurrentModuleData] = useState({});

  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [isInterviewOpen, setIsInterviewOpen] = useState(false);
  const [isGhPagesOpen, setIsGhPagesOpen] = useState(false);

  const [quizzesData, setQuizzesData] = useState({});
  const [ghPagesManifest, setGhPagesManifest] = useState({});

  useEffect(() => {
    async function init() {
      try {
        const [mRes, qRes, ghRes] = await Promise.all([
          api.getModules(),
          api.getQuizzes(),
          api.getGhPagesManifest()
        ]);
        if (mRes.success) setModulesList(mRes.modules);
        if (qRes.success) setQuizzesData(qRes.data);
        if (ghRes.success) setGhPagesManifest(ghRes);
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function loadModule() {
      try {
        const res = await api.getModule(activeModule);
        if (res.success) {
          setCurrentModuleData(res.module);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadModule();
  }, [activeModule]);

  const markCompleteAndOpenQuiz = () => {
    if (!completedModules.includes(activeModule)) {
      setCompletedModules([...completedModules, activeModule]);
    }
    setIsQuizOpen(true);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        onOpenQuiz={() => setIsQuizOpen(true)}
        onOpenInterview={() => setIsInterviewOpen(true)}
        onOpenGhPages={() => setIsGhPagesOpen(true)}
        completedModules={completedModules}
      />

      <main className="main-content">
        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>
          <SidebarNav
            modules={modulesList}
            activeModule={activeModule}
            setActiveModule={setActiveModule}
            completedModules={completedModules}
          />

          <div>
            {activeModule === 'naive_bayes' && (
              <NaiveBayesLesson
                moduleData={currentModuleData}
                onComplete={markCompleteAndOpenQuiz}
              />
            )}
            {activeModule === 'evaluation_metrics' && (
              <EvaluationMetricsLesson
                moduleData={currentModuleData}
                onComplete={markCompleteAndOpenQuiz}
              />
            )}
            {activeModule === 'calculus_gradients' && (
              <CalculusGradientsLesson
                moduleData={currentModuleData}
                onComplete={markCompleteAndOpenQuiz}
              />
            )}
            {activeModule === 'backprop_chainrule' && (
              <BackpropagationLesson
                moduleData={currentModuleData}
                onComplete={markCompleteAndOpenQuiz}
              />
            )}
          </div>
        </div>
      </main>

      <MasteryQuizModal
        isOpen={isQuizOpen}
        onClose={() => setIsQuizOpen(false)}
        quizzes={quizzesData.quizzes || {}}
        activeModule={activeModule}
      />

      <InterviewPrepDeck
        isOpen={isInterviewOpen}
        onClose={() => setIsInterviewOpen(false)}
        flashcards={quizzesData.interview_flashcards || []}
      />

      <GhPagesDeploymentModal
        isOpen={isGhPagesOpen}
        onClose={() => setIsGhPagesOpen(false)}
        manifest={ghPagesManifest}
      />
    </div>
  );
}

export default App;
