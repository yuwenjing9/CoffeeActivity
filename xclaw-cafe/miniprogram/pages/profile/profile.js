const app = getApp();
const storage = require('../../utils/storage.js');

Page({
  data: {
    user: null,
    deviceCount: 0,
    version: '1.0.0'
  },

  onShow() {
    // 同步自定义 tabBar 选中态
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1 });
    }
    if (!app.isLogin()) {
      wx.reLaunch({ url: '/pages/login/login' });
      return;
    }
    const list = storage.getDevices() || [];
    this.setData({
      user: app.globalData.userInfo,
      deviceCount: list.length
    });
  },

  goPage(e) {
    const url = e.currentTarget.dataset.url;
    if (!url) return;
    if (url.startsWith('tab:')) {
      wx.switchTab({ url: url.replace('tab:', '') });
    } else {
      wx.navigateTo({ url });
    }
  },

  // 点击头像 → 唤起微信头像选择 → 写回用户信息
  onChooseAvatar(e) {
    const avatarUrl = e.detail && e.detail.avatarUrl;
    if (!avatarUrl) return;

    const user = Object.assign({}, app.globalData.userInfo || {}, { avatarUrl });
    storage.setUserInfo(user);
    app.globalData.userInfo = user;
    this.setData({ user });
    wx.showToast({ title: '头像已更新', icon: 'success' });
  },

  onCall() {
    wx.makePhoneCall({ phoneNumber: '4001234567', fail: () => {} });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出当前账号？',
      success: (res) => {
        if (res.confirm) {
          storage.clearUserInfo();
          app.globalData.userInfo = null;
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  }
});
