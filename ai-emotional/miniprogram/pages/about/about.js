const app = getApp();

Page({
  data: {
    version: '1.0.0',
    sdkVersion: ''
  },

  onLoad() {
    const sys = app.globalData.systemInfo || wx.getSystemInfoSync();
    this.setData({ sdkVersion: sys.SDKVersion });
  },

  goLink(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({ url: `/pages/webview/webview?type=${type}` });
  },

  onCheckUpdate() {
    wx.showLoading({ title: '检查中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '已是最新版本', icon: 'success' });
    }, 1200);
  }
});
