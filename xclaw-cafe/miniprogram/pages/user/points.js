Page({
  data: {
    currentTab: 'all',
    userInfo: { points: 1280 },
    records: [
      { id: 1, reason: '订单消费获得', points: 50, type: 'income', time: '2026-03-18 10:30' },
      { id: 2, reason: '兑换优惠券', points: 100, type: 'expense', time: '2026-03-17 15:20' },
      { id: 3, reason: '每日签到', points: 10, type: 'income', time: '2026-03-17 09:00' }
    ]
  },

  onLoad() {
    this.loadRecords()
  },

  loadRecords() {
    // 从云数据库获取积分记录
  },

  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
    this.loadRecords()
  }
})