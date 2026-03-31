Page({
  data: {
    order: {},
    steps: ['待支付', '制作中', '待取餐', '已完成'],
    currentStep: 0,
    progressPercent: 0,
    statusIcon: '⏳',
    statusDesc: ''
  },

  onLoad(options) {
    const id = options.id
    this.loadOrderDetail(id)
  },

  // 加载订单详情
  loadOrderDetail(id) {
    // 模拟数据
    const mockOrder = {
      id: id,
      orderNo: '202603180001',
      status: 'making',
      statusText: '制作中',
      pickupCode: 'A888',
      deliveryType: 'self',
      address: { name: '醇香咖啡（科技园店）', phone: '0755-88888888' },
      pickupTime: '预计 10:30 可取',
      items: [
        { name: '招牌拿铁', image: '/images/products/latte.png', specs: '热/标准糖/大杯', quantity: 1, price: 32 }
      ],
      totalCount: 1,
      goodsAmount: 32,
      deliveryFee: 0,
      coupon: null,
      totalAmount: 32,
      createTime: '2026-03-18 09:30',
      payMethod: '微信支付',
      remark: '少放糖'
    }

    this.setData({ order: mockOrder }, () => {
      this.updateProgress()
    })

    // 实际调用云函数
    // wx.cloud.callFunction({
    //   name: 'getOrderDetail',
    //   data: { id }
    // }).then(res => {
    //   this.setData({ order: res.result }, () => {
    //     this.updateProgress()
    //   })
    // })
  },

  // 更新进度
  updateProgress() {
    const statusMap = {
      'pending_payment': { step: 0, icon: '⏳', desc: '请在30分钟内完成支付' },
      'making': { step: 1, icon: '☕', desc: '咖啡师正在用心制作中' },
      'ready': { step: 2, icon: '📦', desc: '您的订单已制作完成，请尽快取餐' },
      'completed': { step: 3, icon: '✅', desc: '订单已完成，期待您的再次光临' },
      'cancelled': { step: -1, icon: '❌', desc: '订单已取消' }
    }

    const status = statusMap[this.data.order.status]
    if (status) {
      const percent = this.data.order.status === 'cancelled' ? 0 : (status.step / 3) * 100
      this.setData({
        currentStep: status.step,
        progressPercent: percent,
        statusIcon: status.icon,
        statusDesc: status.desc
      })
    }
  },

  // 复制订单号
  copyOrderNo() {
    wx.setClipboardData({
      data: this.data.order.orderNo,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  // 取消订单
  cancelOrder() {
    wx.showModal({
      title: '提示',
      content: '确定取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用云函数
          wx.showToast({ title: '已取消', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    })
  },

  // 删除订单
  deleteOrder() {
    wx.showModal({
      title: '提示',
      content: '确定删除该订单吗？删除后不可恢复',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    })
  },

  // 支付订单
  payOrder() {
    wx.showLoading({ title: '支付中...' })
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '支付成功', icon: 'success' })
      this.loadOrderDetail(this.data.order.id)
    }, 1500)
  },

  // 确认取餐
  confirmPickup() {
    wx.showModal({
      title: '提示',
      content: '确认已取餐？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已确认', icon: 'success' })
          this.loadOrderDetail(this.data.order.id)
        }
      }
    })
  },

  // 再来一单
  buyAgain() {
    wx.setStorageSync('orderConfirmData', {
      items: this.data.order.items,
      totalAmount: this.data.order.goodsAmount,
      from: 'buyAgain'
    })
    wx.navigateTo({
      url: '/pages/order/confirm'
    })
  },

  // 联系客服
  contactService() {
    // 打开客服会话或拨打电话
    wx.makePhoneCall({
      phoneNumber: '0755-88888888'
    })
  }
})
