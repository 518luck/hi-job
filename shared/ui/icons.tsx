import {
  Briefcase,
  Building2,
  ChevronDown,
  Download,
  History,
  Monitor,
  Moon,
  Settings,
  Star,
  Sun,
  Trash2,
} from 'lucide-react';

// 全局图标注册表：业务代码统一通过 Icons 对象使用，不直接导入图标库
const Icons = {
  jobs: Briefcase,
  favorites: Star,
  settings: Settings,
  themeLight: Sun,
  themeDark: Moon,
  themeSystem: Monitor,
  company: Building2,
  history: History,
  chevronDown: ChevronDown,
  exportData: Download,
  clearData: Trash2,
};

export { Icons };
