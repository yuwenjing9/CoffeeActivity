const app = getApp()

Page({
  data: {
    userInfo: {},
    stats: {
      orderCount: 12,
      couponCount: 3,
      favoriteCount: 5,
      pendingCount: 1,
      makingCount: 1,
      readyCount: 0,
      successCount: 5
    }
  },

  onLoad() {
    this.loadUserInfo()
    this.loadStats()
  },

  onShow() {
    this.loadUserInfo()
    this.loadStats()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo') || {}
    this.setData({ userInfo })

    // 如果未登录，尝试获取
    if (!userInfo.nickName) {
      this.checkLogin()
    }
  },

  // 检查登录
  checkLogin() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: (res) => {
        const userInfo = res.userInfo
        wx.setStorageSync('userInfo', userInfo)
        this.setData({ userInfo })
      },
      fail: () => {
        // 用户拒绝授权
      }
    })
  },

  // 编辑资料
  editProfile() {
    if (!this.data.userInfo.nickName) {
      this.checkLogin()
    } else {
      wx.navigateTo({
        url: '/pages/user/setting'
      })
    }
  },

  // 加载统计数据
  loadStats() {
    // 从云数据库获取统计数据
    // wx.cloud.callFunction({
    //   name: 'getUserStats'
    // }).then(res => {
    //   this.setData({ stats: res.result })
    // })
  },

  // 跳转到订单
  goToOrders(e) {
    const status = e.currentTarget.dataset.status
    wx.setStorageSync('orderTab', status)
    wx.switchTab({
      url: `/pages/order/list`
    })
  },

  // 跳转到优惠券
  goToCoupon() {
    wx.navigateTo({
      url: '/pages/user/coupon'
    })
  },

  // 跳转到收藏
  goToFavorite() {
    wx.navigateTo({
      url: '/pages/user/favorite'
    })
  },

  // 跳转到积分
  goToPoints() {
    wx.navigateTo({
      url: '/pages/user/points'
    })
  },

  // 跳转到地址
  goToAddress() {
    wx.navigateTo({
      url: '/pages/user/address'
    })
  },

  // 联系客服
  contactService() {
    wx.makePhoneCall({
      phoneNumber: '0755-88888888'
    })
  },

  // 跳转到设置
  goToSetting() {
    wx.navigateTo({
      url: '/pages/user/setting'
    })
  },

  // 关于我们
  aboutUs() {
    wx.showModal({
      title: '关于醇香咖啡',
      content: '醇香咖啡 v1.0.0\n专注于为您提供优质咖啡体验',
      showCancel: false
    })
  }
})
