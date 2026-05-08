import { useState, useRef, useEffect } from 'react';

interface PlacedWord {
  row: number;
  col: number;
  direction: 'across' | 'down';
  word: string;
  clue: string;
  number: number;
  length: number;
}

interface CrosswordViewerProps {
  grid: string[][];
  placedWords: PlacedWord[];
  title?: string;
  onEnlarge?: () => void;
}

const CrosswordViewer = ({ grid, placedWords, title, onEnlarge }: CrosswordViewerProps) => {
  const [crosswordAnswers, setCrosswordAnswers] = useState<Record<string, string>>({});
  const [selectedClue, setSelectedClue] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [selectedDirection, setSelectedDirection] = useState<'across' | 'down'>('across');
  const [checked, setChecked] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const getWordsAtCell = (row: number, col: number) =>
    placedWords.filter(p => {
      if (p.direction === 'across') return row === p.row && col >= p.col && col < p.col + p.length;
      return col === p.col && row >= p.row && row < p.row + p.length;
    });

  // Check ALL words at this cell (shared across/down) and return first non-empty letter
  const getCellLetter = (row: number, col: number): string => {
    const wordsAtCell = getWordsAtCell(row, col);
    for (const pw of wordsAtCell) {
      const offset = pw.direction === 'across' ? col - pw.col : row - pw.row;
      const typed = crosswordAnswers[`word-${pw.number}`] || '';
      const ch = typed[offset];
      if (ch && /[A-Za-z]/.test(ch)) return ch.toUpperCase();
    }
    return '';
  };

  // Update only the selected word – no syncing to other words; user must click to switch
  const setAnswer = (wordNumber: number, newValue: string) => {
    setCrosswordAnswers(prev => ({ ...prev, [`word-${wordNumber}`]: newValue }));
  };

  const handleCellClick = (row: number, col: number) => {
    const wordsAtCell = getWordsAtCell(row, col);
    if (!wordsAtCell.length) return;
    // If this cell has both across and down, toggle to the other word when re-clicking
    const currentPw = selectedClue !== null ? placedWords.find(p => p.number === selectedClue) : null;
    const isSameCell = currentPw && (
      (currentPw.direction === 'across' && row === currentPw.row && col >= currentPw.col && col < currentPw.col + currentPw.length) ||
      (currentPw.direction === 'down' && col === currentPw.col && row >= currentPw.row && row < currentPw.row + currentPw.length)
    );
    const otherWord = isSameCell && wordsAtCell.length > 1
      ? wordsAtCell.find(w => w.number !== selectedClue)
      : null;
    const pw = otherWord || wordsAtCell[0];
    setSelectedClue(pw.number);
    setSelectedDirection(pw.direction);
    setSelectedCell({ row: pw.row, col: pw.col });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell || !selectedClue) return;
    const pw = placedWords.find(p => p.number === selectedClue);
    if (!pw) return;
    const key = `word-${pw.number}`;
    const current = crosswordAnswers[key] || '';

    if (e.key === 'Backspace') {
      if (pw.direction === 'across') {
        const offset = selectedCell.col - pw.col;
        if (offset > 0) {
          const newVal = current.slice(0, offset - 1) + current.slice(offset);
          setAnswer(pw.number, newVal);
          setSelectedCell({ row: pw.row, col: pw.col + Math.max(0, offset - 2) });
        }
      } else {
        const offset = selectedCell.row - pw.row;
        if (offset > 0) {
          const newVal = current.slice(0, offset - 1) + current.slice(offset);
          setAnswer(pw.number, newVal);
          setSelectedCell({ row: pw.row + Math.max(0, offset - 2), col: pw.col });
        }
      }
      e.preventDefault();
    } else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
      const letter = e.key.toUpperCase();
      const offset = pw.direction === 'across' ? selectedCell.col - pw.col : selectedCell.row - pw.row;
      let newVal = current.split('');
      newVal[offset] = letter;
      newVal = newVal.join('').replace(/\s+$/, '');
      setAnswer(pw.number, newVal);
      if (offset < pw.length - 1) {
        if (pw.direction === 'across') setSelectedCell({ row: pw.row, col: pw.col + offset + 1 });
        else setSelectedCell({ row: pw.row + offset + 1, col: pw.col });
      }
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (selectedClue !== null && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedClue]);

  if (!grid || !placedWords?.length) {
    return <div className="p-8 text-center text-violet-400 font-bold text-lg">No crossword data</div>;
  }

  const acrossWords = placedWords.filter(p => p.direction === 'across').sort((a, b) => a.number - b.number);
  const downWords = placedWords.filter(p => p.direction === 'down').sort((a, b) => a.number - b.number);

  return (
    <div className="p-4 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <span className="text-base font-extrabold text-violet-600 dark:text-violet-300 tracking-tight">Solve the puzzle! 🧩</span>
        {onEnlarge && (
          <button
            onClick={onEnlarge}
            className="text-xs px-4 py-2 rounded-2xl bg-violet-500 text-white font-bold border-b-4 border-violet-700 hover:bg-violet-400 active:border-b-2 active:mt-0.5 transition-all flex items-center gap-1.5 shadow-md"
          >
            Open full screen
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto min-h-0" tabIndex={0} onKeyDown={handleKeyDown}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Grid */}
          <div className="bg-white dark:bg-violet-950/40 rounded-2xl border-2 border-violet-200 dark:border-violet-700 border-b-4 border-b-violet-300 dark:border-b-violet-600 p-4 overflow-x-auto shadow-sm">
            <div className="inline-block">
              {grid.map((row, rowIdx) => (
                <div key={rowIdx} className="flex">
                  {row.map((cell, colIdx) => {
                    if (cell === '' || cell === '#') return <div key={colIdx} className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 bg-violet-800 dark:bg-violet-900 rounded-sm" />;
                    const pw = placedWords.find(p => p.row === rowIdx && p.col === colIdx);
                    const cellNum = pw?.number;
                    const typed = getCellLetter(rowIdx, colIdx);
                    const display = checked ? cell : typed;
                    const isSelected = selectedCell?.row === rowIdx && selectedCell?.col === colIdx;
                    const isHighlighted = selectedClue !== null && placedWords.find(p => p.number === selectedClue) && (() => {
                      const sel = placedWords.find(p => p.number === selectedClue)!;
                      if (sel.direction === 'across' && rowIdx === sel.row && colIdx >= sel.col && colIdx < sel.col + sel.length) return true;
                      if (sel.direction === 'down' && colIdx === sel.col && rowIdx >= sel.row && rowIdx < sel.row + sel.length) return true;
                      return false;
                    })();
                    let cellClass = 'bg-white dark:bg-violet-900/60 border-2 border-violet-200 dark:border-violet-600 rounded-sm';
                    if (isSelected) cellClass = 'border-2 border-yellow-500 ring-2 ring-yellow-400 rounded-sm' + ' ' + 'bg-[#FFC800] dark:bg-[#FFC800]';
                    else if (isHighlighted) cellClass = 'bg-[#DDF4FF] dark:bg-sky-900/40 border-2 border-sky-300 dark:border-sky-600 rounded-sm';
                    if (checked) {
                      const wordsThrough = placedWords.filter(p => {
                        if (p.direction === 'across') return rowIdx === p.row && colIdx >= p.col && colIdx < p.col + p.length;
                        return colIdx === p.col && rowIdx >= p.row && rowIdx < p.row + p.length;
                      });
                      const attempted = wordsThrough.filter(p => (crosswordAnswers[`word-${p.number}`] || '').length > 0);
                      const anyCorrect = attempted.some(p => (crosswordAnswers[`word-${p.number}`] || '').toUpperCase() === p.word);
                      const anyWrong = attempted.some(p => (crosswordAnswers[`word-${p.number}`] || '').toUpperCase() !== p.word);
                      if (attempted.length > 0) {
                        if (anyCorrect && !anyWrong) cellClass = 'bg-[#58CC02] dark:bg-[#58CC02] border-2 border-green-600 rounded-sm text-white';
                        else if (anyWrong) cellClass = 'bg-[#FF4B4B] dark:bg-[#FF4B4B] border-2 border-red-600 rounded-sm text-white';
                      }
                    }
                    return (
                      <div
                        key={colIdx}
                        onClick={() => handleCellClick(rowIdx, colIdx)}
                        className={`w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 flex items-center justify-center relative cursor-pointer text-sm sm:text-base font-extrabold ${cellClass} ${
                          checked && cellClass.includes('text-white') ? 'text-white' : 'text-violet-900 dark:text-violet-100'
                        }`}
                      >
                        {cellNum && <span className="absolute top-0 left-0.5 text-[7px] sm:text-[8px] font-bold text-violet-500 dark:text-violet-300">{cellNum}</span>}
                        {display}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {/* Clues */}
          <div className="space-y-4 flex-1 min-w-0">
            <div>
              <h4 className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 uppercase mb-2 flex items-center gap-1.5">
                <span className="text-base">👉</span> Across
              </h4>
              <div className="space-y-2">
                {acrossWords.map((pw) => {
                  const key = `word-${pw.number}`;
                  const val = crosswordAnswers[key] || '';
                  const isCorrect = checked && val && val.toUpperCase() === pw.word;
                  const isWrong = checked && val && val.toUpperCase() !== pw.word;
                  return (
                    <div
                      key={pw.number}
                      onClick={() => { setSelectedClue(pw.number); setSelectedDirection('across'); setSelectedCell({ row: pw.row, col: pw.col }); }}
                      className={`p-2.5 rounded-xl border-2 border-l-4 cursor-pointer text-xs transition-all ${
                        selectedClue === pw.number ? 'border-[#FFC800] border-l-emerald-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-md' :
                        isCorrect ? 'border-[#58CC02] border-l-[#58CC02] bg-green-50 dark:bg-green-900/20' :
                        isWrong ? 'border-[#FF4B4B] border-l-[#FF4B4B] bg-red-50 dark:bg-red-900/20' :
                        'border-emerald-200 dark:border-emerald-800 border-l-emerald-500 dark:border-l-emerald-400 hover:border-emerald-400 hover:shadow-sm'
                      }`}
                    >
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 mr-1">{pw.number}.</span>
                      <span className="text-violet-800 dark:text-violet-200">{pw.clue}</span>
                      <span className="text-violet-400 dark:text-violet-500 ml-1">({pw.word.length})</span>
                      <input
                        ref={selectedClue === pw.number && selectedDirection === 'across' ? inputRef : undefined}
                        type="text"
                        maxLength={pw.word.length}
                        value={val}
                        onChange={(e) => setAnswer(pw.number, e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                        onFocus={() => { setSelectedClue(pw.number); setSelectedDirection('across'); setSelectedCell({ row: pw.row, col: pw.col }); }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={checked}
                        placeholder={'—'.repeat(pw.word.length)}
                        className="mt-1.5 w-full px-2.5 py-1.5 text-xs font-mono tracking-wider uppercase border-2 border-emerald-200 dark:border-emerald-700 rounded-xl bg-white dark:bg-violet-950/50 focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 outline-none transition-all"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-sky-600 dark:text-sky-400 uppercase mb-2 flex items-center gap-1.5">
                <span className="text-base">👇</span> Down
              </h4>
              <div className="space-y-2">
                {downWords.map((pw) => {
                  const key = `word-${pw.number}`;
                  const val = crosswordAnswers[key] || '';
                  const isCorrect = checked && val && val.toUpperCase() === pw.word;
                  const isWrong = checked && val && val.toUpperCase() !== pw.word;
                  return (
                    <div
                      key={pw.number}
                      onClick={() => { setSelectedClue(pw.number); setSelectedDirection('down'); setSelectedCell({ row: pw.row, col: pw.col }); }}
                      className={`p-2.5 rounded-xl border-2 border-l-4 cursor-pointer text-xs transition-all ${
                        selectedClue === pw.number ? 'border-[#FFC800] border-l-sky-500 bg-yellow-50 dark:bg-yellow-900/20 shadow-md' :
                        isCorrect ? 'border-[#58CC02] border-l-[#58CC02] bg-green-50 dark:bg-green-900/20' :
                        isWrong ? 'border-[#FF4B4B] border-l-[#FF4B4B] bg-red-50 dark:bg-red-900/20' :
                        'border-sky-200 dark:border-sky-800 border-l-sky-500 dark:border-l-sky-400 hover:border-sky-400 hover:shadow-sm'
                      }`}
                    >
                      <span className="font-extrabold text-sky-600 dark:text-sky-400 mr-1">{pw.number}.</span>
                      <span className="text-violet-800 dark:text-violet-200">{pw.clue}</span>
                      <span className="text-violet-400 dark:text-violet-500 ml-1">({pw.word.length})</span>
                      <input
                        ref={selectedClue === pw.number && selectedDirection === 'down' ? inputRef : undefined}
                        type="text"
                        maxLength={pw.word.length}
                        value={val}
                        onChange={(e) => setAnswer(pw.number, e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                        onFocus={() => { setSelectedClue(pw.number); setSelectedDirection('down'); setSelectedCell({ row: pw.row, col: pw.col }); }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={checked}
                        placeholder={'—'.repeat(pw.word.length)}
                        className="mt-1.5 w-full px-2.5 py-1.5 text-xs font-mono tracking-wider uppercase border-2 border-sky-200 dark:border-sky-700 rounded-xl bg-white dark:bg-violet-950/50 focus:ring-2 focus:ring-sky-400 focus:border-sky-400 outline-none transition-all"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-3 pt-3">
              <button
                onClick={() => setChecked(true)}
                className="px-6 py-2.5 rounded-2xl bg-[#58CC02] text-white font-extrabold text-sm uppercase tracking-wide border-b-4 border-green-700 hover:bg-[#61E002] active:border-b-2 active:mt-0.5 transition-all shadow-md"
              >
                Check Answers
              </button>
              {checked && (
                <button
                  onClick={() => { setChecked(false); setCrosswordAnswers({}); setSelectedClue(null); setSelectedCell(null); }}
                  className="px-6 py-2.5 rounded-2xl bg-violet-100 dark:bg-violet-800 text-violet-700 dark:text-violet-200 font-extrabold text-sm uppercase tracking-wide border-b-4 border-violet-300 dark:border-violet-600 hover:bg-violet-200 dark:hover:bg-violet-700 active:border-b-2 active:mt-0.5 transition-all shadow-md"
                >
                  Clear & Retry
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrosswordViewer;
