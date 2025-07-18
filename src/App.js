import React, { useState, useEffect } from 'react';
import { Briefcase, Cpu, BarChart2, Megaphone, Users, LineChart, ChevronRight, CheckCircle, XCircle, Star, Lightbulb, Mail, Send } from 'lucide-react';

// --- Data for Personas and Scenarios ---
const personaData = {
  HR: {
    icon: <Users className="w-12 h-12 mx-auto text-indigo-500" />,
    name: 'HR Manager',
    scenario: 'Your company is experiencing a higher-than-average employee turnover rate in the engineering department. You need to understand the root causes and propose a retention strategy.',
    task: 'Craft a prompt for an AI assistant to analyze anonymous exit interview data and generate a report outlining the main reasons for turnover and suggesting three actionable retention initiatives.',
    idealPrompt: "As an HR Manager, analyze the provided anonymous exit interview data for the engineering department. Generate a report in markdown format that first outlines the top 3-5 primary reasons for employee turnover, supported by data points. Then, propose three distinct and actionable retention initiatives to address these issues."
  },
  IT: {
    icon: <Cpu className="w-12 h-12 mx-auto text-sky-500" />,
    name: 'IT Specialist',
    scenario: 'The marketing team needs a new cloud-based solution for managing their large video files. The solution must be secure, cost-effective, and integrate with existing project management tools.',
    task: 'Write a prompt to an AI assistant to compare the top three cloud storage providers (e.g., AWS S3, Google Cloud Storage, Azure Blob Storage) for this specific use case. The output should be a comparison table.',
    idealPrompt: "Compare AWS S3, Google Cloud Storage, and Azure Blob Storage for a marketing team's need to store and manage large video files. Create a comparison table that evaluates them on the following criteria: cost per TB, security features, integration capabilities with Asana and Trello, and ease of use for non-technical users."
  },
  Sales: {
    icon: <BarChart2 className="w-12 h-12 mx-auto text-emerald-500" />,
    name: 'Sales Director',
    scenario: 'Your sales team is struggling to effectively communicate the value proposition of a new, complex software product to non-technical clients. They need a better way to explain it.',
    task: 'Create a prompt for an AI assistant to generate a simple, compelling sales pitch and a follow-up email template that explains the product\'s benefits using an analogy a layperson can understand.',
    idealPrompt: "Generate a sales toolkit for a new, complex software product aimed at non-technical clients. The toolkit should include: 1. A 100-word sales pitch that uses a simple analogy to explain the product's core value. 2. A follow-up email template that reinforces the analogy and clearly lists three key benefits."
  },
  Marketing: {
    icon: <Megaphone className="w-12 h-12 mx-auto text-rose-500" />,
    name: 'Marketing Coordinator',
    scenario: 'A new competitor has just launched a product that directly competes with your company\'s flagship offering. You need to quickly develop a counter-campaign.',
    task: 'Write a prompt for an AI assistant to perform a SWOT analysis of the new competitor based on their launch announcement and website, and then suggest three unique marketing angles for your counter-campaign.',
    idealPrompt: "Perform a SWOT analysis (Strengths, Weaknesses, Opportunities, Threats) for our new competitor, 'CompetitorX', based on their recent product launch announcement and website content. Based on the analysis, generate three distinct and creative marketing angles for a counter-campaign that highlights our product's unique strengths."
  },
  'Data Analyst': {
    icon: <LineChart className="w-12 h-12 mx-auto text-amber-500" />,
    name: 'Data Analyst',
    scenario: 'You have been given a large dataset of customer purchase history from the last quarter. The Head of Product wants to know which product categories are most frequently purchased together.',
    task: 'Formulate a prompt for an AI assistant (that can execute code) to analyze the dataset and identify the top five most frequent itemsets (pairs of product categories bought together). The output should be a list of these pairs and their frequency.',
    idealPrompt: "Analyze the attached customer purchase history dataset (CSV). Write and execute a Python script to perform a market basket analysis. Your goal is to identify the top five most frequent itemsets (pairs of product categories). The final output should be a numbered list showing each pair and its support/frequency score."
  },
  'Business Analyst': {
    icon: <Briefcase className="w-12 h-12 mx-auto text-fuchsia-500" />,
    name: 'Business Analyst',
    scenario: 'The logistics department is complaining about inefficiencies in the current workflow for processing incoming shipments. You need to document the current process and identify bottlenecks.',
    task: 'Construct a prompt for an AI assistant to generate a list of targeted questions to ask logistics staff in order to map out the current "as-is" process and pinpoint specific areas of inefficiency.',
    idealPrompt: "Act as a Business Analyst. Generate a comprehensive list of interview questions to ask logistics staff about the current workflow for processing incoming shipments. The questions should be structured to first map out the entire 'as-is' process step-by-step, and then to specifically identify bottlenecks, pain points, and areas of inefficiency."
  },
};

