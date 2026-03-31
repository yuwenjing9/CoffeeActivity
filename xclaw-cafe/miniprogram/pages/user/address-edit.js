Page({
  data: {
    isEdit: false,
    addressId: null,
    address: {
      name: '',
      phone: '',
      region: '',
      detail: '',
      isDefault: false
    }
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ isEdit: true, addressId: options.id })
      this.loadAddress(options.id)
    }
  },

  loadAddress(id) {
    // 加载地址详情
    const mockAddress = { id: 1, name: '张三', phone: '13888888888', region: '广东省深圳市南山区', detail: '科技园南区A栋888室', isDefault: true }
    this.setData({ address: mockAddress })
  },

  onNameInput(e) {
    this.setData({ 'address.name': e.detail.value })
  },

  onPhoneInput(e) {
    this.setData({ 'address.phone': e.detail.value })
  },

  onDetailInput(e) {
    this.setData({ 'address.detail': e.detail.value })
  },

  selectRegion() {
    wx.showActionSheet({
      itemList: ['广东省深圳市南山区', '广东省深圳市福田区', '广东省深圳市罗湖区'],
      success: (res) => {
        const regions = ['广东省深圳市南山区', '广东省深圳市福田区', '广东省深圳市罗湖区']
        this.setData({ 'address.region': regions[res.tapIndex] })
      }
    })
  },

  toggleDefault(e) {
    this.setData({ 'address.isDefault': e.detail.value })
  },

  saveAddress() {
    const { name, phone, region, detail } = this.data.address
    if (!name || !phone || !region || !detail) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '手机号格式错误', icon: 'none' })
      return
    }
    
    wx.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => {
      wx.navigateBack()
    }, 1500)
  },

  deleteAddress() {
    wx.showModal({
      title: '提示',
      content: '确定删除该地址吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    })
  }
})