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
  const [category, setCategory] = useState("Software Engineer/Developer"); 
  const [finalReport, setFinalReport] = useState(""); 

  const countRef = useRef(1);
  const animeContainer = useRef(null);
  const recognitionRef = useRef(null);
  const isManuallyStopped = useRef(false);

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  const jobRoles = [
    "Software Engineer/Developer",
    "Data Scientist",
    "Data Analyst",
    "Cybersecurity Specialist",
    "Network Administrator",
    "Artificial Intelligence/Machine Learning Engineer",
    "Web Developer",
    "Mobile App Developer",
    "Database Administrator",
    "IT Consultant",
    "Systems Analyst",
    "Cloud Architect",
    "UX/UI Designer",
    "Game Developer",
    "DevOps Engineer",
    "Business Analyst (IT)",
    "Network Engineer",
    "Software Tester/QA Engineer",
    "Blockchain Developer",
    "Computer Systems Analyst"
  ];

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

  const strictStyles = {
    bg: { backgroundColor: "rgb(15, 23, 42)" }, 
    card: { backgroundColor: "rgb(30, 41, 59)", border: "1px solid rgb(51, 65, 85)" }, 
    input: { backgroundColor: "rgb(2, 6, 23)", color: "#ffffff" },
    blueText: { color: "rgb(96, 165, 250)" }, 
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
            <h2 className="text-xl font-bold text-green-400 mb-4 tracking-widest uppercase">Final Report</h2>
            <div style={strictStyles.input} className="p-5 rounded-2xl text-left text-sm text-gray-300 mb-6 max-h-64 overflow-y-auto border border-slate-700 leading-relaxed">
              {finalReport}
            </div>
            <button onClick={restartApp} style={strictStyles.blueBtn} className="w-full py-4 rounded-xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all">
              <FaUndo /> RESTART SESSION
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-[70px] mb-6 flex items-center justify-center">
               <p className="italic text-gray-200 text-lg leading-snug">"{currentQuestion}"</p>
            </div>

            {interviewStep === -1 && (
              <div className="mb-4 text-left">
                <label style={strictStyles.blueText} className="text-[10px] font-bold block mb-2 uppercase tracking-widest ml-2">Select Your Role</label>
                <select 
                  style={strictStyles.input}
                  className="w-full p-4 rounded-2xl border border-slate-700 outline-none appearance-none cursor-pointer"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {jobRoles.map((role, index) => (
                    <option key={index} value={role}>{role}</option>
                  ))}
                </select>
              </div>
            )}

            <div style={strictStyles.input} className="p-4 rounded-2xl mb-6 relative border border-slate-700 text-left">
              <span style={strictStyles.blueText} className="text-[10px] font-bold block mb-2 uppercase tracking-widest">Transcript</span>
              <textarea
                className="w-full bg-transparent outline-none text-white min-h-[120px] resize-none pr-10 leading-relaxed"
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder={isListening ? "Listening... Speak now" : "Ready to begin?"}
              />
              {isListening && (
                <button onClick={handleManualDone} className="absolute bottom-4 right-4 text-green-500 hover:text-green-400 active:scale-90 transition-all">
                  <FaCheckCircle size={32} />
                </button>
              )}
            </div>

            {interviewStep === -1 ? (
              <button onClick={startInterview} style={strictStyles.blueBtn} className="w-full py-4 rounded-xl font-black text-lg shadow-lg active:scale-95 transition-all">
                START INTERVIEW
              </button>
            ) : (
              <div style={strictStyles.blueText} className="font-black text-xs uppercase tracking-[0.2em] py-2 px-6 bg-blue-500/10 rounded-full border border-blue-500/20 inline-block">
                Question {questionCount} / 10
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Section */}
      <footer className="mt-10 text-[10px] text-slate-500 text-center pb-6 tracking-widest uppercase">
        <p>© 2026 ROBO INTERVIEWER PRO. ALL RIGHTS RESERVED.</p>
        <p className="mt-2 text-slate-400 font-bold">CREATED BY PASINDU LAKSHAN</p>
        <p className="mt-1 opacity-50">Educational Tool • Powered by AI</p>
      </footer>

    </div>
  );
}

export default App;