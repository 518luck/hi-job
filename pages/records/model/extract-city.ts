// # 城市提取：从职位地址文本中识别所在城市
// 全国主要城市关键词：匹配地址中最早出现者，未命中返回空串
const CITY_KEYWORDS = [
  '北京',
  '上海',
  '广州',
  '深圳',
  '杭州',
  '南京',
  '苏州',
  '成都',
  '重庆',
  '武汉',
  '西安',
  '天津',
  '长沙',
  '郑州',
  '青岛',
  '大连',
  '宁波',
  '厦门',
  '福州',
  '合肥',
  '济南',
  '沈阳',
  '哈尔滨',
  '长春',
  '石家庄',
  '太原',
  '南昌',
  '昆明',
  '贵阳',
  '南宁',
  '海口',
  '兰州',
  '西宁',
  '银川',
  '乌鲁木齐',
  '呼和浩特',
  '拉萨',
  '无锡',
  '佛山',
  '东莞',
  '珠海',
  '中山',
  '惠州',
  '泉州',
  '温州',
  '常州',
  '南通',
  '徐州',
  '烟台',
  '潍坊',
  '洛阳',
  '台北',
  '香港',
  '澳门',
];

// 从地址文本提取城市：地址通常以「城市 区 街道」开头，取最早出现的关键词
const extractCity = (address: string): string => {
  if (address === '') {
    return '';
  }
  let best: { city: string; index: number } | undefined;
  for (const city of CITY_KEYWORDS) {
    const index = address.indexOf(city);
    if (index !== -1 && (best === undefined || index < best.index)) {
      best = { city, index };
    }
  }
  return best?.city ?? '';
};

export { extractCity };
