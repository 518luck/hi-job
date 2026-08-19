// # 液态玻璃常量：折射与高光的可调观感参数（小胶囊、浅色宿主页面）

// 玻璃滤镜最小生效尺寸：低于此值不生成贴图（createImageData 要求正整数，过小也无折射意义）
export const MIN_GLASS_SIZE_PX = 2;

// bezelRatio 收窄折射带：折射集中在外缘、留出清澈中心，呈现「边缘折射」而非整片均匀扭曲
export const GLASS_BEZEL_RATIO = 0.45; // 折射带宽度占半径比例，越小折射越贴边
export const GLASS_IOR = 2.0; // 折射率，越大边缘弯曲越强
export const GLASS_THICKNESS = 8; // 玻璃厚度，越大边缘位移越强
export const GLASS_SCALE_RATIO = 0.9; // 位移缩放比例，让边缘弯曲在小胶囊上可见
export const SPEC_SATURATION = 1.6; // 折射饱和度
export const SPEC_OPACITY = 0.6; // 高光不透明度，让边缘反光更明显
