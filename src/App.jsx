import React, { useState, useEffect, useRef } from "react";
import lottie from "lottie-web";
import robotAnimation from "./assets/robot.json";
import { FaCheckCircle } from "react-icons/fa";

function App() {
  const [currentQuestion, setCurrentQuestion] = useState("Hi! Ready to start your interview?");
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interviewStep, setInterviewStep] = useState(-1);
  const [questionCount, setQuestionCount] = useState(1);
  
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
          totalQuestions: countRef.current
        }),
      });
      const data = await response.json();
      const finished = data.isFinished === true || data.isFinished === "true";

      speak(data.feedback, () => {
        if (finished || countRef.current >= 10) {
          setCurrentQuestion("Interview completed. Excellent job!");
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
      speak("I didn't catch that. Please type or speak your answer.", () => startListening());
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
        // Voice එකෙන් එන දේ transcript එකට සෙට් කරනවා
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
    const intro = "Welcome! Please introduce yourself and your technical background.";
    setCurrentQuestion(intro);
    speak(intro, () => startListening());
  };

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

        <p className="text-lg font-medium mb-6 italic min-h-[60px] text-slate-200">
          "{currentQuestion}"
        </p>

        {/* Transcript Area: මෙතන දැන් Type කරන්නත් පුළුවන් */}
        <div className="bg-slate-950/80 p-4 rounded-2xl text-left text-sm text-slate-400 mb-6 border border-slate-800 relative transition-all focus-within:border-blue-500/50">
          <span className="text-[10px] text-blue-400 font-bold block mb-2 uppercase tracking-widest">
            Your Answer (Speak or Type)
          </span>
          
          <textarea
            className="w-full bg-transparent text-slate-200 border-none outline-none resize-none min-h-[100px] pr-10 leading-relaxed custom-scrollbar"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)} // 👈 User ට Type කරන්න ඉඩ දෙනවා
            placeholder={isListening ? "Listening... or click here to type" : "Waiting to start..."}
          />
          
          {isListening && (
            <button 
              onClick={handleManualDone} 
              className="absolute right-3 bottom-3 text-green-500 hover:text-green-400 transition-all active:scale-90"
              title="Submit Answer"
            >
              <FaCheckCircle size={30} />
            </button>
          )}
        </div>

        {interviewStep === -1 ? (
          <button 
            onClick={startInterview} 
            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-lg transition-all shadow-lg shadow-blue-600/20 active:scale-95"
          >
            START 10-ROUND SESSION
          </button>
        ) : (
          <div className="py-3 px-6 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black tracking-widest">
            {interviewStep === 100 ? "COMPLETED" : `ROUND ${questionCount} OF 10`}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;