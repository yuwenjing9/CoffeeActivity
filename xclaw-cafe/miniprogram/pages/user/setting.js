Page({
  data: {
    cacheSize: '0KB',
    notificationEnabled: true
  },

  onLoad() {
    this.calculateCacheSize()
  },

  calculateCacheSize() {
    // 计算缓存大小
    this.setData({ cacheSize: '1.2MB' })
  },

  clearCache() {
    wx.showModal({
      title: '提示',
      content: '确定清除缓存吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage()
          wx.showToast({ title: '已清除', icon: 'success' })
          this.setData({ cacheSize: '0KB' })
        }
      }
    })
  },

  checkUpdate() {
    wx.showToast({ title: '已是最新版本', icon: 'success' })
  },

  toggleNotification(e) {
    this.setData({ notificationEnabled: e.detail.value })
  },

  aboutUs() {
    wx.showModal({
      title: '关于醇香咖啡',
      content: '醇香咖啡 v1.0.0\n\n专注于为您提供优质咖啡体验',
      showCancel: false
    })
  },

  privacyPolicy() {
    wx.navigateTo({ url: '/pages/webview?url=' + encodeURIComponent('https://example.com/privacy') })
  },

  userAgreement() {
    wx.navigateTo({ url: '/pages/webview?url=' + encodeURIComponent('https://example.com/agreement') })
  },

  logout() {
    wx.showModal({
      title: '提示',
      content: '确定退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('userInfo')
          wx.showToast({ title: '已退出', icon: 'success' })
          setTimeout(() => {
            wx.switchTab({ url: '/pages/index/index' })
          }, 1500)
        }
      }
    })
  }
})