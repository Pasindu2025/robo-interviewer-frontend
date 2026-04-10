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

  // Parana phones wala colors override karanna menna me style tika danna
  const strictStyles = {
    bg: { backgroundColor: "rgb(15, 23, 42)" }, // Solid Slate 900
    card: { backgroundColor: "rgb(30, 41, 59)", border: "1px solid rgb(51, 65, 85)" }, // Solid Slate 800
    input: { backgroundColor: "rgb(2, 6, 23)", color: "#ffffff" },
    blueText: { color: "rgb(96, 165, 250)" }, // Bright Blue
    blueBtn: { backgroundColor: "rgb(37, 99, 235)", color: "#ffffff" }
  };

  return (
    <div style={strictStyles.bg} className="min-h-screen w-full text-white flex flex-col items-center justify-center p-4 font-sans overflow-y-auto">
      
      <h1 style={strictStyles.blueText} className="text-2xl font-black mb-8 text-center italic tracking-widest uppercase">
        ROBO INTERVIEWER PRO
      </h1>

      <div style={strictStyles.card} className="p-6 sm:p-8 rounded-[2rem] w-full max-w-md text-center shadow-2xl transition-all">
        
        <div style={strictStyles.input} className="w-28 h-28 mx-auto mb-6 rounded-full border border-blue-500 flex items-center justify-center overflow-hidden">
          <div ref={animeContainer} className="w-full h-full scale-110"></div>
        </div>

        {interviewStep === 100 ? (
          <div>
            <h2 className="text-xl font-bold text-green-400 mb-4">Final Report</h2>
            <div style={strictStyles.input} className="p-5 rounded-2xl text-left text-sm text-gray-300 mb-6 max-h-64 overflow-y-auto border border-slate-700">
              {finalReport}
            </div>
            <button onClick={restartApp} style={strictStyles.blueBtn} className="w-full py-4 rounded-xl font-black flex items-center justify-center gap-2">
              <FaUndo /> RESTART SESSION
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-[70px] mb-6">
               <p className="italic text-gray-200 text-lg leading-snug">"{currentQuestion}"</p>
            </div>

            {interviewStep === -1 && (
              <div className="mb-4 text-left">
                <label style={strictStyles.blueText} className="text-[10px] font-bold block mb-2 uppercase tracking-widest ml-2">Select Your Role</label>
                <select 
                  style={strictStyles.input}
                  className="w-full p-4 rounded-2xl border border-slate-700 outline-none appearance-none"
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

            <div style={strictStyles.input} className="p-4 rounded-2xl mb-6 relative border border-slate-700 text-left">
              <span style={strictStyles.blueText} className="text-[10px] font-bold block mb-2 uppercase tracking-widest">Transcript</span>
              <textarea
                className="w-full bg-transparent outline-none text-white min-h-[120px] resize-none pr-10"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={isListening ? "Listening..." : "Ready?"}
              />
              {isListening && (
                <button onClick={handleManualDone} className="absolute bottom-4 right-4 text-green-500">
                  <FaCheckCircle size={32} />
                </button>
              )}
            </div>

            {interviewStep === -1 ? (
              <button onClick={startInterview} style={strictStyles.blueBtn} className="w-full py-4 rounded-xl font-black text-lg">
                START INTERVIEW
              </button>
            ) : (
              <div style={strictStyles.blueText} className="font-black text-xs uppercase tracking-widest">
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