// --- Scoring Logic ---
const scorePrompt = (prompt, persona) => {
  let score = 0;
  let breakdown = [];
  let recommendations = [];

  // 1. Clarity and Specificity (30 points)
  let clarityScore = 0;
  if (prompt.length > 40) clarityScore += 10;
  if (prompt.split(' ').length > 15) clarityScore += 10;
  const clarityKeywords = ['generate', 'create', 'analyze', 'compare', 'write', 'list', 'summarize', 'explain', 'identify', 'perform', 'act as'];
  if (clarityKeywords.some(kw => prompt.toLowerCase().includes(kw))) clarityScore += 10;
  score += clarityScore;
  breakdown.push({ criteria: 'Clarity & Specificity', score: clarityScore, max: 30 });
  if (clarityScore < 20) {
    recommendations.push("Improve clarity by using strong action verbs (e.g., 'Generate', 'Analyze') and being more specific about your desired outcome.");
  }

  // 2. Context (25 points)
  let contextScore = 0;
  const personaKeywords = persona.toLowerCase().split(' ');
  if (personaKeywords.some(kw => prompt.toLowerCase().includes(kw)) || prompt.toLowerCase().includes('act as')) contextScore += 10;
  if (prompt.toLowerCase().includes('company') || prompt.toLowerCase().includes('team') || prompt.toLowerCase().includes('department')) contextScore += 5;
  if (prompt.length > 100) contextScore += 10; // Longer prompts often have more context
  score += contextScore;
  breakdown.push({ criteria: 'Context', score: contextScore, max: 25 });
  if (contextScore < 15) {
    recommendations.push("Add more context. Mention the intended audience, the specific situation, or your role (e.g., 'As an HR Manager...') to guide the AI better.");
  }

  // 3. Constraints and Format (20 points)
  let formatScore = 0;
  const formatKeywords = ['table', 'list', 'report', 'email', 'summary', 'analysis', 'pitch', 'template', 'json', 'markdown', 'script', 'toolkit'];
  if (formatKeywords.some(kw => prompt.toLowerCase().includes(kw))) formatScore += 10;
  if (prompt.match(/\d+/g)) formatScore += 5; // Contains numbers (e.g., 'top 3', '500 words')
  if (prompt.toLowerCase().includes('format')) formatScore += 5;
  score += formatScore;
  breakdown.push({ criteria: 'Constraints & Format', score: formatScore, max: 20 });
  if (formatScore < 10) {
    recommendations.push("Specify the desired output format (e.g., 'in a table', 'as a markdown report') to get structured results.");
  }

  // 4. Persona-Task Alignment (15 points)
  let alignmentScore = 0;
  const taskKeywords = personaData[persona].task.toLowerCase().split(' ').filter(w => w.length > 4);
  const promptWords = new Set(prompt.toLowerCase().split(' '));
  const matchingKeywords = taskKeywords.filter(kw => promptWords.has(kw));
  if (matchingKeywords.length > 1) alignmentScore += 15;
  else if (matchingKeywords.length > 0) alignmentScore += 8;
  score += alignmentScore;
  breakdown.push({ criteria: 'Persona-Task Alignment', score: alignmentScore, max: 15 });
  if (alignmentScore < 10) {
    recommendations.push("Ensure your prompt directly addresses the core task described in the scenario. Reread the task and incorporate key terms.");
  }

  // 5. Action Verb Usage (10 points)
  let actionVerbScore = 0;
  const strongActionVerbs = ['generate', 'create', 'analyze', 'compare', 'write', 'construct', 'formulate', 'perform', 'develop', 'act as'];
  if (strongActionVerbs.some(v => prompt.trim().toLowerCase().startsWith(v) || prompt.trim().toLowerCase().startsWith('act as'))) {
    actionVerbScore = 10;
  }
  score += actionVerbScore;
  breakdown.push({ criteria: 'Action Verb Usage', score: actionVerbScore, max: 10 });
  if (actionVerbScore === 0) {
    recommendations.push("Start your prompt with a clear, strong action verb to make your request unambiguous.");
  }

  return { totalScore: Math.min(score, 100), breakdown, recommendations };
};


