Page({
  data: {
    currentTab: 'all',
    statusTabs: [
      { status: 'all', name: '全部', count: 0 },
      { status: 'pending_payment', name: '待支付', count: 0 },
      { status: 'making', name: '制作中', count: 0 },
      { status: 'ready', name: '待取餐', count: 0 },
      { status: 'completed', name: '已完成', count: 0 }
    ],
    orders: [],
    page: 1,
    hasMore: true,
    isLoading: false
  },

  onLoad() {
    this.loadOrders()
    this.loadOrderCounts()
    this.initCurrentTab()
  },

  onShow() {
    this.initCurrentTab()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, orders: [] })
    this.loadOrders()
    this.loadOrderCounts()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadMore()
    }
  },
  initCurrentTab() {
    const status = wx.getStorageSync('orderTab') || ''
    this.setData({
      currentTab: status
    })
    console.log(444,this.data.currentTab);
  },
  // 切换Tab
  switchTab(e) {
    const status = e.currentTarget.dataset.status
    this.setData({
      currentTab: status,
      page: 1,
      orders: []
    }, () => {
      this.loadOrders()
    })
  },

  // 加载订单
  loadOrders() {
    this.setData({ isLoading: true })
    
    // 模拟数据
    const mockOrders = [
      {
        id: 'ORD20260318001',
        orderNo: '202603180001',
        status: 'pending_payment',
        statusText: '待支付',
        items: [
          { name: '招牌拿铁', image: '/images/products/latte.png', specs: '热/标准糖/大杯', quantity: 1, price: 32 }
        ],
        totalCount: 1,
        totalAmount: 32,
        createTime: '2026-03-18 09:30'
      },
      {
        id: 'ORD20260317001',
        orderNo: '202603170001',
        status: 'making',
        statusText: '制作中',
        items: [
          { name: '冰美式', image: '/images/products/americano.png', specs: '冰/无糖/中杯', quantity: 2, price: 22 }
        ],
        totalCount: 2,
        totalAmount: 44,
        createTime: '2026-03-17 14:20'
      },
      {
        id: 'ORD20260316001',
        orderNo: '202603160001',
        status: 'completed',
        statusText: '已完成',
        items: [
          { name: '卡布奇诺', image: '/images/products/matcha.png', specs: '热/半糖/中杯', quantity: 1, price: 30 }
        ],
        totalCount: 1,
        totalAmount: 30,
        createTime: '2026-03-16 10:15'
      }
    ]

    const filteredOrders = this.data.currentTab === 'all' 
      ? mockOrders 
      : mockOrders.filter(o => o.status === this.data.currentTab)

    this.setData({
      orders: filteredOrders,
      isLoading: false
    })

    wx.stopPullDownRefresh()

    // 实际调用云函数
    // wx.cloud.callFunction({
    //   name: 'getOrders',
    //   data: { status: this.data.currentTab, page: this.data.page }
    // }).then(res => {
    //   this.setData({
    //     orders: res.result.list,
    //     isLoading: false
    //   })
    // })
  },

  // 加载更多
  loadMore() {
    this.setData({ page: this.data.page + 1 })
    this.loadOrders()
  },

  // 加载各状态订单数量
  loadOrderCounts() {
    const counts = { pending_payment: 1, making: 1, ready: 0, completed: 5 }
    const statusTabs = this.data.statusTabs.map(tab => ({
      ...tab,
      count: counts[tab.status] || 0
    }))
    this.setData({ statusTabs })
  },

  // 跳转详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order/detail?id=${id}`
    })
  },

  // 取消订单
  cancelOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确定取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          // 调用云函数取消订单
          wx.showToast({ title: '已取消', icon: 'success' })
          this.loadOrders()
        }
      }
    })
  },

  // 支付订单
  payOrder(e) {
    const id = e.currentTarget.dataset.id
    wx.showLoading({ title: '支付中...' })
    setTimeout(() => {
      wx.hideLoading()
      wx.showToast({ title: '支付成功', icon: 'success' })
      this.loadOrders()
    }, 1500)
  },

  // 确认取餐
  confirmPickup(e) {
    const id = e.currentTarget.dataset.id
    wx.showModal({
      title: '提示',
      content: '确认已取餐？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '已确认', icon: 'success' })
          this.loadOrders()
        }
      }
    })
  },

  // 再来一单
  buyAgain(e) {
    const items = e.currentTarget.dataset.items
    // 添加到购物车或直接跳转确认页
    wx.switchTab({ url: '/pages/cart/cart' })
  },

  // 去逛逛
  goShopping() {
    wx.navigateTo({ url: '/pages/product/list' })
  }
})
