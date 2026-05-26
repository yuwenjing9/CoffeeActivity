const app = getApp();
const storage = require('../../utils/storage.js');
const bleManager = require('../../utils/ble-manager.js');

Page({
  data: {
    devices: [],
    checking: false
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
    // 先从本地缓存加载，再后台刷新 BLE 状态
    this.loadDevices();
    this.refreshBLEStatus();
  },

  loadDevices() {
    const list = storage.getDevices() || [];
    this.setData({ devices: list });
  },

  refreshBLEStatus() {
    if (this.data.checking) return;
    const devices = storage.getDevices() || [];
    if (devices.length === 0) return;

    // 只对有 bleDeviceId 的设备做 BLE 检查
    const bleDevices = devices.filter(d => d.bleDeviceId);
    if (bleDevices.length === 0) return;

    this.setData({ checking: true });
    bleManager.checkAllDevices().then((updatedList) => {
      this.setData({ devices: updatedList, checking: false });
    }).catch(() => {
      this.setData({ checking: false });
    });
  },

  onPullDownRefresh() {
    this.loadDevices();
    const devices = storage.getDevices() || [];
    const hasBleDevices = devices.some(d => d.bleDeviceId);
    if (hasBleDevices) {
      bleManager.checkAllDevices().then((updatedList) => {
        this.setData({ devices: updatedList });
        wx.stopPullDownRefresh();
      }).catch(() => {
        wx.stopPullDownRefresh();
      });
    } else {
      setTimeout(() => wx.stopPullDownRefresh(), 600);
    }
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
