// app.js
const storage = require('./utils/storage.js');

App({
  globalData: {
    statusBarHeight: 20,
    systemInfo: null,
    userInfo: null,
    hasAgreedProtocol: false
  },

  onLaunch() {
    // 系统信息
    try {
      const sys = wx.getSystemInfoSync();
      this.globalData.systemInfo = sys;
      this.globalData.statusBarHeight = sys.statusBarHeight || 20;
    } catch (e) {}

    // 协议状态
    this.globalData.hasAgreedProtocol = storage.getProtocolAgreed();

    // 用户信息
    this.globalData.userInfo = storage.getUserInfo();
  },

  isLogin() {
    const u = this.globalData.userInfo;
    return !!(u && (u.openid || u.openId));
  }
});
