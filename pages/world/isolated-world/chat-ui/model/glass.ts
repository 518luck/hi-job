// # 液态玻璃贴图生成（聊天 UI）：基于物理折射的位移图与高光图
//
// 参考开源 liquid-glass（iOS 26 风格）：不再用 feTurbulence 程序化噪声，而是按玻璃
// 剖面与折射率（IOR）算出位移场——玻璃边缘呈真实透镜折射、中心清澈。canvas 生成
// data URL，经 SVG 滤镜的 feImage 注入；backdrop-filter 负责抓背景并模糊。

// 玻璃表面剖面函数：x ∈ [0,1] 表示从中心到边缘，返回相对高度（保留对象结构便于换剖面调参）
const SURFACE_FNS = {
  convexSquircle: (x: number): number => (1 - (1 - x) ** 4) ** 0.25,
} as const;

// 玻璃滤镜最小生效尺寸：低于此值不生成贴图（createImageData 要求正整数，过小也无折射意义）
const MIN_GLASS_SIZE_PX = 2;

// 折射剖面入参
interface RefractionProfileInput {
  glassThickness: number; // 玻璃厚度，越大边缘折射越强
  bezelWidth: number; // 折射发生作用的边缘带宽度
  ior: number; // 折射率，越大位移越强
  samples?: number; // 采样数
}

// 按折射率与剖面计算横向位移剖面（每采样点的位移量）
const calculateRefractionProfile = ({
  glassThickness,
  bezelWidth,
  ior,
  samples = 128,
}: RefractionProfileInput): Float64Array => {
  const eta = 1 / ior;
  // 二维折射向量：给定法线方向返回折射后的方向
  const refract = ({
    nx,
    ny,
  }: {
    nx: number; // 法线 x 分量
    ny: number; // 法线 y 分量
  }): [number, number] | null => {
    const dot = ny;
    const k = 1 - eta * eta * (1 - dot * dot);
    if (k < 0) {
      return null;
    }
    const sq = Math.sqrt(k);
    return [-(eta * dot + sq) * nx, eta - (eta * dot + sq) * ny];
  };
  const heightFn = SURFACE_FNS.convexSquircle;
  const profile = new Float64Array(samples);
  for (let i = 0; i < samples; i += 1) {
    const x = i / samples;
    const y = heightFn(x);
    const dx = x < 1 ? 0.0001 : -0.0001;
    const deriv = (heightFn(x + dx) - y) / dx;
    const mag = Math.sqrt(deriv * deriv + 1);
    const ref = refract({ nx: -deriv / mag, ny: -1 / mag });
    if (ref === null) {
      profile[i] = 0;
      continue;
    }
    profile[i] = ref[0] * ((y * bezelWidth + glassThickness) / ref[1]);
  }
  return profile;
};

// 位移贴图入参
interface DisplacementMapInput {
  width: number; // 元素宽（px）
  height: number; // 元素高（px）
  radius: number; // 圆角半径
  bezelWidth: number; // 折射边缘带宽度
  profile: Float64Array; // 折射剖面
  maxDisp: number; // 剖面最大位移量（用于归一化）
}

