import React, { useState, useEffect, useRef } from 'react';

// Icons
const IconMic = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

const IconMicOff = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V5a3 3 0 0 0-5.94-.6" />
    <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23" />
    <line x1="12" y1="19" x2="12" y2="22" />
  </svg>
);

const IconRotateCcw = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const IconPlay = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const IconPause = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const IconTv = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
    <polyline points="17 2 12 7 7 2" />
  </svg>
);

const IconFileText = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

// Utility: Normalize Vietnamese string for voice matching
function normalizeText(text) {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?"'’“”—]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Convert a full script object into formatted plain text
function convertScriptToText(script) {
  if (!script) return '';
  let parts = [];
  if (script.title) parts.push(`TIÊU ĐỀ: ${script.title.toUpperCase()}`);
  if (script.selectedHook) parts.push(`HOOK: ${script.selectedHook}`);
  if (Array.isArray(script.scenes)) {
    script.scenes.forEach((s) => {
      const sceneTitle = s.name ? `${s.name.toUpperCase()}: ` : '';
      if (s.content) parts.push(`${sceneTitle}${s.content}`);
    });
  }
  if (script.ending) parts.push(`KẾT BÀI: ${script.ending}`);
  return parts.join('\n\n');
}

export default function Teleprompter({
  scripts = [],
  draftScripts = [],
  initialScript = null,
  onClose = null,
}) {
  const [sourceMode, setSourceMode] = useState('custom'); // 'custom' | 'library'
  const [selectedScriptId, setSelectedScriptId] = useState('');
  const [rawText, setRawText] = useState('');
  const [words, setWords] = useState([]);
  const [spokenIndex, setSpokenIndex] = useState(-1);
  const [isRecording, setIsRecording] = useState(false);
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [autoScrollSpeed, setAutoScrollSpeed] = useState(30); // words per minute
  const [fontSize, setFontSize] = useState(32); // px
  const [transcriptLog, setTranscriptLog] = useState('');
  const [speechSupported, setSpeechSupported] = useState(true);
  const [speechError, setSpeechError] = useState('');

  const recognitionRef = useRef(null);
  const activeWordRef = useRef(null);
  const containerRef = useRef(null);
  const isRecordingRef = useRef(isRecording);
  const spokenIndexRef = useRef(spokenIndex);
  const wordsRef = useRef(words);
  const autoScrollTimerRef = useRef(null);

  isRecordingRef.current = isRecording;
  spokenIndexRef.current = spokenIndex;
  wordsRef.current = words;

  // Initialize Speech Recognition capability check
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
    }
  }, []);

  // Pre-fill text if initialScript provided
  useEffect(() => {
    if (initialScript) {
      const formatted = convertScriptToText(initialScript);
      setRawText(formatted);
      setSelectedScriptId(initialScript.id || '');
      setSourceMode('library');
    } else if (!rawText) {
      setRawText(
        `Chào mừng bạn đến với Teleprompter của Haichai Script Studio!\n\nHãy dán đoạn văn bản kịch bản của bạn vào đây, hoặc chọn một kịch bản có sẵn từ Thư viện.\n\nSau đó bấm nút Ghi âm (Micro) để bắt đầu đọc. Máy đọc sẽ tự động nhận diện giọng nói tiếng Việt và tô màu xanh lá cây lần lượt từng từ theo nhịp đọc của bạn!`
      );
    }
  }, [initialScript]);

  // Process raw text into structured word objects
  useEffect(() => {
    if (!rawText) {
      setWords([]);
      setSpokenIndex(-1);
      return;
    }

    const lines = rawText.split('\n');
    let wordList = [];
    let globalIdx = 0;

    lines.forEach((line, lineIdx) => {
      const lineWords = line.trim().split(/\s+/).filter(Boolean);
      lineWords.forEach((w, wIdx) => {
        wordList.push({
          id: globalIdx,
          original: w,
          clean: normalizeText(w),
          lineIndex: lineIdx,
          isFirstInLine: wIdx === 0,
          isLastInLine: wIdx === lineWords.length - 1,
        });
        globalIdx++;
      });
    });

    setWords(wordList);
    setSpokenIndex(-1);
  }, [rawText]);

  // Handle Speech Recognition setup & event loop
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let currentTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        currentTranscript += event.results[i][0].transcript + ' ';
      }

      setTranscriptLog(currentTranscript.trim());

      const cleanTranscriptWords = normalizeText(currentTranscript)
        .split(' ')
        .filter(Boolean);

      if (cleanTranscriptWords.length === 0) return;

      const currentWords = wordsRef.current;
      const currentIndex = spokenIndexRef.current;

      if (currentWords.length === 0) return;

      // Look ahead matching window
      const searchStart = Math.max(0, currentIndex - 2);
      const searchEnd = Math.min(currentWords.length, currentIndex + 25);

      // Search for the last spoken clean words in the window
      const recentSpoken = cleanTranscriptWords.slice(-4); // Last 4 spoken words

      let bestMatchIndex = -1;

      // Try matching multi-word sequence first
      if (recentSpoken.length >= 2) {
        const seqMatch = recentSpoken.join(' ');
        for (let i = searchStart; i < searchEnd - 1; i++) {
          const scriptSeq = currentWords
            .slice(i, i + recentSpoken.length)
            .map((w) => w.clean)
            .join(' ');
          if (scriptSeq && scriptSeq.includes(seqMatch.slice(0, 10))) {
            bestMatchIndex = i + recentSpoken.length - 1;
            break;
          }
        }
      }

      // Fallback single word match if sequence didn't match
      if (bestMatchIndex === -1) {
        const lastSpokenWord = recentSpoken[recentSpoken.length - 1];
        if (lastSpokenWord) {
          for (let i = searchStart; i < searchEnd; i++) {
            if (currentWords[i].clean === lastSpokenWord) {
              bestMatchIndex = i;
              break;
            }
          }
        }
      }

      // If matched, advance spokenIndex
      if (bestMatchIndex > currentIndex) {
        setSpokenIndex(bestMatchIndex);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech Recognition Error:', event.error);
      if (event.error === 'not-allowed') {
        setSpeechError(
          'Không có quyền truy cập Micro. Vui lòng cấp quyền micro trên trình duyệt để sử dụng tính năng đọc tự động!'
        );
        setIsRecording(false);
      } else if (event.error === 'network') {
        setSpeechError('Lỗi kết nối mạng khi dùng Speech Recognition.');
      }
    };

    recognition.onend = () => {
      // Auto-restart if user hasn't explicitly stopped recording
      if (isRecordingRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // Ignore restart error if already started
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Scroll active word into center view
  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [spokenIndex]);

  // Auto-scroll timer fallback when auto-scroll mode is active
  useEffect(() => {
    if (isAutoScrolling) {
      const intervalMs = (60 / Math.max(10, autoScrollSpeed)) * 1000;
      autoScrollTimerRef.current = setInterval(() => {
        setSpokenIndex((prev) => {
          if (prev >= words.length - 1) {
            setIsAutoScrolling(false);
            return prev;
          }
          return prev + 1;
        });
      }, intervalMs);
    } else if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
    }

    return () => {
      if (autoScrollTimerRef.current) clearInterval(autoScrollTimerRef.current);
    };
  }, [isAutoScrolling, autoScrollSpeed, words.length]);

  const toggleRecording = () => {
    if (!speechSupported) {
      setSpeechError(
        'Trình duyệt của bạn chưa hỗ trợ Web Speech API. Bạn có thể sử dụng chế độ "Tự động cuộn theo tốc độ" bên dưới.'
      );
      return;
    }

    setSpeechError('');

    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    } else {
      setIsRecording(true);
      setIsAutoScrolling(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error('Mic start error:', e);
        }
      }
    }
  };

  const handleSelectScriptFromLibrary = (scriptId) => {
    setSelectedScriptId(scriptId);
    const allAvailable = [...scripts, ...draftScripts];
    const found = allAvailable.find((s) => s.id === scriptId);
    if (found) {
      setRawText(convertScriptToText(found));
      setSpokenIndex(-1);
    }
  };

  const handleReset = () => {
    setSpokenIndex(-1);
    setTranscriptLog('');
  };

  // Group words into lines for clean paragraph layout
  const groupedLines = [];
  if (words.length > 0) {
    let currentLineIdx = -1;
    words.forEach((w) => {
      if (w.lineIndex !== currentLineIdx) {
        currentLineIdx = w.lineIndex;
        groupedLines.push([]);
      }
      groupedLines[groupedLines.length - 1].push(w);
    });
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto space-y-6 pb-12">
      {/* Header Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <IconTv />
            </span>
            <h2 className="text-2xl font-bold text-slate-900">
              Máy đọc Kịch bản (Teleprompter AI)
            </h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Nền trắng chữ đen rõ nét. Đọc đến đâu chữ hiện màu xanh lá cây và tự động cuộn đến đó theo micro của bạn!
          </p>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition"
          >
            &times; Đóng Teleprompter
          </button>
        )}
      </div>

      {/* Control Toolbar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
        {/* Source Selector & Input Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
              Nguồn kịch bản:
            </label>
            <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setSourceMode('custom')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                  sourceMode === 'custom'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📝 Dán văn bản tự do
              </button>
              <button
                onClick={() => setSourceMode('library')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition ${
                  sourceMode === 'library'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📚 Thư viện kịch bản ({scripts.length + draftScripts.length})
              </button>
            </div>
          </div>

          {sourceMode === 'library' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Chọn kịch bản:
              </label>
              <select
                value={selectedScriptId}
                onChange={(e) => handleSelectScriptFromLibrary(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="">-- Chọn kịch bản từ Thư viện/Draft --</option>
                {scripts.length > 0 && (
                  <optgroup label="Thư viện kịch bản chính thức">
                    {scripts.map((s) => (
                      <option key={s.id} value={s.id}>
                        [Chính thức] {s.title}
                      </option>
                    ))}
                  </optgroup>
                )}
                {draftScripts.length > 0 && (
                  <optgroup label="Kịch bản Draft">
                    {draftScripts.map((s) => (
                      <option key={s.id} value={s.id}>
                        [Draft] {s.title}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          )}

          {sourceMode === 'custom' && (
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Hoặc chỉnh sửa trực tiếp nội dung đọc:
              </label>
              <button
                onClick={() => {
                  const text = prompt('Dán kịch bản của bạn vào đây:', rawText);
                  if (text !== null) setRawText(text);
                }}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg font-semibold flex items-center gap-1.5 transition"
              >
                <IconFileText /> Sửa toàn bộ văn bản đọc
              </button>
            </div>
          )}
        </div>

        {/* Playback & Mic Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Mic Toggle Button */}
            <button
              onClick={toggleRecording}
              className={`px-5 py-3 rounded-xl font-bold text-sm flex items-center gap-2.5 transition shadow-sm cursor-pointer ${
                isRecording
                  ? 'bg-red-600 hover:bg-red-700 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isRecording ? <IconMicOff /> : <IconMic />}
              <span>{isRecording ? 'Đang nhận diện giọng... (Bấm dừng)' : 'Bật Micro Đọc'}</span>
            </button>

            {/* Auto Scroll Toggle */}
            <button
              onClick={() => {
                if (isRecording) setIsRecording(false);
                setIsAutoScrolling(!isAutoScrolling);
              }}
              className={`px-4 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition cursor-pointer border ${
                isAutoScrolling
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {isAutoScrolling ? <IconPause /> : <IconPlay />}
              <span>{isAutoScrolling ? 'Tạm dừng cuộn' : 'Cuộn tự động'}</span>
            </button>

            {/* Reset */}
            <button
              onClick={handleReset}
              className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm flex items-center gap-1.5 transition cursor-pointer"
              title="Quay lại từ đầu"
            >
              <IconRotateCcw /> Bắt đầu lại
            </button>
          </div>

          {/* Display Settings (Font Size) */}
          <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider pl-1">
              Cỡ chữ:
            </span>
            <div className="flex items-center gap-1">
              {[20, 28, 36, 44, 52].map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold flex items-center justify-center transition ${
                    fontSize === size
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {size < 30 ? 'S' : size < 40 ? 'M' : size < 50 ? 'L' : 'XL'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Speed slider if auto-scrolling */}
        {isAutoScrolling && (
          <div className="flex items-center gap-4 bg-indigo-50/70 p-3 rounded-xl border border-indigo-100">
            <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Tốc độ cuộn: {autoScrollSpeed} từ/phút
            </span>
            <input
              type="range"
              min="10"
              max="120"
              step="5"
              value={autoScrollSpeed}
              onChange={(e) => setAutoScrollSpeed(Number(e.target.value))}
              className="flex-1 accent-indigo-600 cursor-pointer"
            />
          </div>
        )}

        {/* Speech Status Banner */}
        {speechError && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-medium">
            ⚠️ {speechError}
          </div>
        )}

        {isRecording && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-3 rounded-xl text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>
                <strong>Đang lắng nghe:</strong> {transcriptLog || 'Hãy bắt đầu đọc kịch bản thành tiếng...'}
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded">
              Tiếng Việt (vi-VN)
            </span>
          </div>
        )}
      </div>

      {/* Main Teleprompter Display Stage (White Background, Black Text) */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-xl overflow-hidden">
        {/* Top Header Strip */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-3 flex justify-between items-center text-xs font-semibold text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-slate-300" />
            <span className="uppercase tracking-wider">MÀN HÌNH MÁY ĐỌC HIGH-CONTRAST</span>
          </div>
          <div>
            Tiến độ: {spokenIndex + 1} / {words.length} từ ({words.length > 0 ? Math.round(((spokenIndex + 1) / words.length) * 100) : 0}%)
          </div>
        </div>

        {/* Text Viewport */}
        <div
          ref={containerRef}
          className="p-8 sm:p-12 md:p-16 max-h-[600px] overflow-y-auto bg-white text-slate-900 leading-relaxed font-sans scroll-smooth"
          style={{ fontSize: `${fontSize}px`, lineHeight: 1.7 }}
        >
          {groupedLines.map((line, lineIdx) => (
            <p key={lineIdx} className="mb-6 whitespace-pre-wrap">
              {line.map((w) => {
                const isSpoken = w.id <= spokenIndex;
                const isActive = w.id === spokenIndex;

                return (
                  <span
                    key={w.id}
                    ref={isActive ? activeWordRef : null}
                    className={`inline-block mr-[0.35em] transition-all duration-150 rounded px-1 py-0.5 ${
                      isActive
                        ? 'text-emerald-700 bg-emerald-200 font-extrabold scale-105 shadow-sm ring-2 ring-emerald-500'
                        : isSpoken
                        ? 'text-emerald-600 font-bold bg-emerald-50'
                        : 'text-slate-900 font-medium'
                    }`}
                  >
                    {w.original}
                  </span>
                );
              })}
            </p>
          ))}

          {words.length === 0 && (
            <div className="text-center py-20 text-slate-400 text-lg">
              Chưa có văn bản kịch bản nào để đọc.
            </div>
          )}
        </div>

        {/* Footer Navigation bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <span>
            💡 <strong>Mẹo:</strong> Bạn có thể dùng phím cách (Space) hoặc bấm trực tiếp vào từ bất kỳ trong bài đọc để di chuyển vị trí bắt đầu đọc.
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSpokenIndex((prev) => Math.max(-1, prev - 5))}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-700"
            >
              ⏮ -5 từ
            </button>
            <button
              onClick={() => setSpokenIndex((prev) => Math.min(words.length - 1, prev + 5))}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-700"
            >
              ⏭ +5 từ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
