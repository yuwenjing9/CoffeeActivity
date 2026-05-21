const app = getApp();
const storage = require('../../utils/storage.js');

Page({
  data: {
    devices: []
  },

  onShow() {
    // 同步自定义 tabBar 选中态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0 });
    }
    // 登录守卫
    if (!app.isLogin()) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    this.loadDevices();
  },

  loadDevices() {
    const list = storage.getDevices() || [];
    this.setData({ devices: list });
  },

  onPullDownRefresh() {
    this.loadDevices();
    setTimeout(() => wx.stopPullDownRefresh(), 600);
  },

  onAdd() {
    wx.navigateTo({ url: '/pages/add-device/add-device' });
  },

  onCardTap(e) {
    const device = e.detail.device;
    wx.navigateTo({
      url: `/pages/device-detail/device-detail?id=${device.id}`
    });
  }
});
