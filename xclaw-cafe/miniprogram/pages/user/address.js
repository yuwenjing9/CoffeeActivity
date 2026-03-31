Page({
  data: {
    addresses: [
      { id: 1, name: '张三', phone: '138****8888', province: '广东省', city: '深圳市', district: '南山区', detail: '科技园南区A栋888室', isDefault: true },
      { id: 2, name: '李四', phone: '139****9999', province: '广东省', city: '深圳市', district: '福田区', detail: '中心商务大厦1001室', isDefault: false }
    ],
    isSelect: false
  },

  onLoad(options) {
    if (options.select) {
      this.setData({ isSelect: true })
    }
    this.loadAddresses()
  },

  loadAddresses() {
    // 从云数据库获取地址列表
  },

  selectAddress(e) {
    if (!this.data.isSelect) return
    const item = e.currentTarget.dataset.item
    wx.setStorageSync('selectedAddress', item)
    wx.navigateBack()
  },

  addAddress() {
    wx.navigateTo({ url: '/pages/user/address-edit' })
  },

  editAddress(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/user/address-edit?id=${id}` })
  },

  deleteAddress(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定删除该地址吗？',
      success: (res) => {
        if (res.confirm) {
          const addresses = this.data.addresses.filter(item => item.id !== id)
          this.setData({ addresses })
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  }
})