/**
 * Mental math question bank for Crater Blast "Mental Math" mode.
 * Add, subtract, multiply, divide. Max 12×12 (144). Free for all users.
 */
import type { WordBankQuestion } from './craterBlastWordBank';

function wrongs(correct: number): string[] {
  const s = new Set<number>();
  const o = Math.max(1, Math.abs(correct) < 10 ? 1 : Math.floor(Math.abs(correct) / 10));
  for (let i = 0; i < 20 && s.size < 3; i++) {
    const d = (i % 3 === 0 ? 1 : i % 3 === 1 ? -1 : 2) * (o + (i % 2) + 1);
    const c = correct + d;
    if (c !== correct && c >= 0 && c <= 999) s.add(c);
  }
  let fallback = 1;
  while (s.size < 3 && fallback < 20) {
    const c = correct + (fallback % 2 ? 1 : -1) * fallback;
    if (c !== correct && c >= 0 && c <= 999) s.add(c);
    fallback++;
  }
  return [...s].slice(0, 3).map(String);
}

function build(): WordBankQuestion[] {
  const b: WordBankQuestion[] = [];
  const k = new Set<string>();
  for (let a = 1; a <= 12; a++) for (let x = 1; x <= 12; x++) {
    const key = `m${a}x${x}`;
    if (k.has(key)) continue;
    k.add(key);
    const r = a * x;
    b.push({ prompt: `${a} × ${x} = ?`, answers: [String(r), ...wrongs(r)], correctIndex: 0 });
  }
  [[32,3],[15,8],[24,4],[18,5],[14,7],[25,4],[16,6],[20,6],[30,4],[22,5],[17,6],[13,8],[21,6],[26,3],[28,3],[27,4],[36,3],[40,3],[10,12],[9,14],[8,15],[7,16],[6,18],[5,20],[4,24],[3,32]].forEach(([a,x]) => {
    const key = `m${a}x${x}`;
    if (k.has(key)) return;
    k.add(key);
    const r = a * x;
    if (r <= 144) b.push({ prompt: `${a} × ${x} = ?`, answers: [String(r), ...wrongs(r)], correctIndex: 0 });
  });
  for (let a = 2; a <= 12; a++) for (let q = 1; q <= 12; q++) {
    const d = a * q;
    if (d > 144) continue;
    const key = `d${d}/${a}`;
    if (k.has(key)) continue;
    k.add(key);
    b.push({ prompt: `${d} ÷ ${a} = ?`, answers: [String(q), ...wrongs(q)], correctIndex: 0 });
  }
  const add = [[1,2],[3,4],[5,6],[7,8],[9,10],[11,12],[13,14],[15,16],[17,18],[19,20],[21,22],[23,24],[25,26],[27,28],[29,30],[31,32],[33,34],[35,36],[37,38],[39,40],[41,42],[43,44],[45,46],[47,48],[49,50],[32,45],[28,67],[54,38],[91,23],[15,89],[72,44],[36,58],[63,27],[48,52],[19,76],[84,31],[57,43],[29,81],[66,34],[92,18],[41,59],[73,37],[25,85],[68,42],[51,49],[10,34],[22,56],[44,78],[67,33],[88,12],[99,11],[77,23],[55,45],[33,67],[11,89],[12,24],[18,36],[20,40],[14,28],[16,32],[8,16],[6,12],[4,8],[10,20],[22,44],[26,52],[30,60],[34,68],[38,76],[42,84],[46,92],[50,50],[60,40],[70,30],[80,20],[90,10],[100,44],[56,88],[72,72],[96,48],[64,80]];
  add.forEach(([a,x]) => {
    const key = `a${a}+${x}`;
    if (k.has(key)) return;
    k.add(key);
    const r = a + x;
    b.push({ prompt: `${a} + ${x} = ?`, answers: [String(r), ...wrongs(r)], correctIndex: 0 });
  });
  for (let a = 30; a <= 144; a += 4) for (let x = 5; x < a; x += 6) {
    const key = `s${a}-${x}`;
    if (k.has(key)) continue;
    k.add(key);
    const r = a - x;
    b.push({ prompt: `${a} − ${x} = ?`, answers: [String(r), ...wrongs(r)], correctIndex: 0 });
    if (b.filter(q=>q.prompt.includes('−')).length >= 110) break;
  }
  return b;
}

export const CRATER_BLAST_MENTAL_MATH_BANK: WordBankQuestion[] = build();
