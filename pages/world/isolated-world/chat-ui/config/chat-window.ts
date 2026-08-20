// # 聊天窗常量：尺寸、悬停气泡与复制交互时序、场景按钮元数据

import type { AiStreamMethod } from '../model/use-ai-stream';

// 聊天窗宽度：与父级定位计算保持一致
export const CHAT_WINDOW_WIDTH = 340;

// 聊天窗高度：与父级定位计算保持一致
export const CHAT_WINDOW_HEIGHT = 420;

// 悬停气泡展示延迟：避免扫过按钮时频繁闪现
export const HOVER_DELAY_MS = 300;

// 复制成功对勾的恢复时长
export const COPY_RESET_MS = 1200;

// 悬停气泡层级：窗口自身为 z-2147483646，气泡挂 shadow 根需更高层才能压住窗口
export const TOOLTIP_Z_CLASS = 'z-[2147483647]';

// 场景按钮元数据
export interface SceneButton {
  label: string; // 按钮文案
  method: AiStreamMethod; // 触发的协议方法
  tip: string; // 悬停气泡的时机说明
  align: 'start' | 'center' | 'end'; // 气泡对齐：按按钮在窗内位置钳制不溢出窗宽/视口
}

// 场景按钮元数据表：文案、协议方法与使用时机说明；顺序对齐日志来源枚举（问候→回复→提醒→反馈）
export const SCENE_BUTTONS: readonly SceneButton[] = [
  {
    label: '问候',
    method: 'greeting',
    tip: '首次联系时结合职位与 HR 信息生成打招呼语',
    align: 'start',
  },
  {
    label: '回复',
    method: 'generateReply',
    tip: '结合聊天记录与职位信息，生成下一条回复',
    align: 'start',
  },
  {
    label: '提醒',
    method: 'followUp',
    tip: '对方已读未回时生成自然跟进',
    align: 'center',
  },
  {
    label: '反馈',
    method: 'rejectionFeedback',
    tip: '沟通结束或被拒后，生成礼貌请教反馈的消息',
    align: 'end',
  },
];
