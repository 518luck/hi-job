// # 液态玻璃贴图生成（聊天 UI）：SDF 边缘透镜重映射位移图
//
// 算法来自 Shu Ding 的开源 liquid-glass（https://github.com/shuding/liquid-glass，2025），
// 由其 UV 域实现改为像素域适配胶囊按钮：内层胶囊 SDF 定出清澈中心，向外经 smoothStep
// 过渡到边缘强折射（采样点向中心收缩 = 边缘放大透镜），位移按最大值归一化编码进
// R/G 通道，经 feImage + feDisplacementMap 注入 backdrop-filter。

import {
  GLASS_BAND_RATIO,
  GLASS_INSET_RATIO,
  MIN_GLASS_SIZE_PX,
} from '../config/glass';

// 平滑阶梯（与 liquid-glass 同式）：a>b 时自外向内过渡
const smoothStep = (a: number, b: number, t: number): number => {
  const clamped = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return clamped * clamped * (3 - 2 * clamped);
};

// 向量长度
const lengthOf = (x: number, y: number): number => Math.sqrt(x * x + y * y);

// 圆角矩形有符号距离（负值在形内）：width/height 为半宽半高
const roundedRectSDF = (
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): number => {
  const qx = Math.abs(x) - width + radius;
  const qy = Math.abs(y) - height + radius;
  return (
    Math.min(Math.max(qx, qy), 0) +
    lengthOf(Math.max(qx, 0), Math.max(qy, 0)) -
    radius
  );
};

// 组装一次玻璃滤镜所需的贴图与参数
interface GlassMapInput {
  width: number; // 元素宽（px）
  height: number; // 元素高（px）
  radius: number; // 圆角半径（px）
}

// 滤镜输出参数：位移贴图 data URL 与位移强度
interface GlassMaps {
  displacementUrl: string; // 位移贴图 data URL（R/G 通道编码归一化采样偏移）
  scale: number; // feDisplacementMap 位移强度（px）
}

// 由元素尺寸生成边缘透镜位移贴图：供 SVG 滤镜的 feImage 使用
const buildGlassMaps = ({
  width,
  height,
  radius,
}: GlassMapInput): GlassMaps => {
  // 尺寸未测得（首帧为 0）时不生成，由组件据此跳过渲染，避免 createImageData 崩溃
  if (width < MIN_GLASS_SIZE_PX || height < MIN_GLASS_SIZE_PX) {
    return { displacementUrl: '', scale: 0 };
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    return { displacementUrl: '', scale: 0 };
  }

  // 内层胶囊（清澈区边界）与透镜过渡带宽
  const short = Math.min(width, height);
  const inset = Math.max(short * GLASS_INSET_RATIO, 1);
  const band = Math.max(short * GLASS_BAND_RATIO, 1);
  const halfWidth = width / 2 - inset;
  const halfHeight = height / 2 - inset;
  const innerRadius = Math.max(radius - inset, 1);
  const centerX = width / 2;
  const centerY = height / 2;

  // 第一遍：逐像素算目标采样点与偏移，记录最大偏移用于归一化
  const offsets = new Float32Array(width * height * 2);
  let maxOffset = 0;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const relX = x - centerX;
      const relY = y - centerY;
      const sdf = roundedRectSDF(
        relX,
        relY,
        halfWidth,
        halfHeight,
        innerRadius,
      );
      // 内层形内为 1（原样采样、中心清澈），向外过渡到 0（采样点收到中心、边缘最强折射）
      const falloff = smoothStep(band, 0, sdf);
      const scaled = falloff * falloff * (3 - 2 * falloff);
      const sampleX = centerX + relX * scaled;
      const sampleY = centerY + relY * scaled;
      const dx = sampleX - x;
      const dy = sampleY - y;
      const index = (y * width + x) * 2;
      offsets[index] = dx;
      offsets[index + 1] = dy;
      maxOffset = Math.max(maxOffset, Math.abs(dx), Math.abs(dy));
    }
  }

  // 归一化与 liquid-glass 相同：最大偏移减半，滤镜 scale 直接用该值（通道编码 dx/max + 0.5）
  maxOffset *= 0.5;
  if (maxOffset <= 0) {
    return { displacementUrl: '', scale: 0 };
  }

  // 第二遍：偏移写入 R/G 通道，中性 0.5 为无位移；Uint8ClampedArray 自动钳制越界
  const img = ctx.createImageData(width, height);
  const data = img.data;
  for (let i = 0, j = 0; i < data.length; i += 4, j += 2) {
    const dx = offsets[j] ?? 0;
    const dy = offsets[j + 1] ?? 0;
    data[i] = (dx / maxOffset + 0.5) * 255;
    data[i + 1] = (dy / maxOffset + 0.5) * 255;
    data[i + 2] = 0;
    data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return { displacementUrl: canvas.toDataURL(), scale: maxOffset };
};

export { buildGlassMaps };
