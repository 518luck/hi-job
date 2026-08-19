// # AI 回复悬浮按钮（聊天 UI）：液态玻璃胶囊，按住拖拽改变位置，点击切换聊天窗显隐

import type { PointerEvent as ReactPointerEvent, RefObject } from 'react';
import { useRef } from 'react';

// 拖拽位移阈值：低于此值视为点击抖动，不触发拖拽
const DRAG_THRESHOLD_PX = 6;

// 拖拽过程状态：pressed 按住中，dragging 已越过阈值视为拖拽
interface DragState {
  startX: number; // 按下时指针 x
  startY: number; // 按下时指针 y
  startLeft: number; // 按下时按钮左缘 x
  startTop: number; // 按下时按钮上缘 y
  pressed: boolean; // 是否按住
  dragging: boolean; // 是否已进入拖拽
}

// 按钮位置：视口固定坐标
interface FabPosition {
  x: number;
  y: number;
}

// 悬浮按钮属性
interface ChatFabProps {
  fabRef: RefObject<HTMLButtonElement | null>; // 按钮元素引用，供父级定位聊天窗
  pos: FabPosition; // 当前停靠位置
  onPosChange: (pos: FabPosition) => void; // 拖拽中的位置更新
  onToggle: () => void; // 点击（未拖拽松开）时切换聊天窗
}

// 悬浮按钮：pointer 事件实现「按住拖动 / 单击开关」，拖动位置限制在视口内
function ChatFab({ fabRef, pos, onPosChange, onToggle }: ChatFabProps) {
  const dragRef = useRef<DragState>({
    startX: 0,
    startY: 0,
    startLeft: 0,
    startTop: 0,
    pressed: false,
    dragging: false,
  });

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      pressed: true,
      dragging: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const drag = dragRef.current;
    // 仅按住时处理移动：悬停移动不触发，避免按钮「逃跑」
    if (!drag.pressed) {
      return;
    }
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (
      Math.abs(dx) <= DRAG_THRESHOLD_PX &&
      Math.abs(dy) <= DRAG_THRESHOLD_PX
    ) {
      return;
    }
    drag.dragging = true;
    const { offsetWidth, offsetHeight } = event.currentTarget;
    // 拖动位置限制在视口内
    onPosChange({
      x: Math.min(
        Math.max(drag.startLeft + dx, 0),
        window.innerWidth - offsetWidth,
      ),
      y: Math.min(
        Math.max(drag.startTop + dy, 0),
        window.innerHeight - offsetHeight,
      ),
    });
  };

  const handlePointerUp = () => {
    const drag = dragRef.current;
    drag.pressed = false;
    // 发生过拖拽时松开不触发点击
    if (drag.dragging) {
      drag.dragging = false;
      return;
    }
    onToggle();
  };

  const handlePointerCancel = () => {
    dragRef.current.pressed = false;
    dragRef.current.dragging = false;
  };

  return (
    <button
      ref={fabRef}
      type="button"
      className="hijob-fab fixed z-2147483646"
      style={{ left: pos.x, top: pos.y }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <span className="relative z-1">AI 回复</span>
    </button>
  );
}

export type { FabPosition };
export { ChatFab };
