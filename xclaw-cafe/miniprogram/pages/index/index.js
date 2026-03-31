// index.js
const app = getApp()

Page({
  data: {
    // Banner数据
    banners: [
      { id: 1, image: '/images/15.png' },
      { id: 2, image: '/images/20.png' }
    ],
    
    // 分类数据
    categories: [
      { id: 1, name: '美式咖啡', emoji: '☕' },
      { id: 2, name: '拿铁系列', emoji: '🥛' },
      { id: 3, name: '卡布奇诺', emoji: '☕' },
      { id: 4, name: '冰咖啡', emoji: '🧊' }
    ],
    
    // 推荐商品数据
    products: [
      {
        id: 1,
        name: '经典拿铁',
        price: 28,
        rating: 4.8,
        image: '/images/16.png',
        tag: '热销',
        tagClass: 'tag-hot',
        starIcon: '7.svg'
      },
      {
        id: 2,
        name: '意式浓缩',
        price: 18,
        rating: 4.9,
        image: '/images/17.png',
        tag: '推荐',
        tagClass: 'tag-recommend',
        starIcon: '8.svg'
      },
      {
        id: 3,
        name: '卡布奇诺',
        price: 26,
        rating: 4.7,
        image: '/images/18.png',
        tag: '新品',
        tagClass: 'tag-new',
        starIcon: '9.svg'
      },
      {
        id: 4,
        name: '冰美式',
        price: 22,
        rating: 4.6,
        image: '/images/19.png',
        tag: '热销',
        tagClass: 'tag-hot',
        starIcon: '10.svg'
      }
    ]
  },

  onLoad() {
    // 页面加载
  },

  onShow() {
    // 页面显示
  },

  // 分类点击
  onCategoryTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/list?categoryId=${id}`
    })
  },

  // 限时优惠点击
  onPromotionTap() {
    wx.navigateTo({
      url: '/pages/user/coupon'
    })
  },

  // 商品点击
  onProductTap(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    })
  },

  // 更多点击
  onMoreTap() {
    wx.navigateTo({
      url: '/pages/product/list'
    })
  },

  // TabBar点击
  onTabTap(e) {
    const index = e.currentTarget.dataset.index
    const urls = [
      '/pages/index/index',
      '/pages/cart/cart',
      '/pages/order/list',
      '/pages/user/center'
    ]
    
    if (index === 0) {
      // 当前页面，不做处理
      return
    }
    
    wx.switchTab({
      url: urls[index]
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  }
})
