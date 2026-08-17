// # 全部数据导出：把职位、公司、HR 档案与聊天消息打包成 JSON 文件下载
import {
  chatMessageStore,
  hrStore,
  jdStore,
} from '@/shared/infra/storage';

// 两位数字补零，用于文件名里的时间片段
const pad2 = (value: number): string => String(value).padStart(2, '0');

// 生成下载文件名：hi-job-export-年月日-时分秒.json
const exportFileName = (now: Date): string =>
  `hi-job-export-${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}-${pad2(now.getHours())}${pad2(now.getMinutes())}${pad2(now.getSeconds())}.json`;

// 导出全部数据：读取四张表，组装 JSON 并触发浏览器下载
const exportAllData = async (): Promise<void> => {
  const [jds, companies, hrs, chatMessages] = await Promise.all([
    jdStore.readAllRecordedJds(),
    jdStore.readAllCompanyRecords(),
    hrStore.readAllHrs(),
    chatMessageStore.readAllChatMessages(),
  ]);

  const payload = JSON.stringify(
    { exportedAt: Date.now(), jds, companies, hrs, chatMessages },
    null,
    2,
  );
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = exportFileName(new Date());
  anchor.click();
  URL.revokeObjectURL(url);
};

export { exportAllData };