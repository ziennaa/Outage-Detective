import React, { useState, useRef, useEffect } from 'react';
import { analyzeOutage } from './services/geminiService';
import { AnalysisResult } from './types';
import { IconPhoto, IconX, IconActivity, IconSun, IconMoon, IconLock } from './components/Icons';
import { TimelineSection, HypothesesSection, CommandsSection, PostmortemSection } from './components/ResultSections';

const SAMPLE_LOGS = `Oct 24 10:14:01 switch-core-01 BGP[2435]: %BGP-5-ADJCHANGE: neighbor 192.168.10.2 Down BGP Notification sent
Oct 24 10:14:02 switch-core-01 BGP[2435]: %BGP-3-NOTIFICATION: sent to neighbor 192.168.10.2 4/0 (hold time expired) 0 bytes
Oct 24 10:14:05 switch-core-01 IFMGR[1102]: %LINK-3-UPDOWN: Interface GigabitEthernet0/1, changed state to down
Oct 24 10:14:05 switch-core-01 IFMGR[1102]: %LINEPROTO-5-UPDOWN: Line protocol on Interface GigabitEthernet0/1, changed state to down
Oct 24 10:15:30 switch-edge-04 kernel: [89234.2123] eth0: link down
Oct 24 10:16:15 loadbalancer-01 haproxy[8822]: Server app-backend/srv01 is DOWN, reason: Layer4 connection problem, info: "Connection refused"
Oct 24 10:16:15 loadbalancer-01 haproxy[8822]: Server app-backend/srv02 is DOWN, reason: Layer4 connection problem, info: "Connection refused"
Oct 24 10:16:16 loadbalancer-01 haproxy[8822]: backend app-backend has no server available!`;

interface TopologyImage {
  file: File;
  preview: string;
  base64Data: string;
  mimeType: string;
}

