import { OperationDemo } from './operation-demo';

// 产品演示区：循环演出「点击沟通 → 跳转聊天 → 军师流式输出」的完整操作动画
export function ShowcaseSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      {/* 光晕背景：两团低饱和柔光垫底，衬托演示画面层次，克制不抢戏 */}
      <div
        aria-hidden
        className="showcase-glow pointer-events-none absolute inset-0"
      />

      <div className="relative">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          结合简历、JD 与聊天记录，回出更靠近 offer 的话
        </h2>
        <p className="mx-auto mt-3 mb-10 max-w-xl text-center text-sm text-muted-foreground">
          点一下「立即沟通」，军师读懂简历与岗位要求后流式写出开场白，思考过程全程可见——确认回复，一句话送达
          HR
        </p>

        <OperationDemo />
      </div>
    </section>
  );
}
