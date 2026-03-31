Page({
  data: {
    currentTab: 'available',
    coupons: [
      { id: 1, name: '满30减5优惠券', value: 5, minAmount: 30, expireTime: '2026-04-30', scope: '全场通用' },
      { id: 2, name: '满50减10优惠券', value: 10, minAmount: 50, expireTime: '2026-04-15', scope: '仅限咖啡类' }
    ]
  },

  onLoad() {
    this.loadCoupons()
  },

  loadCoupons() {
    // 从云数据库获取优惠券
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.loadCoupons()
  },

  useCoupon(e) {
    wx.navigateTo({ url: '/pages/product/list' })
  }
})