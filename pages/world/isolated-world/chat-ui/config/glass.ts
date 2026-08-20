// # 液态玻璃常量：边缘透镜重映射的可调观感参数（Shu Ding liquid-glass 算法）

// 玻璃滤镜最小生效尺寸：低于此值不生成贴图（createImageData 要求正整数，过小也无折射意义）
export const MIN_GLASS_SIZE_PX = 2;

// 内缩清澈区比例（占短边）：内层胶囊边界向内收的量，越大中心越清澈、透镜带越贴边
export const GLASS_INSET_RATIO = 0.25;

// 边缘透镜带宽度比例（占短边）：从内层边界向外过渡到最强折射的带宽，越大折射过渡越宽
export const GLASS_BAND_RATIO = 0.55;
