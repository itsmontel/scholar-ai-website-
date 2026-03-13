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

  const getCellLetter = (row: number, col: number): string => {
    const pw = placedWords.find(p => {
      if (p.direction === 'across') return row === p.row && col >= p.col && col < p.col + p.length;
      return col === p.col && row >= p.row && row < p.row + p.length;
    });
    if (!pw) return '';
    const offset = pw.direction === 'across' ? col - pw.col : row - pw.row;
    const key = `word-${pw.number}`;
    const typed = crosswordAnswers[key] || '';
    return typed[offset] || '';
  };

  const handleCellClick = (row: number, col: number) => {
    const pw = placedWords.find(p => {
      if (p.direction === 'across') return row === p.row && col >= p.col && col < p.col + p.length;
      return col === p.col && row >= p.row && row < p.row + p.length;
    });
    if (pw) {
      setSelectedClue(pw.number);
      setSelectedDirection(pw.direction);
      setSelectedCell({ row: pw.row, col: pw.col });
    }
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
          setCrosswordAnswers({ ...crosswordAnswers, [key]: newVal });
          setSelectedCell({ row: pw.row, col: pw.col + Math.max(0, offset - 2) });
        }
      } else {
        const offset = selectedCell.row - pw.row;
        if (offset > 0) {
          const newVal = current.slice(0, offset - 1) + current.slice(offset);
          setCrosswordAnswers({ ...crosswordAnswers, [key]: newVal });
          setSelectedCell({ row: pw.row + Math.max(0, offset - 2), col: pw.col });
        }
      }
      e.preventDefault();
    } else if (e.key.length === 1 && /^[a-zA-Z]$/.test(e.key)) {
      const letter = e.key.toUpperCase();
      const offset = pw.direction === 'across' ? selectedCell.col - pw.col : selectedCell.row - pw.row;
      let newVal = current.split('');
      newVal[offset] = letter;
      newVal = newVal.join('').padEnd(pw.length, ' ').trimEnd();
      setCrosswordAnswers({ ...crosswordAnswers, [key]: newVal });
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
    return <div className="p-8 text-center text-stone-500 dark:text-stone-400">No crossword data</div>;
  }

  const acrossWords = placedWords.filter(p => p.direction === 'across').sort((a, b) => a.number - b.number);
  const downWords = placedWords.filter(p => p.direction === 'down').sort((a, b) => a.number - b.number);

  return (
    <div className="p-4 flex flex-col min-h-0">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <span className="text-sm font-medium text-stone-500 dark:text-stone-400">Fill in the puzzle</span>
        {onEnlarge && (
          <button
            onClick={onEnlarge}
            className="text-xs px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-800/60 transition-colors flex items-center gap-1.5"
          >
            Open full screen
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto min-h-0" tabIndex={0} onKeyDown={handleKeyDown}>
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Grid */}
          <div className="bg-white dark:bg-stone-700 rounded-xl border border-stone-200 dark:border-stone-600 p-3 overflow-x-auto">
            <div className="inline-block">
              {grid.map((row, rowIdx) => (
                <div key={rowIdx} className="flex">
                  {row.map((cell, colIdx) => {
                    if (cell === '' || cell === '#') return <div key={colIdx} className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 bg-stone-800" />;
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
                    let cellClass = 'bg-white dark:bg-stone-600 border border-stone-300 dark:border-stone-500';
                    if (isSelected) cellClass = 'bg-amber-200 dark:bg-amber-800/50 border-amber-500 ring-2 ring-amber-400';
                    else if (isHighlighted) cellClass = 'bg-amber-50 dark:bg-amber-900/30 border-amber-400';
                    if (checked) {
                      const wordsThrough = placedWords.filter(p => {
                        if (p.direction === 'across') return rowIdx === p.row && colIdx >= p.col && colIdx < p.col + p.length;
                        return colIdx === p.col && rowIdx >= p.row && rowIdx < p.row + p.length;
                      });
                      const attempted = wordsThrough.filter(p => (crosswordAnswers[`word-${p.number}`] || '').length > 0);
                      const anyCorrect = attempted.some(p => (crosswordAnswers[`word-${p.number}`] || '').toUpperCase() === p.word);
                      const anyWrong = attempted.some(p => (crosswordAnswers[`word-${p.number}`] || '').toUpperCase() !== p.word);
                      if (attempted.length > 0) {
                        if (anyCorrect && !anyWrong) cellClass = 'bg-green-50 dark:bg-green-900/20 border-green-400';
                        else if (anyWrong) cellClass = 'bg-red-50 dark:bg-red-900/20 border-red-400';
                      }
                    }
                    return (
                      <div
                        key={colIdx}
                        onClick={() => handleCellClick(rowIdx, colIdx)}
                        className={`w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 flex items-center justify-center relative cursor-pointer text-xs sm:text-sm font-bold text-stone-700 dark:text-stone-200 ${cellClass}`}
                      >
                        {cellNum && <span className="absolute top-0 left-0.5 text-[7px] text-stone-500">{cellNum}</span>}
                        {display}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
          {/* Clues */}
          <div className="space-y-3 flex-1 min-w-0">
            <div>
              <h4 className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-2">Across →</h4>
              <div className="space-y-1.5">
                {acrossWords.map((pw) => {
                  const key = `word-${pw.number}`;
                  const val = crosswordAnswers[key] || '';
                  const isCorrect = checked && val && val.toUpperCase() === pw.word;
                  const isWrong = checked && val && val.toUpperCase() !== pw.word;
                  return (
                    <div
                      key={pw.number}
                      onClick={() => { setSelectedClue(pw.number); setSelectedDirection('across'); setSelectedCell({ row: pw.row, col: pw.col }); }}
                      className={`p-2 rounded-lg border cursor-pointer text-xs ${
                        selectedClue === pw.number ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' :
                        isCorrect ? 'border-green-300 bg-green-50 dark:bg-green-900/20' :
                        isWrong ? 'border-red-300 bg-red-50 dark:bg-red-900/20' :
                        'border-stone-200 dark:border-stone-600 hover:border-amber-300'
                      }`}
                    >
                      <span className="font-bold text-amber-600 mr-1">{pw.number}.</span>
                      {pw.clue} <span className="text-stone-400">({pw.word.length})</span>
                      <input
                        ref={selectedClue === pw.number && selectedDirection === 'across' ? inputRef : undefined}
                        type="text"
                        maxLength={pw.word.length}
                        value={val}
                        onChange={(e) => setCrosswordAnswers({ ...crosswordAnswers, [key]: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
                        onFocus={() => { setSelectedClue(pw.number); setSelectedDirection('across'); setSelectedCell({ row: pw.row, col: pw.col }); }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={checked}
                        placeholder={'—'.repeat(pw.word.length)}
                        className="mt-1 w-full px-2 py-1 text-xs font-mono tracking-wider uppercase border rounded bg-stone-50 dark:bg-stone-800"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold text-stone-600 dark:text-stone-400 uppercase mb-2">Down ↓</h4>
              <div className="space-y-1.5">
                {downWords.map((pw) => {
                  const key = `word-${pw.number}`;
                  const val = crosswordAnswers[key] || '';
                  const isCorrect = checked && val && val.toUpperCase() === pw.word;
                  const isWrong = checked && val && val.toUpperCase() !== pw.word;
                  return (
                    <div
                      key={pw.number}
                      onClick={() => { setSelectedClue(pw.number); setSelectedDirection('down'); setSelectedCell({ row: pw.row, col: pw.col }); }}
                      className={`p-2 rounded-lg border cursor-pointer text-xs ${
                        selectedClue === pw.number ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20' :
                        isCorrect ? 'border-green-300 bg-green-50 dark:bg-green-900/20' :
                        isWrong ? 'border-red-300 bg-red-50 dark:bg-red-900/20' :
                        'border-stone-200 dark:border-stone-600 hover:border-amber-300'
                      }`}
                    >
                      <span className="font-bold text-amber-600 mr-1">{pw.number}.</span>
                      {pw.clue} <span className="text-stone-400">({pw.word.length})</span>
                      <input
                        ref={selectedClue === pw.number && selectedDirection === 'down' ? inputRef : undefined}
                        type="text"
                        maxLength={pw.word.length}
                        value={val}
                        onChange={(e) => setCrosswordAnswers({ ...crosswordAnswers, [key]: e.target.value.toUpperCase().replace(/[^A-Z]/g, '') })}
                        onFocus={() => { setSelectedClue(pw.number); setSelectedDirection('down'); setSelectedCell({ row: pw.row, col: pw.col }); }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={checked}
                        placeholder={'—'.repeat(pw.word.length)}
                        className="mt-1 w-full px-2 py-1 text-xs font-mono tracking-wider uppercase border rounded bg-stone-50 dark:bg-stone-800"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setChecked(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-semibold text-sm"
              >
                Check Answers
              </button>
              {checked && (
                <button
                  onClick={() => { setChecked(false); setCrosswordAnswers({}); setSelectedClue(null); setSelectedCell(null); }}
                  className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-stone-600 text-stone-700 dark:text-stone-200 font-medium text-sm"
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
