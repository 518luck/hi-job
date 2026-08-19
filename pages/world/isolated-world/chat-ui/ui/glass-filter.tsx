// # 液态玻璃滤镜定义（聊天 UI）：噪声位移形成液态折射，供悬浮按钮伪元素引用
import type { ReactElement } from 'react';

// 玻璃滤镜 SVG：feTurbulence 噪声经模糊后位移源图形；频率与强度按悬浮按钮小尺寸调小
// 放在 Shadow Root 内的组件树里，url(#id) 引用不越出隔离层，也不污染宿主页面
const GlassFilter = (): ReactElement => (
  <svg
    aria-hidden="true"
    className="pointer-events-none absolute h-0 w-0 overflow-hidden"
  >
    <defs>
      <filter
        id="hijob-glass-distortion"
        x="0%"
        y="0%"
        width="100%"
        height="100%"
      >
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.02 0.02"
          numOctaves="2"
          seed="92"
          result="noise"
        />
        <feGaussianBlur in="noise" stdDeviation="2" result="blurred" />
        <feDisplacementMap
          in="SourceGraphic"
          in2="blurred"
          scale="40"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>
);

export { GlassFilter };
