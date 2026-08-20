// # 去沟通自动问候标记：详情页自动点击与聊天页自动问候之间的跨页触发协议
//
// 详情页模块在自动点「立即沟通」前写入 localStorage（同源存储，跳转聊天页后仍在）；
// 聊天页聊天 UI 挂载时读删一体消费，过期标记视为残留不触发。

// 标记存储键与有效期：有效期兜底脚本上下文销毁等极端场景的标记泄漏
const AUTO_GREET_MARKER_KEY = 'hijob-auto-greet-pending';
const AUTO_GREET_MARKER_TTL_MS = 30_000;

// 写入待触发标记：值为写入时间戳
const markAutoGreetPending = (): void => {
  localStorage.setItem(AUTO_GREET_MARKER_KEY, String(Date.now()));
};

// 读取并清除标记：仅在标记存在且未过期时返回 true（一次性消费）
const consumeAutoGreetMarker = (): boolean => {
  const raw = localStorage.getItem(AUTO_GREET_MARKER_KEY);
  if (raw === null) {
    return false;
  }
  localStorage.removeItem(AUTO_GREET_MARKER_KEY);
  const markedAt = Number(raw);
  return (
    Number.isFinite(markedAt) &&
    Date.now() - markedAt < AUTO_GREET_MARKER_TTL_MS
  );
};

// 清除标记：自动流程中途放弃时调用，防止残留触发后续手动进聊天页
const clearAutoGreetMarker = (): void => {
  localStorage.removeItem(AUTO_GREET_MARKER_KEY);
};

export { clearAutoGreetMarker, consumeAutoGreetMarker, markAutoGreetPending };
