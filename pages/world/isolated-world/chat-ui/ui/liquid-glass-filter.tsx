// # 液态玻璃滤镜（聊天 UI）：canvas 生成边缘透镜位移图，注入 SVG 滤镜供悬浮按钮 backdrop-filter 引用
//
// 算法源自 Shu Ding 的开源 liquid-glass（https://github.com/shuding/liquid-glass）：
// 位移图让玻璃边缘呈放大透镜、中心清澈。滤镜本身零渲染（宽高为 0），
// 仅靠 url(#id) 被 .hijob-fab::after 的 backdrop-filter 引用。

import type { ReactElement, ReactNode } from 'react';
import { Component, useMemo } from 'react';

import { LIQUID_GLASS_FILTER_ID } from '../config/liquid-glass-filter';
import { buildGlassMaps } from '../model/glass';

// 液态玻璃滤镜属性
interface LiquidGlassFilterProps {
  width: number; // 悬浮按钮渲染宽（px），位移贴图与之同尺寸
  height: number; // 悬浮按钮渲染高（px）
}

// 按按钮实际尺寸生成位移贴图，渲染为 SVG 滤镜
function GlassFilterSvg({
  width,
  height,
}: LiquidGlassFilterProps): ReactElement | null {
  // 胶囊圆角取短边一半：位移贴图按此计算透镜剖面
  const radius = Math.min(width, height) / 2;
  const maps = useMemo(
    () => buildGlassMaps({ width, height, radius }),
    [width, height, radius],
  );

  // 尺寸未测得或贴图生成为空时不渲染滤镜
  if (width < 2 || height < 2 || maps.displacementUrl === '') {
    return null;
  }

  return (
    <svg
      aria-hidden="true"
      colorInterpolationFilters="sRGB"
      className="pointer-events-none absolute h-0 w-0 overflow-hidden"
    >
      <defs>
        <filter
          id={LIQUID_GLASS_FILTER_ID}
          x="0%"
          y="0%"
          width="100%"
          height="100%"
        >
          {/* 位移图 + 位移：SourceGraphic 是 ::after 经 backdrop-filter 抓到的背景 */}
          <feImage
            href={maps.displacementUrl}
            x="0"
            y="0"
            width={width}
            height={height}
            result="disp_map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="disp_map"
            scale={maps.scale}
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}

// React 错误边界必须是 class 组件：玻璃滤镜渲染失败时降级为不渲染，不影响悬浮按钮本体
class GlassFilterErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  // 记录滤镜渲染异常：content script 注入宿主页本就难调试，静默失效需留痕
  override componentDidCatch(error: Error): void {
    console.warn('[hijob-chat-ui] 液态玻璃滤镜渲染失败', error);
  }

  override render(): ReactNode {
    if (this.state.failed) {
      return null;
    }
    return this.props.children;
  }
}

// 对外导出的液态玻璃滤镜：错误边界包裹，滤镜异常时仅失去玻璃效果、按钮仍可用
function LiquidGlassFilter({
  width,
  height,
}: LiquidGlassFilterProps): ReactElement {
  return (
    // key 随尺寸变化重置边界：滤镜异常后尺寸改变可自愈重试，而非终身失败
    <GlassFilterErrorBoundary key={`${width}x${height}`}>
      <GlassFilterSvg width={width} height={height} />
    </GlassFilterErrorBoundary>
  );
}

export { LiquidGlassFilter };
