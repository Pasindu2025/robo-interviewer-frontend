import React, { useState, useEffect, useRef } from "react";
import lottie from "lottie-web";
import robotAnimation from "./assets/robot.json";
import { FaCheckCircle, FaUndo } from "react-icons/fa";

function App() {
  const [currentQuestion, setCurrentQuestion] = useState("Hi! Ready to start your interview?");
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interviewStep, setInterviewStep] = useState(-1);
  const [questionCount, setQuestionCount] = useState(1);
  const [category, setCategory] = useState("Java Developer"); // 👈 Default Category
  const [finalReport, setFinalReport] = useState(""); // 👈 Final feedback එක තියාගන්න

  const countRef = useRef(1);
  const animeContainer = useRef(null);
  const recognitionRef = useRef(null);
  const isManuallyStopped = useRef(false);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const callAI = async (finalText) => {
    isManuallyStopped.current = true;
    if (recognitionRef.current) recognitionRef.current.stop();
    
    setCurrentQuestion("Analyzing your answer...");
    try {
      const response = await fetch("https://robo-interviewer-backend-production.up.railway.app/api/interview/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQuestion,
          answer: finalText,
          totalQuestions: countRef.current,
          category: category // 👈 Category එක Backend එකට යවනවා
        }),
      });
      const data = await response.json();
      const finished = data.isFinished === true || data.isFinished === "true";

      speak(data.feedback, () => {
        if (finished || countRef.current >= 10) {
          setFinalReport(data.feedback); // Final summary එක save කරනවා
          setCurrentQuestion("Interview Session Completed!");
          setInterviewStep(100);
        } else {
          countRef.current += 1;
          setQuestionCount(countRef.current);
          setCurrentQuestion(data.nextQuestion);
          setTranscript(""); 
          speak(data.nextQuestion, () => startListening());
        }
      });
    } catch (error) {
      console.error("Error:", error);
      speak("I see. Let's move on.", () => startListening());
    }
  };

  const handleManualDone = () => {
    if (transcript.trim().length > 2) {
      callAI(transcript.trim());
    } else {
      speak("Please type or speak your answer.", () => startListening());
    }
  };

  useEffect(() => {
    if (SpeechRecognition && !recognitionRef.current) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentResult = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentResult += event.results[i][0].transcript;
        }
        setTranscript(currentResult); 

        if (currentResult.toLowerCase().includes("done")) {
          callAI(currentResult.replace(/done/gi, "").trim());
        }
      };

      recognition.onend = () => {
        if (!isManuallyStopped.current) {
          try {
            recognition.start();
          } catch (e) { console.log("Restarting..."); }
        } else {
          setIsListening(false);
        }
      };
      recognitionRef.current = recognition;
    }
  }, [SpeechRecognition]);

  const speak = (text, callback) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.onend = () => callback && callback();
    window.speechSynthesis.speak(utt);
  };

  const startListening = () => {
    isManuallyStopped.current = false;
    setIsListening(true);
    try {
      recognitionRef.current.start();
    } catch (e) { console.log("Active"); }
  };

  const startInterview = () => {
    setInterviewStep(0);
    countRef.current = 1;
    setQuestionCount(1);
    const intro = `Welcome! Let's start the ${category} interview. Please introduce yourself.`;
    setCurrentQuestion(intro);
    speak(intro, () => startListening());
  };

  const restartApp = () => window.location.reload();

  useEffect(() => {
    if (animeContainer.current) {
      const anim = lottie.loadAnimation({
        container: animeContainer.current,
        renderer: "svg", loop: true, autoplay: true,
        animationData: robotAnimation,
      });
      return () => anim.destroy();
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 font-sans">
      <h1 className="text-2xl font-black text-blue-500 mb-8 italic tracking-widest">ROBO INTERVIEWER PRO</h1>
      
      <div className="bg-slate-800/50 backdrop-blur-md p-8 rounded-[2.5rem] w-full max-w-md border border-slate-700 text-center shadow-2xl">
        
        <div className="w-32 h-32 mx-auto mb-6 bg-slate-900 rounded-full border-2 border-blue-500/20 flex items-center justify-center overflow-hidden">
          <div ref={animeContainer} className="w-full h-full scale-110"></div>
        </div>

        {interviewStep === 100 ? (
          // Final Result Screen
          <div className="animate-fade-in">
            <h2 className="text-xl font-bold text-green-400 mb-4">Final Report</h2>
            <div className="bg-slate-950/80 p-5 rounded-2xl text-left text-sm text-slate-300 mb-6 border border-slate-800 max-h-60 overflow-y-auto custom-scrollbar">
              {finalReport}
            </div>
            <button onClick={restartApp} className="flex items-center justify-center gap-2 w-full bg-blue-600 py-4 rounded-2xl font-black"><FaUndo /> RESTART</button>
          </div>
        ) : (
          <>
            <p className="text-lg font-medium mb-6 italic min-h-[60px] text-slate-200">"{currentQuestion}"</p>

            {interviewStep === -1 && (
              <div className="mb-6">
                <label className="text-[10px] text-blue-400 font-bold block mb-2 uppercase tracking-widest text-left">Target Role</label>
                <select 
                  className="w-full bg-slate-900 text-white p-4 rounded-2xl border border-slate-700 outline-none focus:border-blue-500"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Java Developer">Java Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Python Developer">Python Developer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Full Stack Engineer">Full Stack Engineer</option>
                </select>
              </div>
            )}

            <div className="bg-slate-950/80 p-4 rounded-2xl text-left text-sm text-slate-400 mb-6 border border-slate-800 relative focus-within:border-blue-500/50">
              <span className="text-[10px] text-blue-400 font-bold block mb-2 uppercase tracking-widest">Answer Area</span>
              <textarea
                className="w-full bg-transparent text-slate-200 border-none outline-none resize-none min-h-[100px] pr-10 leading-relaxed custom-scrollbar"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={isListening ? "Listening... or click to type" : "Choose role and start"}
              />
              {isListening && (
                <button onClick={handleManualDone} className="absolute right-3 bottom-3 text-green-500 hover:text-green-400 transition-all active:scale-90">
                  <FaCheckCircle size={30} />
                </button>
              )}
            </div>

            {interviewStep === -1 ? (
              <button onClick={startInterview} className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-lg transition-all shadow-lg active:scale-95">START SESSION</button>
            ) : (
              <div className="py-3 px-6 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black tracking-widest">
                ROUND {questionCount} OF 10
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;