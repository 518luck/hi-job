import {
  Bot,
  Briefcase,
  Building2,
  ChevronDown,
  Copy,
  Download,
  ExternalLink,
  History,
  Monitor,
  Moon,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  Star,
  Sun,
  Trash2,
} from 'lucide-react';

// 全局图标注册表：业务代码统一通过 Icons 对象使用，不直接导入图标库
const Icons = {
  workbench: Briefcase,
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
  aiVendors: Bot,
  add: Plus,
  edit: Pencil,
  remove: Trash2,
  refresh: RefreshCw,
  copy: Copy,
  externalLink: ExternalLink,
};

export { Icons };
