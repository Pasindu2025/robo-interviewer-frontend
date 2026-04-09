import React, { useState, useEffect, useRef } from "react";
import lottie from "lottie-web";
import robotAnimation from "./assets/robot.json";
import { FaCheckCircle } from "react-icons/fa"; // Run: npm install react-icons

function App() {
  const [currentQuestion, setCurrentQuestion] = useState("Hi! Ready to start your interview?");
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [interviewStep, setInterviewStep] = useState(-1);
  const [questionCount, setQuestionCount] = useState(1);
  
  const countRef = useRef(1);
  const animeContainer = useRef(null);
  const lottieInstance = useRef(null); 
  const recognitionRef = useRef(null);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const callAI = async (finalText) => {
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
          const exitMsg = "Interview session completed. Excellent job!";
          setCurrentQuestion(exitMsg);
          speak(exitMsg, () => setInterviewStep(100));
        } else {
          countRef.current += 1;
          setQuestionCount(countRef.current);
          setCurrentQuestion(data.nextQuestion);
          speak(data.nextQuestion, () => startListening());
        }
      });
    } catch (error) {
      console.error("Error calling AI:", error);
      speak("I see. Let's move to the next technical question.", () => startListening());
    }
  };

  // ✅ New Manual Trigger Function
  const handleManualDone = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop(); // Stops the mic
      const cleanText = transcript.replace(/done/gi, "").trim();
      
      if (cleanText.length > 2) {
        callAI(cleanText);
      } else {
        // If they clicked without saying much, just move on or ask to repeat
        speak("I didn't catch that. Could you please repeat?", () => startListening());
      }
    }
  };

  useEffect(() => {
    if (SpeechRecognition && !recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let finalText = "";
        let interimText = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalText += event.results[i][0].transcript;
          } else {
            interimText += event.results[i][0].transcript;
          }
        }

        const combined = (finalText + interimText).toLowerCase();
        setTranscript(combined);

        // Keyword trigger still works as a backup
        if (combined.includes("done")) {
          recognitionRef.current.stop();
          const cleanText = combined.replace(/done/gi, "").trim();
          setTimeout(() => {
            if (cleanText.length > 2) {
                callAI(cleanText);
            }
          }, 500);
        }
      };

      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = (event) => console.error("Mic Error:", event.error);
    }
  }, [SpeechRecognition, transcript]); // Added transcript to dependency to ensure manual trigger has latest data

  const speak = (text, callback) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = "en-US";
    utt.onend = () => callback && callback();
    window.speechSynthesis.speak(utt);
  };

  const startListening = () => {
    setIsListening(true);
    setTranscript("");
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.log("Mic already active");
    }
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
      lottieInstance.current = lottie.loadAnimation({
        container: animeContainer.current,
        renderer: "svg",
        loop: true,
        autoplay: true,
        animationData: robotAnimation,
      });
      return () => { if (lottieInstance.current) lottieInstance.current.destroy(); };
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 font-sans">
      <h1 className="text-3xl font-black text-blue-500 mb-8 tracking-tighter uppercase italic">
        Robo Interviewer Pro v10
      </h1>

      <div className="bg-slate-800/50 backdrop-blur-md p-10 rounded-[3rem] w-full max-w-md shadow-2xl border border-slate-700 text-center">
        
        <div className="w-40 h-40 mx-auto mb-6 bg-slate-900 rounded-full flex items-center justify-center overflow-hidden border-4 border-blue-500/20 shadow-inner">
          <div ref={animeContainer} className="w-full h-full scale-110"></div>
        </div>

        <p className="text-xl font-medium text-blue-50 mb-6 leading-relaxed italic min-h-[80px]">
          "{currentQuestion}"
        </p>

        <div className="bg-slate-950/80 p-5 rounded-2xl text-left text-sm text-slate-400 mb-8 border border-slate-800 relative">
          <span className="text-[10px] text-blue-400 font-bold uppercase mb-2 block">Live Transcript</span>
          <p className="min-h-[40px] break-words pr-10">
            {isListening ? (transcript || "Listening... say 'Done' or click the icon") : "Waiting..."}
          </p>
          
          {/* ✅ Floating Done Button Icon */}
          {isListening && (
            <button 
              onClick={handleManualDone}
              className="absolute right-4 bottom-4 text-green-500 hover:text-green-400 transition-transform active:scale-90"
              title="Finish Answer"
            >
              <FaCheckCircle size={28} />
            </button>
          )}
        </div>

        {interviewStep === -1 ? (
          <button 
            onClick={startInterview} 
            className="w-full bg-blue-600 hover:bg-blue-500 py-4 rounded-2xl font-black text-lg transition-all transform active:scale-95 shadow-lg shadow-blue-600/20"
          >
            START 10-ROUND SESSION
          </button>
        ) : (
          <div className="flex flex-col gap-4">
             {/* Show a secondary button during rounds for better accessibility */}
             {isListening && (
               <button 
                onClick={handleManualDone}
                className="w-full bg-green-600 hover:bg-green-500 py-3 rounded-xl font-bold transition-all"
               >
                 I'M DONE SPEAKING
               </button>
             )}
            <div className="py-4 px-6 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 font-black">
              {interviewStep === 100 ? "COMPLETED" : `ROUND ${questionCount} OF 10`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;