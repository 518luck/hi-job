// FAQ 条目：用户最关心的四个问题
const FAQS: readonly { question: string; answer: string }[] = [
  {
    question: '更新会丢数据吗？',
    answer:
      '不会。扩展 ID 已固定，重新加载新版后职位记录、HR 档案、屏蔽名单等数据自动延续。',
  },
  {
    question: '我的数据安全吗？',
    answer:
      '所有数据仅保存在你浏览器本地（IndexedDB），不上传任何服务器；AI 厂商的 API Key 也只存本地。',
  },
  {
    question: '支持哪些浏览器？',
    answer: 'Chrome、Edge 等 Chromium 内核浏览器；Firefox 版暂不提供。',
  },
  {
    question: '是免费的吗？',
    answer:
      '是，开源项目永久免费。AI 生成功能使用你自己配置的厂商 Key，费用由相应厂商收取。',
  },
];

// FAQ 区：问答列表
export function FaqSection() {
  return (
    <section className="py-16 sm:py-20">
      <h2 className="mb-10 text-center text-2xl font-bold tracking-tight sm:text-3xl">
        常见问题
      </h2>
      <div className="mx-auto max-w-2xl space-y-3">
        {FAQS.map(({ question, answer }) => (
          <details
            key={question}
            className="group rounded-xl border bg-card p-5"
          >
            <summary className="cursor-pointer list-none text-sm font-medium marker:hidden">
              {question}
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
