import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

// 转义产物中的非法 Unicode 码位（代理区/非字符）：Chrome 的内容脚本严格校验会拒绝它们
const escapeIllegalCodePoints: ReturnType<typeof tailwindcss>[number] = {
  name: 'escape-illegal-code-points',
  generateBundle(_options, bundle) {
    for (const file of Object.values(bundle)) {
      if (file.type !== 'chunk') {
        continue;
      }
      file.code = file.code.replace(
        /[\uDC00-\uDFFF\uFDD0-\uFDEF\uFFFE\uFFFF]/g,
        (point) => `\\u${point.charCodeAt(0).toString(16).padStart(4, '0')}`,
      );
    }
  },
};

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    // 扩展显示名与描述：安装后在 chrome://extensions 与商店展示
    name: '更好用的 boss 直聘',
    description: 'BOSS直聘求职辅助：AI 生成、职位记录、HR 档案、屏蔽公司',
    // 公钥仅用于钉死扩展 ID，使 storage 数据不随项目路径变化而失联
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAwIgU15grPaqar8GCdUuDgJ6JhpxBIzeAv1F4rcvswSOH7l+HFke6idLy7/Yy/SBq27cbnybHFgaHoELZgJnXm17XoGTV8XgOO0AfmOVyfypcAUpu8vJ4djSG6zilSktj6B0nt5CawzHR1Hop+3GmwLYxm94hRlnbZmJRKpPKZI1CfdfH8s02byD7JXPZgYnxMLRzSbWArRTdzDMYNU+na+my9i0RCuKPiaAMhj/yfzum3nKfx3TF/LPf7visTD95wxhtvzvX0r8EJ89jVm95d53I9Lo55pJFnPJE1g69FQ8kMz3fQXo1OvgRAF0Xcfo7kxCDZgVMb2b47H26+zB6jQIDAQAB',
    permissions: ['unlimitedStorage'],
    // zhipin 主机权限：内容脚本注入与后台按 URL 查找标签页（上下文查询、名单广播）都依赖它
    host_permissions: ['*://*.zhipin.com/*'],
    // AI 厂商地址由用户自定义：声明可选 host 权限，拉取模型时按 origin 逐个申请
    optional_host_permissions: ['*://*/*'],
  },
  // 不自动打开隔离 Chrome 实例：扩展由日常 Chrome 手动加载，数据存日常 profile，重启不丢
  webExt: {
    disabled: true,
  },
  vite: () => ({
    plugins: [tailwindcss(), escapeIllegalCodePoints],
    // ! 说明：Chrome 对内容脚本做严格 UTF-8 校验，会拒绝 U+FFFF 等非字符
    // （Dexie 源码含 \uFFFF 哨兵字面量，中文系统 Chrome 报「不是 UTF-8 编码」拒载），
    // 由上方插件在打包产物中将其转义为 \uXXXX，语义不变且必定合法
  }),
});