// --- Components ---

const PersonaSelector = ({ onSelectPersona }) => (
  <div className="text-center">
    <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Prompt Challenge</h1>
    <p className="mt-2 text-lg text-gray-600">Select a persona to start the challenge.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 max-w-4xl mx-auto">
      {Object.entries(personaData).map(([key, { icon, name }]) => (
        <button
          key={key}
          onClick={() => onSelectPersona(key)}
          className="group p-6 bg-white rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 text-center"
        >
          {icon}
          <h3 className="mt-4 text-xl font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors duration-300">{name}</h3>
        </button>
      ))}
    </div>
  </div>
);

const PromptChallenge = ({ persona, onBack, onSubmit }) => {
  const [prompt, setPrompt] = useState('');
  const { name, scenario, task } = personaData[persona];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (prompt.trim()) {
      onSubmit(prompt);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <button onClick={onBack} className="mb-6 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors">
        &larr; Back to Personas
      </button>
      <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="flex-shrink-0">{personaData[persona].icon}</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{name} Challenge</h2>
            <p className="text-gray-500">Your role for this challenge.</p>
          </div>
        </div>
        <div className="mt-6 space-y-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-700">Problem Scenario:</h3>
            <p className="text-gray-600 bg-gray-50 p-4 rounded-lg mt-2 border-l-4 border-indigo-300">{scenario}</p>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-700">Your Task:</h3>
            <p className="text-gray-600 bg-gray-50 p-4 rounded-lg mt-2 border-l-4 border-sky-300">{task}</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="mt-8">
          <label htmlFor="prompt-input" className="block text-lg font-semibold text-gray-700 mb-2">
            Craft Your Prompt Here:
          </label>
          <textarea
            id="prompt-input"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow"
            placeholder="e.g., 'Analyze the provided exit interview data...'"
          />
          <button
            type="submit"
            disabled={!prompt.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-not-allowed transform hover:scale-105"
          >
            Submit & Score Prompt <ChevronRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

const Results = ({ persona, prompt, results, onRestart }) => {
    const { totalScore, breakdown, recommendations } = results;
    const { idealPrompt } = personaData[persona];
    const scoreColor = totalScore > 75 ? 'text-emerald-500' : totalScore > 50 ? 'text-amber-500' : 'text-rose-500';
    const scoreMessage = totalScore > 85 ? "Excellent Prompt!" : totalScore > 65 ? "Good Prompt!" : totalScore > 40 ? "Needs Improvement" : "Could be much better";

    const [email, setEmail] = useState('');
    const [emailStatus, setEmailStatus] = useState('idle'); // idle, sending, sent, error

    const handleSendEmail = (e) => {
        e.preventDefault();
        if (!email) return;

        setEmailStatus('sending');
        // Simulate an API call
        setTimeout(() => {
            // Simulate a successful response
            setEmailStatus('sent');
        }, 1500);
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
             <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center">Your Results</h1>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Prompt & Score */}
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 flex flex-col">
                    <div>
                        <h2 className="text-xl font-bold text-gray-700">Your Submitted Prompt</h2>
                        <p className="mt-2 text-gray-600 bg-gray-50 p-4 rounded-lg border">{prompt}</p>
                    </div>
                    <div className="mt-8 text-center flex-grow flex flex-col justify-center">
                        <h3 className="text-lg font-semibold text-gray-600">Total Score</h3>
                        <p className={`text-7xl font-bold my-2 ${scoreColor}`}>{totalScore}<span className="text-3xl text-gray-400">/100</span></p>
                        <p className={`text-xl font-semibold ${scoreColor}`}>{scoreMessage}</p>
                    </div>
                </div>

                {/* Right Side: Breakdown & Recommendations */}
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                    <h2 className="text-xl font-bold text-gray-700">Score Breakdown</h2>
                    <div className="mt-4 space-y-4">
                        {breakdown.map(({ criteria, score, max }) => (
                            <div key={criteria}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-gray-600">{criteria}</span>
                                    <span className="font-semibold text-gray-800">{score} / {max}</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${(score / max) * 100}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <hr className="my-6" />

                    <h2 className="text-xl font-bold text-gray-700">Recommendations</h2>
                    <ul className="mt-4 space-y-3">
                        {recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-3">
                                <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-1" />
                                <span className="text-gray-600">{rec}</span>
                            </li>
                        ))}
                         {recommendations.length === 0 && (
                            <li className="flex items-start gap-3">
                                <Star className="w-5 h-5 text-amber-400 flex-shrink-0 mt-1" />
                                <span className="text-gray-600 font-semibold">Fantastic work! This is a well-structured and effective prompt.</span>
                            </li>
                        )}
                    </ul>

                    <hr className="my-6" />

                    <h2 className="text-xl font-bold text-gray-700 flex items-center gap-2">
                        <Lightbulb className="w-6 h-6 text-amber-500" />
                        Ideal Prompt Example
                    </h2>
                    <div className="mt-4 p-4 bg-indigo-50 border-l-4 border-indigo-400 rounded-r-lg">
                        <p className="text-gray-700 font-medium">{idealPrompt}</p>
                    </div>

                </div>
            </div>
             <div className="text-center mt-8">
                <button 
                    onClick={onRestart}
                    className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105"
                >
                    Try Another Challenge
                </button>
            </div>

            <div className="max-w-xl mx-auto mt-12 bg-white p-8 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-bold text-gray-700 text-center">Get a Copy of Your Results</h3>
                <p className="text-center text-gray-500 mt-2">Enter your email to receive a copy of this analysis.</p>
                {emailStatus === 'sent' ? (
                     <div className="text-center p-4 mt-4 bg-emerald-50 text-emerald-700 rounded-lg">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                        <p className="font-semibold">Success! Your results have been sent to {email}.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSendEmail} className="mt-4 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-grow">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your.email@example.com"
                                required
                                className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={emailStatus === 'sending'}
                            className="flex items-center justify-center gap-2 bg-emerald-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-emerald-700 transition-all duration-300 disabled:bg-gray-400 disabled:cursor-wait"
                        >
                            {emailStatus === 'sending' ? 'Sending...' : 'Send Results'}
                            {emailStatus !== 'sending' && <Send className="w-5 h-5" />}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};


// --- Main App Component ---
export default function App() {
  const [appState, setAppState] = useState('persona-selection'); // persona-selection, prompt-challenge, results
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [userPrompt, setUserPrompt] = useState('');
  const [scoreResults, setScoreResults] = useState(null);

  useEffect(() => {
    // Add a simple fade-in animation class to the body on mount
    document.body.classList.add('animate-fade-in');
  }, []);

  const handleSelectPersona = (persona) => {
    setSelectedPersona(persona);
    setAppState('prompt-challenge');
  };

  const handleBackToPersonas = () => {
    setSelectedPersona(null);
    setAppState('persona-selection');
  };

  const handleSubmitPrompt = (prompt) => {
    setUserPrompt(prompt);
    const results = scorePrompt(prompt, selectedPersona);
    setScoreResults(results);
    setAppState('results');
  };

  const handleRestart = () => {
    setAppState('persona-selection');
    setSelectedPersona(null);
    setUserPrompt('');
    setScoreResults(null);
  };

  const renderContent = () => {
    switch (appState) {
      case 'prompt-challenge':
        return <PromptChallenge persona={selectedPersona} onBack={handleBackToPersonas} onSubmit={handleSubmitPrompt} />;
      case 'results':
        return <Results persona={selectedPersona} prompt={userPrompt} results={scoreResults} onRestart={handleRestart} />;
      case 'persona-selection':
      default:
        return <PersonaSelector onSelectPersona={handleSelectPersona} />;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen font-sans p-4 sm:p-6 md:p-8">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.5s ease-out forwards; }
      `}</style>
      <main>
        {renderContent()}
      </main>
      <footer className="text-center mt-12 pb-4">
        <p className="text-gray-500 text-sm">A Prompt Engineering Tool by Gemini</p>
      </footer>
    </div>
  );
}
