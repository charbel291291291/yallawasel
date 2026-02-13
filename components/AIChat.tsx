import React, { useState, useRef, useEffect } from "react";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Language } from "../translations";

interface AIChatProps {
  lang: Language;
}

// Elegant, distinguished Lebanese woman portrait
const EMILIA_AVATAR =
  "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?auto=format&fit=crop&w=256&q=80";

// Audio Processing Constants
const INPUT_SAMPLE_RATE = 16000;
const OUTPUT_SAMPLE_RATE = 24000;

const AIChat: React.FC<AIChatProps> = ({ lang }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [messages, setMessages] = useState<
    { role: "user" | "emilia"; text: string }[]
  >([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);

  // Transcriptions for active call
  const [currentTranscription, setCurrentTranscription] = useState<{
    user: string;
    emilia: string;
  }>({ user: "", emilia: "" });

  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionRef = useRef<any>(null);
  const audioContextsRef = useRef<{
    input?: AudioContext;
    output?: AudioContext;
  }>({});
  const outputNodeRef = useRef<GainNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const systemInstruction = `
    Your name is Emilia. You are a Lebanese luxury concierge agent for Yalla Wasel in Adonis. 
    Speak Lebanese Arabic ONLY. Use "أكيد", "ولا يهمّك", "تكرم عينك يا بيك", "من عيوني", "تؤبرني".
    You are an elegant, wise, and extremely polite female concierge. 
    Always respond with a helpful, hospitable, and high-class Lebanese tone.
  `;

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isMinimized, currentTranscription]);

  // Audio Encoding/Decoding Helpers
  const encode = (bytes: Uint8Array) => {
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++)
      binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++)
      bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number
  ) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startVoiceCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: INPUT_SAMPLE_RATE });
      const outputCtx = new (window.AudioContext ||
        (window as any).webkitAudioContext)({ sampleRate: OUTPUT_SAMPLE_RATE });
      const outNode = outputCtx.createGain();
      outNode.connect(outputCtx.destination);
      outNode.gain.value = volume / 100;

      audioContextsRef.current = { input: inputCtx, output: outputCtx };
      outputNodeRef.current = outNode;
      setIsCalling(true);

      const ai = new GoogleGenAI({
        apiKey:
          import.meta.env.VITE_GEMINI_API_KEY ||
          process.env.GEMINI_API_KEY ||
          "",
      });
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-12-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          // Switched to 'Kore' for a clear, elegant female voice
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          systemInstruction,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              if (isMuted) return;
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++)
                int16[i] = inputData[i] * 32768;
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: "audio/pcm;rate=16000",
                  },
                });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Transcriptions
            if (message.serverContent?.inputTranscription) {
              setCurrentTranscription((prev) => ({
                ...prev,
                user: (
                  prev.user +
                  " " +
                  message.serverContent?.inputTranscription?.text
                ).trim(),
              }));
            }
            if (message.serverContent?.outputTranscription) {
              setCurrentTranscription((prev) => ({
                ...prev,
                emilia: (
                  prev.emilia +
                  " " +
                  message.serverContent?.outputTranscription?.text
                ).trim(),
              }));
            }
            if (message.serverContent?.turnComplete) {
              setMessages((prev) => [
                ...prev,
                { role: "user", text: currentTranscription.user },
                { role: "emilia", text: currentTranscription.emilia },
              ]);
              setCurrentTranscription({ user: "", emilia: "" });
            }

            // Handle Audio
            const base64Audio =
              message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputCtx) {
              nextStartTimeRef.current = Math.max(
                nextStartTimeRef.current,
                outputCtx.currentTime
              );
              const audioBuffer = await decodeAudioData(
                decode(base64Audio),
                outputCtx,
                OUTPUT_SAMPLE_RATE,
                1
              );
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outNode);
              source.onended = () => sourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach((s) => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error("Live Error:", e),
          onclose: () => endVoiceCall(),
        },
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start call:", err);
      setIsCalling(false);
    }
  };

  const endVoiceCall = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextsRef.current.input) audioContextsRef.current.input.close();
    if (audioContextsRef.current.output)
      audioContextsRef.current.output.close();
    sourcesRef.current.forEach((s) => s.stop());
    sourcesRef.current.clear();
    sessionRef.current = null;
    setIsCalling(false);
    setIsMuted(false);
    setCurrentTranscription({ user: "", emilia: "" });
  };

  useEffect(() => {
    if (outputNodeRef.current) {
      outputNodeRef.current.gain.value = volume / 100;
    }
  }, [volume]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = { role: "user" as const, text };
    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setLoading(true);

    try {
      const ai = new GoogleGenAI({
        apiKey:
          import.meta.env.VITE_GEMINI_API_KEY ||
          process.env.GEMINI_API_KEY ||
          "",
      });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, userMsg].map((m) => ({
          parts: [{ text: m.text }],
        })),
        config: { systemInstruction, temperature: 0.8 },
      });
      setMessages((prev) => [
        ...prev,
        { role: "emilia", text: response.text || "تكرم عينك، عم بسمعك." },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "emilia",
          text: "صار في ضغط عالخط يا بيك، خليني جرب مرة تانية.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  return (
    <div
      className={`fixed bottom-6 ${
        lang === "ar" ? "left-6" : "right-6"
      } z-50 pointer-events-none`}
    >
      <div className="pointer-events-auto flex flex-col items-end gap-4">
        {/* Main Chat Window */}
        {isOpen && (
          <div
            className={`
            glass-panel rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.25)] 
            w-[340px] sm:w-[380px] border border-white/60 flex flex-col overflow-hidden 
            transition-all duration-500 ease-in-out origin-bottom
            ${
              isMinimized
                ? "h-20 translate-y-2 opacity-90 scale-95 shadow-lg"
                : "h-[550px] opacity-100 scale-100"
            }
            relative animate-3d-entrance
          `}
          >
            {/* Subtle Reflection Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none z-20"></div>

            {/* Header */}
            <div
              className={`
              bg-slate-900/95 p-4 flex justify-between items-center text-white relative z-30 shadow-lg transition-all duration-500
              ${isMinimized ? "h-full" : "h-20"}
            `}
              onClick={() => isMinimized && setIsMinimized(false)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={EMILIA_AVATAR}
                    className={`rounded-xl object-cover border border-white/20 shadow-md transition-all ${
                      isMinimized ? "w-10 h-10" : "w-12 h-12"
                    }`}
                  />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                      isCalling ? "bg-red-500 animate-pulse" : "bg-green-500"
                    }`}
                  ></span>
                </div>
                <div>
                  <h3 className="font-luxury font-bold text-lg leading-tight">
                    Emilia
                  </h3>
                  <p className="text-[9px] font-black opacity-50 uppercase tracking-[0.2em]">
                    {isCalling ? "Encrypted Call" : "Your Concierge"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMinimize}
                  className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all border border-white/10"
                >
                  <i
                    className={`fa-solid ${
                      isMinimized
                        ? "fa-up-right-and-down-left-from-center text-[10px]"
                        : "fa-minus"
                    }`}
                  ></i>
                </button>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (isCalling) endVoiceCall();
                  }}
                  className="w-8 h-8 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/40 active:scale-90 transition-all border border-red-500/20"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div
              className={`flex-1 overflow-hidden relative z-10 flex flex-col transition-opacity duration-300 ${
                isMinimized ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              {isCalling ? (
                /* CALL VIEW */
                <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50/50">
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse"></div>
                    <img
                      src={EMILIA_AVATAR}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-2xl relative z-10"
                    />
                    {isMuted && (
                      <div className="absolute -top-1 -right-1 bg-red-600 text-white w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-white z-20">
                        <i className="fa-solid fa-microphone-slash text-[10px]"></i>
                      </div>
                    )}
                  </div>

                  {/* Live Transcription Display */}
                  <div className="w-full text-center space-y-4 mb-8 h-20 overflow-y-auto px-4">
                    {currentTranscription.user && (
                      <p className="text-[11px] text-gray-500 italic">
                        " {currentTranscription.user} "
                      </p>
                    )}
                    {currentTranscription.emilia && (
                      <p className="text-sm font-bold text-slate-800">
                        {currentTranscription.emilia}
                      </p>
                    )}
                    {!currentTranscription.user &&
                      !currentTranscription.emilia && (
                        <p className="text-xs font-black text-primary uppercase tracking-widest animate-pulse">
                          Connecting audio...
                        </p>
                      )}
                  </div>

                  {/* Visualizer */}
                  <div className="flex gap-1 h-8 items-center mb-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((v) => (
                      <div
                        key={v}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          isMuted ? "bg-gray-200 h-1" : "bg-primary"
                        }`}
                        style={{
                          height: isMuted
                            ? "4px"
                            : `${Math.random() * 30 + 6}px`,
                          animationDelay: `${v * 0.05}s`,
                          opacity: isMuted ? 0.3 : 1,
                        }}
                      ></div>
                    ))}
                  </div>

                  {/* Volume Control Overlay */}
                  <div className="w-full max-w-[180px] mb-8 space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-black text-gray-400 uppercase tracking-widest px-1">
                      <span>Volume</span>
                      <span>{volume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={volume}
                      onChange={(e) => setVolume(parseInt(e.target.value))}
                      className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Call Controls */}
                  <div className="flex items-center gap-5">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`btn-3d w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                        isMuted
                          ? "bg-red-600 text-white"
                          : "bg-white text-gray-400"
                      }`}
                    >
                      <i
                        className={`fa-solid ${
                          isMuted ? "fa-microphone-slash" : "fa-microphone"
                        } text-lg`}
                      ></i>
                    </button>

                    <button
                      onClick={endVoiceCall}
                      className="btn-3d w-16 h-16 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl active:scale-95 border-4 border-white/20"
                    >
                      <i className="fa-solid fa-phone-slash text-xl"></i>
                    </button>

                    <button className="btn-3d w-14 h-14 bg-white text-gray-400 rounded-full flex items-center justify-center opacity-40">
                      <i className="fa-solid fa-gear text-lg"></i>
                    </button>
                  </div>
                </div>
              ) : (
                /* CHAT VIEW */
                <>
                  <div
                    className="flex-1 overflow-y-auto p-6 space-y-5"
                    ref={scrollRef}
                  >
                    {messages.length === 0 && (
                      <div className="text-center py-20 opacity-20">
                        <div className="w-16 h-16 bg-slate-900/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-900/10">
                          <i className="fa-solid fa-comments text-2xl"></i>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                          How can I serve you, Bey?
                        </p>
                      </div>
                    )}
                    {messages.map((m, i) => (
                      <div
                        key={i}
                        className={`flex ${
                          m.role === "user" ? "justify-end" : "justify-start"
                        } animate-3d-entrance`}
                      >
                        <div
                          className={`max-w-[85%] px-5 py-3.5 rounded-2xl text-[13px] leading-relaxed shadow-sm border ${
                            m.role === "user"
                              ? "bg-primary text-white rounded-br-none border-primary shadow-primary/20"
                              : "bg-white/90 text-gray-800 rounded-bl-none border-white shadow-gray-200/50"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="bg-white/60 px-4 py-2.5 rounded-2xl border border-white flex gap-1.5 items-center shadow-sm">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                          <div className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input Bar */}
                  <div className="p-4 bg-white/40 backdrop-blur-md border-t border-white/40">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={startVoiceCall}
                        className="btn-3d w-11 h-11 bg-primary/5 text-primary rounded-xl flex items-center justify-center hover:bg-primary hover:text-white transition-all border border-primary/10 shadow-sm"
                      >
                        <i className="fa-solid fa-phone"></i>
                      </button>
                      <div className="flex-1 relative group">
                        <input
                          type="text"
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleSendMessage(inputText)
                          }
                          placeholder="كيف فيني ساعدك يا بيك؟"
                          className="w-full bg-white border border-gray-100/50 rounded-xl pl-4 pr-12 py-3 text-sm focus:ring-2 focus:ring-primary/10 outline-none transition-all shadow-inner"
                        />
                        <button
                          onClick={() => handleSendMessage(inputText)}
                          className="absolute right-1.5 top-1.5 w-8 h-8 bg-slate-900 text-white rounded-lg flex items-center justify-center active:scale-90 transition-all shadow-md group-hover:bg-primary"
                        >
                          <i className="fa-solid fa-paper-plane text-xs"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Floating Launcher */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.15)] border-4 border-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden relative float-animation"
          >
            <img
              src={EMILIA_AVATAR}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>

            {/* Notification Badge */}
            <span className="absolute top-2 right-2 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-sm"></span>

            {/* Tooltip */}
            <div
              className={`absolute bottom-full mb-4 px-3 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 whitespace-nowrap ${
                lang === "ar" ? "left-0" : "right-0"
              }`}
            >
              Emilia Concierge
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900"></div>
            </div>
          </button>
        )}
      </div>
    </div>
  );
};

export default AIChat;
