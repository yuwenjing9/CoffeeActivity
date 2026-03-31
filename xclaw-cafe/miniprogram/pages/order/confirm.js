Page({
  data: {
    deliveryType: 'self',
    address: null,
    selectedTime: '',
    orderItems: [],
    goodsAmount: 0,
    deliveryFee: 0,
    selectedCoupon: null,
    remark: '',
    totalAmount: 0,
    availableCoupons: [
      { id: 1, name: '满30减5', value: 5, minAmount: 30 },
      { id: 2, name: '满50减10', value: 10, minAmount: 50 }
    ]
  },

  onLoad() {
    this.loadOrderData()
    this.setDefaultAddress()
    this.calculateTotal()
  },

  // 加载订单数据
  loadOrderData() {
    const data = wx.getStorageSync('orderConfirmData') || { items: [], totalAmount: 0 }
    this.setData({
      orderItems: data.items,
      goodsAmount: data.totalAmount
    })
  },

  // 设置默认地址
  setDefaultAddress() {
    // 从本地存储或云数据库获取默认地址
    const defaultAddress = wx.getStorageSync('defaultAddress')
    if (defaultAddress) {
      this.setData({ address: defaultAddress })
    }
  },

  // 切换配送方式
  switchDelivery(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ deliveryType: type }, () => {
      this.calculateTotal()
    })
  },

  // 选择地址
  selectAddress() {
    if (this.data.deliveryType === 'self') {
      // 选择门店
      wx.navigateTo({
        url: '/pages/store/select'
      })
    } else {
      // 选择配送地址
      wx.navigateTo({
        url: '/pages/user/address?select=true'
      })
    }
  },

  // 选择取餐时间
  selectTime() {
    const times = ['立即取餐', '10分钟后', '20分钟后', '30分钟后']
    wx.showActionSheet({
      itemList: times,
      success: (res) => {
        this.setData({ selectedTime: times[res.tapIndex] })
      }
    })
  },

  // 选择优惠券
  selectCoupon() {
    const coupons = this.data.availableCoupons.map(c => `${c.name} (满${c.minAmount}可用)`)
    wx.showActionSheet({
      itemList: [...coupons, '不使用优惠券'],
      success: (res) => {
        if (res.tapIndex < coupons.length) {
          const coupon = this.data.availableCoupons[res.tapIndex]
          if (this.data.goodsAmount >= coupon.minAmount) {
            this.setData({ selectedCoupon: coupon }, () => {
              this.calculateTotal()
            })
          } else {
            wx.showToast({ title: '不满足使用条件', icon: 'none' })
          }
        } else {
          this.setData({ selectedCoupon: null }, () => {
            this.calculateTotal()
          })
        }
      }
    })
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // 计算总价
  calculateTotal() {
    const { goodsAmount, deliveryFee, selectedCoupon } = this.data
    let total = goodsAmount + (this.data.deliveryType === 'delivery' ? deliveryFee : 0)
    if (selectedCoupon) {
      total -= selectedCoupon.value
    }
    this.setData({ totalAmount: Math.max(0, total) })
  },

  // 提交订单
  submitOrder() {
    if (!this.data.address) {
      wx.showToast({ title: '请选择地址', icon: 'none' })
      return
    }

    wx.showLoading({ title: '提交中...' })

    // 构建订单数据
    const orderData = {
      items: this.data.orderItems,
      deliveryType: this.data.deliveryType,
      address: this.data.address,
      pickupTime: this.data.selectedTime,
      goodsAmount: this.data.goodsAmount,
      deliveryFee: this.data.deliveryType === 'delivery' ? this.data.deliveryFee : 0,
      coupon: this.data.selectedCoupon,
      remark: this.data.remark,
      totalAmount: this.data.totalAmount,
      createTime: new Date().toISOString()
    }

    // 调用云函数创建订单
    wx.cloud.callFunction({
      name: 'createOrder',
      data: orderData
    }).then(res => {
      wx.hideLoading()
      const { orderId, payment } = res.result

      // 调起支付
      wx.requestPayment({
        ...payment,
        success: () => {
          // 支付成功
          wx.redirectTo({
            url: `/pages/order/pay-result?orderId=${orderId}&status=success`
          })
        },
        fail: () => {
          // 支付失败
          wx.redirectTo({
            url: `/pages/order/detail?id=${orderId}`
          })
        }
      })
    }).catch(err => {
      wx.hideLoading()
      wx.showToast({ title: '下单失败', icon: 'none' })
      console.error(err)
    })
  }
})
