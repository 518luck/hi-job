// # Vue 职位数据类型：主世界 Vue 数据服务的输入输出结构

// 主世界读取的当前职位原始数据，缺项为空串
interface VueJobData {
  salaryDesc: string; // 原始薪资描述，如 10-15K
  companyScale: string; // 公司规模，如 100-499人
  companyIndustry: string; // 公司行业，如 互联网
}

// 单张列表卡片的规模信息
interface VueJobCard {
  scale: string; // 公司规模，如 1000-9999人
  industry: string; // 公司行业，如 互联网
}

export type { VueJobCard, VueJobData };