// 生成位移贴图 data URL：R/G 通道编码 X/Y 位移，中心为中性 (128,128)
const generateDisplacementMap = ({
  width: w,
  height: h,
  radius,
  bezelWidth,
  profile,
  maxDisp,
}: DisplacementMapInput): string => {
  // 尺寸无效（未测得）时不生成：createImageData 要求正整数宽高
  if (w < MIN_GLASS_SIZE_PX || h < MIN_GLASS_SIZE_PX) {
    return '';
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    return '';
  }
  const img = ctx.createImageData(w, h);
  const d = img.data;
  // 先全部填中性位移（无偏移）
  for (let i = 0; i < d.length; i += 4) {
    d[i] = 128;
    d[i + 1] = 128;
    d[i + 2] = 0;
    d[i + 3] = 255;
  }

  const r = radius;
  const rSq = r * r;
  const r1Sq = (r + 1) ** 2;
  const rBSq = Math.max(r - bezelWidth, 0) ** 2;
  const wB = w - r * 2;
  const hB = h - r * 2;
  const sampleCount = profile.length;

  for (let y1 = 0; y1 < h; y1 += 1) {
    for (let x1 = 0; x1 < w; x1 += 1) {
      const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0;
      const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0;
      const dSq = x * x + y * y;
      if (dSq > r1Sq || dSq < rBSq) {
        continue;
      }
      const dist = Math.sqrt(dSq);
      const fromSide = r - dist;
      const op =
        dSq < rSq
          ? 1
          : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
      if (op <= 0 || dist === 0) {
        continue;
      }
      const cos = x / dist;
      const sin = y / dist;
      const bi = Math.min(
        ((fromSide / bezelWidth) * sampleCount) | 0,
        sampleCount - 1,
      );
      const disp = profile[bi] || 0;
      const dX = (-cos * disp) / maxDisp;
      const dY = (-sin * disp) / maxDisp;
      const idx = (y1 * w + x1) * 4;
      d[idx] = (128 + dX * 127 * op + 0.5) | 0;
      d[idx + 1] = (128 + dY * 127 * op + 0.5) | 0;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
};

// 高光贴图入参
interface SpecularMapInput {
  width: number; // 元素宽（px）
  height: number; // 元素高（px）
  radius: number; // 圆角半径
  bezelWidth: number; // 高光边缘带宽度
  angle?: number; // 高光入射方向
}

// 生成高光贴图 data URL：边缘白色反光，alpha 随边缘距离衰减
const generateSpecularMap = ({
  width: w,
  height: h,
  radius,
  bezelWidth,
  angle = Math.PI / 3,
}: SpecularMapInput): string => {
  // 尺寸无效（未测得）时不生成：createImageData 要求正整数宽高
  if (w < MIN_GLASS_SIZE_PX || h < MIN_GLASS_SIZE_PX) {
    return '';
  }
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    return '';
  }
  const img = ctx.createImageData(w, h);
  const d = img.data;
  d.fill(0);

  const r = radius;
  const rSq = r * r;
  const r1Sq = (r + 1) ** 2;
  const rBSq = Math.max(r - bezelWidth, 0) ** 2;
  const wB = w - r * 2;
  const hB = h - r * 2;
  const sv: [number, number] = [Math.cos(angle), Math.sin(angle)];

  for (let y1 = 0; y1 < h; y1 += 1) {
    for (let x1 = 0; x1 < w; x1 += 1) {
      const x = x1 < r ? x1 - r : x1 >= w - r ? x1 - r - wB : 0;
      const y = y1 < r ? y1 - r : y1 >= h - r ? y1 - r - hB : 0;
      const dSq = x * x + y * y;
      if (dSq > r1Sq || dSq < rBSq) {
        continue;
      }
      const dist = Math.sqrt(dSq);
      const fromSide = r - dist;
      const op =
        dSq < rSq
          ? 1
          : 1 - (dist - Math.sqrt(rSq)) / (Math.sqrt(r1Sq) - Math.sqrt(rSq));
      if (op <= 0 || dist === 0) {
        continue;
      }
      const cos = x / dist;
      const sin = -y / dist;
      const dot = Math.abs(cos * sv[0] + sin * sv[1]);
      const edge = Math.sqrt(Math.max(0, 1 - (1 - fromSide) ** 2));
      const coeff = dot * edge;
      const col = (255 * coeff) | 0;
      const alpha = (col * coeff * op) | 0;
      const idx = (y1 * w + x1) * 4;
      d[idx] = col;
      d[idx + 1] = col;
      d[idx + 2] = col;
      d[idx + 3] = alpha;
    }
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL();
};

// 组装一次玻璃滤镜所需的全部贴图与参数
interface GlassMapInput {
  width: number; // 元素宽（px）
  height: number; // 元素高（px）
  radius: number; // 圆角半径
}

// 滤镜输出参数：位移/高光 data URL 与滤镜数值
interface GlassMaps {
  displacementUrl: string; // 位移贴图 data URL
  specularUrl: string; // 高光贴图 data URL
  scale: number; // feDisplacementMap 位移强度
  specSat: number; // 折射结果饱和度
  specOpacity: number; // 高光不透明度
}

// 玻璃观感调参（小胶囊、浅色宿主页面）
// bezelRatio 收窄折射带：折射集中在外缘、留出清澈中心，呈现「边缘折射」而非整片均匀扭曲
const GLASS_BEZEL_RATIO = 0.45; // 折射带宽度占半径比例，越小折射越贴边
const GLASS_IOR = 2.0; // 折射率，越大边缘弯曲越强
const GLASS_THICKNESS = 8; // 玻璃厚度，越大边缘位移越强
const GLASS_SCALE_RATIO = 0.9; // 位移缩放比例，让边缘弯曲在小胶囊上可见
const SPEC_SATURATION = 1.6; // 折射饱和度
const SPEC_OPACITY = 0.6; // 高光不透明度，让边缘反光更明显

// 由元素尺寸生成位移图、高光图与滤镜数值：供 SVG 滤镜的 feImage 使用
const buildGlassMaps = ({
  width,
  height,
  radius,
}: GlassMapInput): GlassMaps => {
  // 尺寸未测得（首帧为 0）时返回空贴图，由组件据此跳过渲染，避免 createImageData 崩溃
  if (width < MIN_GLASS_SIZE_PX || height < MIN_GLASS_SIZE_PX) {
    return {
      displacementUrl: '',
      specularUrl: '',
      scale: 0,
      specSat: SPEC_SATURATION,
      specOpacity: SPEC_OPACITY,
    };
  }
  const bezel = Math.max(
    Math.min(
      radius * GLASS_BEZEL_RATIO,
      radius - 1,
      Math.min(width, height) / 2 - 1,
    ),
    1,
  );
  const profile = calculateRefractionProfile({
    glassThickness: GLASS_THICKNESS,
    bezelWidth: bezel,
    ior: GLASS_IOR,
  });
  const maxDisp =
    Math.max(...Array.from(profile).map((value) => Math.abs(value))) || 1;
  return {
    displacementUrl: generateDisplacementMap({
      width,
      height,
      radius,
      bezelWidth: bezel,
      profile,
      maxDisp,
    }),
    specularUrl: generateSpecularMap({
      width,
      height,
      radius,
      bezelWidth: bezel * 2.5,
    }),
    scale: maxDisp * GLASS_SCALE_RATIO,
    specSat: SPEC_SATURATION,
    specOpacity: SPEC_OPACITY,
  };
};

export { buildGlassMaps };
