// # 演示驱动：脚本化时间轴复刻聊天窗的流式系列动画（等待→思考→逐词输出→收尾→循环）

import { useEffect, useMemo, useRef, useState } from 'react';

import { DEMO_SCRIPTS, type DemoScript, pickNextScript } from './scripts';

// 各阶段节奏：等待首包、思考行间隔、逐词间隔（含抖动上限）、收尾停留
const WAITING_MS = 1100;
const REASONING_LINE_MS = 850;
const WORD_MS = 105;
const WORD_JITTER_MS = 70;
const DONE_HOLD_MS = 4200;
// 收尾「思考了 N 秒」的秒数：思考阶段时长折算
const REASONING_SECONDS_BASE = 3;

// 驱动状态：phase 推进 + 各计数
interface ScriptedStreamState {
  script: DemoScript; // 当前剧本
  phase: 'waiting' | 'thinking' | 'streaming' | 'done'; // 当前阶段
  visibleReasoningLines: number; // 已浮现的思考行数
  visibleWords: number; // 已输出的词数
  elapsedSeconds: number; // 累计秒数（思考耗时与顶栏 total 共用）
  ttftMs: number | null; // 首「token」延迟展示（等待结束时锁定）
}

// 词切分：与扩展同规则的简化版——中文按 2 字符、其余按空白
const splitWords = (text: string): string[] => text.match(/[\u4e00-\u9fff]{1,2}|[^\s]+/gu) ?? [];

// 驱动返回：状态本体 + 派生的词序列与收尾秒数
type ScriptedStreamResult = ScriptedStreamState & {
  words: string[]; // 剧本正文按词切分的全量序列
  restingSeconds: number; // 「思考了 N 秒」的收尾秒数
};

// 剧本化流式驱动：按时间轴推进阶段与计数，播完停顿后换剧本循环；
// 减弱动态时直接跳到完成态静态展示
export const useScriptedStream = (): ScriptedStreamResult => {
  const [index, setIndex] = useState(0);
  const [state, setState] = useState<ScriptedStreamState>(() => ({
    script: DEMO_SCRIPTS[0],
    phase: 'waiting',
    visibleReasoningLines: 0,
    visibleWords: 0,
    elapsedSeconds: 0,
    ttftMs: null,
  }));
  const [reducedMotion, setReducedMotion] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // 减弱动态检测：演示直接呈现终态
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent): void => {
      setReducedMotion(event.matches);
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  // 剧本推进入：安排下一步定时并推进状态
  useEffect(() => {
    if (reducedMotion) {
      setState({
        script: DEMO_SCRIPTS[index] ?? DEMO_SCRIPTS[0],
        phase: 'done',
        visibleReasoningLines: Number.MAX_SAFE_INTEGER,
        visibleWords: Number.MAX_SAFE_INTEGER,
        elapsedSeconds: REASONING_SECONDS_BASE,
        ttftMs: WAITING_MS,
      });
      return;
    }
    const script = DEMO_SCRIPTS[index] ?? DEMO_SCRIPTS[0];
    const words = splitWords(script.reply);

    setState({
      script,
      phase: 'waiting',
      visibleReasoningLines: 0,
      visibleWords: 0,
      elapsedSeconds: 0,
      ttftMs: null,
    });

    // 逐段推进：等待 → 逐行思考 → 逐词输出 → 停顿换本
    const schedule = (delayMs: number, step: () => void): void => {
      timerRef.current = setTimeout(step, delayMs);
    };

    schedule(WAITING_MS, () => {
      setState((previous) => ({ ...previous, ttftMs: WAITING_MS }));
      let line = 0;
      const nextLine = (): void => {
        line += 1;
        setState((previous) => ({
          ...previous,
          phase: 'thinking',
          visibleReasoningLines: line,
        }));
        if (line < script.reasoning.length) {
          schedule(REASONING_LINE_MS, nextLine);
        } else {
          schedule(REASONING_LINE_MS, nextWord);
        }
      };
      let word = 0;
      const nextWord = (): void => {
        word += 1;
        setState((previous) => ({
          ...previous,
          phase: 'streaming',
          visibleWords: word,
        }));
        if (word < words.length) {
          schedule(WORD_MS + Math.random() * WORD_JITTER_MS, nextWord);
        } else {
          setState((previous) => ({ ...previous, phase: 'done' }));
          schedule(DONE_HOLD_MS, () => {
            const next = pickNextScript(index);
            setIndex(next.index);
          });
        }
      };
      schedule(REASONING_LINE_MS, nextLine);
    });

    return () => clearTimeout(timerRef.current);
  }, [index, reducedMotion]);

  // 秒表：从等待起累计，完成即停（收尾秒数与顶栏 total 共用）
  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    const startedAt = Date.now();
    const ticker = setInterval(() => {
      setState((previous) => {
        if (previous.phase === 'done') {
          return previous;
        }
        return { ...previous, elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000) };
      });
    }, 1000);
    return () => clearInterval(ticker);
  }, [index, reducedMotion]);

  // 词序列与终态秒数派生
  const words = useMemo(() => splitWords(state.script.reply), [state.script]);
  const restingSeconds = Math.max(
    REASONING_SECONDS_BASE,
    state.elapsedSeconds,
  );

  return {
    ...state,
    words,
    restingSeconds,
  };
};
