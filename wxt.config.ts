import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

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
    // AI 厂商地址由用户自定义：声明可选 host 权限，拉取模型时按 origin 逐个申请
    optional_host_permissions: ['*://*/*'],
  },
  // 不自动打开隔离 Chrome 实例：扩展由日常 Chrome 手动加载，数据存日常 profile，重启不丢
  webExt: {
    disabled: true,
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
});
