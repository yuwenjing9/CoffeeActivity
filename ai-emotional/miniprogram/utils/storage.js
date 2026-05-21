const KEYS = {
  USER: 'ec_user_info',
  PROTOCOL: 'ec_protocol_agreed',
  DEVICES: 'ec_devices'
};

const MOCK_DEVICES = [{
    id: 'd1',
    nickname: '小灵',
    sn: 'LB23061847A1F3',
    model: 'LingTu-Mini Pro',
    fw: 'v2.4.1',
    fwNew: true,
    fwNew: '2.4.3',
    status: 'online',
    battery: 78,
    wifi: 'XCloud-Home-2.4G',
    wifiRssi: 4,
    temp: 23,
    activeDate: '2024-06-18',
    avatar: '🐰'
  },
  {
    id: 'd2',
    nickname: '客厅小宝',
    sn: 'LB23061848C42B',
    model: 'LingTu-Mini',
    fw: 'v2.4.1',
    fwNew: true,
    status: 'online',
    battery: 92,
    wifi: 'Living-2.4G',
    wifiRssi: 3,
    temp: 24,
    activeDate: '2024-05-02',
    avatar: '🐰'
  },
  {
    id: 'd3',
    nickname: '书房灵灵',
    sn: 'LB23061849D72E',
    model: 'LingTu-Mini',
    fw: 'v2.3.5',
    fwNew: true,
    fwNew: '2.4.3',
    status: 'offline',
    battery: 0,
    wifi: '-',
    wifiRssi: 0,
    temp: 0,
    activeDate: '2024-04-12',
    avatar: '🐰'
  }
];

module.exports = {
  KEYS,

  getUserInfo() {
    return wx.getStorageSync(KEYS.USER) || null;
  },
  setUserInfo(info) {
    wx.setStorageSync(KEYS.USER, info);
  },
  clearUserInfo() {
    wx.removeStorageSync(KEYS.USER);
  },

  getProtocolAgreed() {
    return !!wx.getStorageSync(KEYS.PROTOCOL);
  },
  setProtocolAgreed(v) {
    wx.setStorageSync(KEYS.PROTOCOL, v ? 1 : 0);
  },

  getDevices() {
    return wx.getStorageSync(KEYS.DEVICES) || null;
  },
  setDevices(list) {
    wx.setStorageSync(KEYS.DEVICES, list || []);
  },
  initMockDevices() {
    wx.setStorageSync(KEYS.DEVICES, JSON.parse(JSON.stringify(MOCK_DEVICES)));
  },
  getDeviceById(id) {
    const list = this.getDevices() || [];
    return list.find(d => d.id === id);
  },
  updateDevice(id, patch) {
    const list = this.getDevices() || [];
    const idx = list.findIndex(d => d.id === id);
    if (idx >= 0) {
      list[idx] = Object.assign({}, list[idx], patch);
      this.setDevices(list);
      return list[idx];
    }
    return null;
  },
  addDevice(device) {
    const list = this.getDevices() || [];
    list.unshift(device);
    this.setDevices(list);
  },
  removeDevice(id) {
    const list = this.getDevices() || [];
    const next = list.filter(d => d.id !== id);
    this.setDevices(next);
  }
};