const App: React.FC = () => {
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [logs, setLogs] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [topologyImage, setTopologyImage] = useState<TopologyImage | null>(null);
  
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check for existing API key on mount
  useEffect(() => {
    const checkKey = async () => {
      // Allow local development if process.env.API_KEY is already set
      if (process.env.API_KEY) {
        setHasApiKey(true);
        return;
      }

      const aiStudio = (window as any).aistudio;
      if (aiStudio) {
        const hasKey = await aiStudio.hasSelectedApiKey();
        if (hasKey) {
          setHasApiKey(true);
        }
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const aiStudio = (window as any).aistudio;
    if (aiStudio) {
      await aiStudio.openSelectKey();
      // Assume success to handle race condition where checkKey might lag
      setHasApiKey(true);
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleAnalyze = async () => {
    if (!logs.trim()) {
      setError("Please provide network logs to begin analysis.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const imageData = topologyImage 
        ? { data: topologyImage.base64Data, mimeType: topologyImage.mimeType }
        : undefined;

      const data = await analyzeOutage(logs, summary, imageData);
      setResult(data);
    } catch (err: any) {
      if (err.message && err.message.includes("Requested entity was not found")) {
        // Handle invalid key case by clearing auth state AND data
        setHasApiKey(false);
        setResult(null);
        setError("API Key invalid or expired. Please select a key again.");
      } else {
        setError(err.message || "An error occurred during analysis.");
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFillSample = () => {
    setLogs(SAMPLE_LOGS);
    setSummary("Users reported inability to access the internal dashboard starting around 10:15 AM.");
    setError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Only JPEG and PNG images are supported for topology diagrams.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setTopologyImage({
        file: file,
        preview: base64String,
        base64Data: base64String.split(',')[1],
        mimeType: file.type
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setTopologyImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render Landing Page if no API Key
  if (!hasApiKey) {
    return (
      <div className="min-h-screen bg-black text-neutral-400 font-sans flex flex-col items-center justify-center p-6 text-center" data-theme="dark">
        <div className="max-w-md w-full space-y-8 animate-fade-in">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center shadow-2xl border border-neutral-800">
              <IconActivity className="w-8 h-8 text-neutral-200" />
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-neutral-100 tracking-tight">Outage Detective</h1>
              <p className="text-neutral-500 text-lg">
                Automated network forensics and incident analysis powered by Gemini.
              </p>
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-900 rounded-sm p-6 shadow-sm space-y-6">
            <div className="flex flex-col items-center gap-2">
              <IconLock className="w-6 h-6 text-neutral-500" />
              <p className="text-sm text-neutral-400">
                To use this application, you must connect a valid Gemini API Key. Your key is protected and handled securely.
              </p>
            </div>
            <button
              onClick={handleSelectKey}
              className="w-full py-3 bg-neutral-200 hover:bg-white text-black font-bold rounded-sm transition-colors uppercase tracking-wider text-sm"
            >
              Connect API Key
            </button>
            <div className="text-xs text-neutral-600">
              By connecting, you agree to the usage terms. <br/>
              <a 
                href="https://ai.google.dev/gemini-api/docs/billing" 
                target="_blank" 
                rel="noreferrer"
                className="underline hover:text-neutral-400 transition-colors"
              >
                Learn more about API billing
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Main App
  return (
    <div className="min-h-screen bg-black text-neutral-400 font-sans selection:bg-neutral-800" data-theme={theme}>
      {/* Dashboard Header */}
      <header className="h-16 bg-neutral-950 border-b border-neutral-900 flex items-center justify-between px-6 select-none sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-neutral-100 rounded-full"></div>
          <h1 className="font-bold text-xl text-neutral-200 tracking-tight">Outage Detective</h1>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-950/30 border border-green-900/50">
            <IconLock className="w-3 h-3 text-green-500" />
            <span className="text-xs font-medium text-green-500 tracking-wide uppercase">Secure</span>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <button
            onClick={toggleTheme}
            className="text-neutral-500 hover:text-neutral-200 transition-colors p-2 rounded-full hover:bg-neutral-900"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <IconSun className="w-5 h-5" /> : <IconMoon className="w-5 h-5" />}
          </button>
          <button
            onClick={handleFillSample}
            className="text-sm font-semibold text-neutral-500 hover:text-neutral-300 transition-colors uppercase tracking-wider"
          >
            Load Sample
          </button>
        </div>
      </header>

      {/* Main Dashboard Layout */}
      <main className="p-6 grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-[1920px] mx-auto">
        
        {/* LEFT COLUMN: Controls */}
        <div className="xl:col-span-1 space-y-6">
          <div className="bg-neutral-950 border border-neutral-900 rounded-sm flex flex-col h-full shadow-sm">
            <div className="px-5 py-4 border-b border-neutral-900 bg-neutral-950 flex items-center justify-between rounded-t-sm">
              <h2 className="text-base font-bold text-neutral-400 uppercase tracking-wide">Input Data</h2>
            </div>
            
            <div className="p-5 space-y-6 flex-1 flex flex-col">
              
              {/* Incident Summary */}
              <div className="space-y-2">
                <label htmlFor="summary" className="block text-sm font-bold text-neutral-400">
                  Incident Summary
                </label>
                <input
                  id="summary"
                  type="text"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Describe the issue..."
                  className="w-full bg-black border border-neutral-800 rounded-sm px-4 py-3 text-base text-neutral-200 placeholder:text-neutral-800 focus:outline-none focus:border-neutral-600 transition-colors"
                />
              </div>

              {/* Topology Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-neutral-400">
                  Topology Diagram <span className="font-normal text-neutral-600 text-sm normal-case ml-1">(Optional)</span>
                </label>
                
                {!topologyImage ? (
                  <label className="flex items-center justify-center w-full cursor-pointer bg-black border border-dashed border-neutral-800 hover:border-neutral-600 hover:bg-neutral-900/50 rounded-sm px-4 py-8 transition-colors group">
                      <span className="text-sm text-neutral-500 group-hover:text-neutral-300 flex items-center gap-2 transition-colors font-medium">
                        <IconPhoto className="w-5 h-5" />
                        Upload Image (PNG/JPG)
                      </span>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        accept="image/png, image/jpeg"
                        onChange={handleImageUpload}
                        className="hidden" 
                      />
                  </label>
                ) : (
                  <div className="flex items-center justify-between w-full bg-black border border-neutral-800 rounded-sm px-3 py-3">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="h-12 w-12 bg-neutral-900 border border-neutral-800 flex-shrink-0">
                        <img 
                          src={topologyImage.preview} 
                          alt="Preview" 
                          className="h-full w-full object-cover grayscale opacity-80"
                        />
                      </div>
                      <span className="text-sm text-neutral-300 truncate font-mono">
                        {topologyImage.file.name}
                      </span>
                    </div>
                    <button 
                      onClick={clearImage}
                      className="p-2 hover:bg-neutral-900 text-neutral-600 hover:text-neutral-400 transition-colors rounded-sm"
                    >
                      <IconX className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Logs Input */}
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="flex justify-between items-end">
                  <label htmlFor="logs" className="block text-sm font-bold text-neutral-400">
                    Network Logs
                  </label>
                  <span className="text-xs text-neutral-600 font-mono">
                    {logs ? logs.split('\n').length : 0} lines
                  </span>
                </div>
                <textarea
                  id="logs"
                  value={logs}
                  onChange={(e) => {
                    setLogs(e.target.value);
                    if(e.target.value.trim()) setError(null);
                  }}
                  placeholder="Paste raw logs here..."
                  className="w-full h-full min-h-[400px] bg-black border border-neutral-800 rounded-sm px-4 py-3 font-mono text-[15px] leading-relaxed text-neutral-300 placeholder:text-neutral-800 focus:outline-none focus:border-neutral-600 transition-colors resize-y"
                  spellCheck={false}
                />
              </div>

              {error && (
                <div className="p-4 bg-red-950/20 border-l-4 border-red-900 text-red-200 text-sm">
                  <p className="font-bold mb-1">Error</p>
                  <p className="opacity-80">{error}</p>
                </div>
              )}

              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className={`
                  w-full py-4 rounded-sm font-bold text-sm uppercase tracking-wider transition-all shadow-sm
                  ${isAnalyzing 
                    ? 'bg-neutral-900 text-neutral-500 cursor-not-allowed border border-neutral-800' 
                    : 'bg-neutral-200 text-black hover:bg-white hover:shadow-md border border-transparent'}
                `}
              >
                {isAnalyzing ? "Processing Analysis..." : "Run Analysis"}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Results */}
        <div className="xl:col-span-2 space-y-6">
          {result ? (
            <div className="grid grid-cols-1 gap-6 animate-fade-in">
              <TimelineSection events={result.timeline} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <HypothesesSection hypotheses={result.hypotheses} />
                 <CommandsSection commands={result.nextCommands} />
              </div>
              
              <PostmortemSection content={result.postmortemDraft} />
            </div>
          ) : (
            <div className="h-full min-h-[600px] flex flex-col items-center justify-center border-2 border-dashed border-neutral-900 rounded-sm text-neutral-700 bg-neutral-950/30">
              <IconActivity className="w-12 h-12 mb-4 opacity-20" />
              <p className="text-sm font-bold uppercase tracking-widest opacity-60">Ready for Analysis</p>
              <p className="text-neutral-600 mt-2">Enter logs and click Run Analysis</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;