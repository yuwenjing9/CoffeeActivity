Page({
  data: {
    status: 'success',
    orderNo: '',
    amount: 0
  },

  onLoad(options) {
    this.setData({
      status: options.status || 'success',
      orderNo: options.orderNo || '202603180001',
      amount: options.amount || 32
    })
  },

  goToOrders() {
    wx.redirectTo({ url: '/pages/order/list' })
  },

  goToHome() {
    if (this.data.status === 'success') {
      wx.switchTab({ url: '/pages/index/index' })
    } else {
      wx.navigateBack()
    }
  }
})