import { ChatDemo } from '../chat-demo/chat-demo';
import { RecordsMockup } from './records-mockup';
import { WorkbenchMockup } from './workbench-mockup';

// 产品界面区：用真实 DOM 重塑三大界面，锐利不糊；
// 构图取「一主两辅」——聊天窗是视觉主角，记录与工作台为辅
export function ShowcaseSection() {
  return (
    <section className="relative overflow-hidden py-16 sm:py-20">
      {/* 光晕背景：两团低饱和柔光垫底，衬托产品界面层次，克制不抢戏 */}
      <div
        aria-hidden
        className="showcase-glow pointer-events-none absolute inset-0"
      />

      <div className="relative">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          结合简历、JD 与聊天记录，回出更靠近 offer 的话
        </h2>
        <p className="mx-auto mt-3 mb-10 max-w-xl text-center text-sm text-muted-foreground">
          军师读懂你的简历与岗位要求，再消化和 HR
          的聊天记录，思考过程全程可见——每一句都基于真实材料，不说没有依据的话
        </p>

        <div className="grid items-start gap-6 lg:grid-cols-12">
          {/* 聊天窗：视觉主角，深色玻璃窗 + 全套流式动画 */}
          <div className="flex justify-center lg:col-span-5">
            <ChatDemo />
          </div>

          {/* 记录页 + 工作台：右侧纵向堆叠两个产品界面 */}
          <div className="flex flex-col gap-6 lg:col-span-7">
            <RecordsMockup />
            <WorkbenchMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
