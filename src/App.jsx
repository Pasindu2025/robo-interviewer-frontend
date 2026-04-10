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
  const [category, setCategory] = useState("Software Engineer"); 
  const [finalReport, setFinalReport] = useState(""); 

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
          category: category 
        }),
      });

      const data = await response.json();
      const finished = data.isFinished === true || data.isFinished === "true";

      speak(data.feedback, () => {
        if (finished || countRef.current >= 10) {
          setFinalReport(data.feedback);
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
      speak("Let's move to the next question.", () => startListening());
    }
  };

  const handleManualDone = () => {
    if (transcript.trim().length > 2) {
      callAI(transcript.trim());
    } else {
      speak("Please answer first.", () => startListening());
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
          } catch (e) {}
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
    } catch (e) {}
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
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: robotAnimation,
      });
      return () => anim.destroy();
    }
  }, []);

  return (
    /* h-screen වෙනුවට min-h-screen දාලා overflow හදල තියෙන්නේ */
    <div className="min-h-screen w-full bg-[#0f172a] text-white flex flex-col items-center justify-center p-4 font-sans overflow-y-auto">
      
      <h1 className="text-2xl font-black text-blue-400 mb-8 text-center italic tracking-widest">
        ROBO INTERVIEWER PRO
      </h1>

      <div className="bg-[#1e293b]/80 backdrop-blur-md p-6 sm:p-8 rounded-[2.5rem] w-full max-w-md border border-slate-700/50 text-center shadow-2xl transition-all">
        
        <div className="w-28 h-28 mx-auto mb-6 bg-[#020617] rounded-full border-2 border-blue-500/10 flex items-center justify-center overflow-hidden">
          <div ref={animeContainer} className="w-full h-full scale-110"></div>
        </div>

        {interviewStep === 100 ? (
          <div className="animate-in fade-in duration-500">
            <h2 className="text-xl font-bold text-green-400 mb-4 uppercase tracking-wider">Final Report</h2>

            <div className="bg-[#020617] p-5 rounded-2xl text-left text-sm text-gray-300 mb-6 max-h-64 overflow-y-auto custom-scrollbar border border-slate-800 leading-relaxed">
              {finalReport}
            </div>

            <button 
              onClick={restartApp} 
              className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black shadow-lg shadow-blue-900/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <FaUndo /> RESTART SESSION
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-[70px] flex items-center justify-center mb-6">
               <p className="italic text-gray-200 text-lg leading-snug">"{currentQuestion}"</p>
            </div>

            {interviewStep === -1 && (
              <div className="mb-4 animate-in slide-in-from-bottom-2 duration-300">
                <label className="text-[10px] text-blue-400 font-bold block mb-2 uppercase tracking-widest text-left ml-2">Select Your Role</label>
                <select 
                  className="w-full bg-[#020617] text-white p-4 rounded-2xl border border-slate-700 outline-none focus:border-blue-500 transition-all cursor-pointer appearance-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Software Engineer">Software Engineer</option>
                  <option value="AI Developer">AI Developer</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Full Stack Engineer">Full Stack Engineer</option>
                </select>
              </div>
            )}

            <div className="bg-[#020617] p-4 rounded-2xl mb-6 relative border border-slate-800 focus-within:border-blue-500/50 transition-all">
              <span className="text-[10px] text-blue-400 font-bold block mb-2 uppercase tracking-widest text-left">Real-time Transcript</span>
              <textarea
                className="w-full bg-transparent outline-none text-white min-h-[120px] resize-none pr-10 leading-relaxed"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={isListening ? "Listening... Speak or Type" : "Select role to begin..."}
              />

              {isListening && (
                <button 
                  onClick={handleManualDone} 
                  className="absolute bottom-4 right-4 text-green-500 hover:text-green-400 transition-all active:scale-90"
                >
                  <FaCheckCircle size={32} />
                </button>
              )}
            </div>

            {interviewStep === -1 ? (
              <button 
                onClick={startInterview} 
                className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-lg transition-all shadow-xl shadow-blue-900/20 active:scale-95"
              >
                START INTERVIEW
              </button>
            ) : (
              <div className="py-2 px-6 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black text-xs uppercase tracking-[0.2em] inline-block">
                Question {questionCount} / 10
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;