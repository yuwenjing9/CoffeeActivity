Page({
  data: {
    favorites: [],
    isLoading: false
  },

  onLoad() {
    this.loadFavorites()
  },

  onShow() {
    this.loadFavorites()
  },

  // 加载收藏列表
  loadFavorites() {
    this.setData({ isLoading: true })

    // 从本地存储获取收藏列表
    const favorites = wx.getStorageSync('favorites') || []
    
    // 模拟数据（实际应从云端获取）
    const mockProducts = [
      { id: 1, name: '招牌拿铁', price: 28, image: '/images/products/latte.png', description: '浓郁咖啡香，丝滑奶泡' },
      { id: 2, name: '冰美式', price: 22, image: '/images/products/americano.png', description: '清爽提神，纯粹咖啡味' },
      { id: 3, name: '卡布奇诺', price: 30, image: '/images/products/cappuccino.png', description: '经典意式，奶泡绵密' }
    ]

    // 如果没有收藏数据，使用模拟数据
    const displayFavorites = favorites.length > 0 ? favorites : mockProducts

    this.setData({
      favorites: displayFavorites,
      isLoading: false
    })

    // 实际调用云函数
    // wx.cloud.callFunction({
    //   name: 'getFavorites'
    // }).then(res => {
    //   this.setData({
    //     favorites: res.result.list,
    //     isLoading: false
    //   })
    // })
  },

  // 跳转商品详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    })
  },

  // 加入购物车
  addToCart(e) {
    const item = e.currentTarget.dataset.item
    let cart = wx.getStorageSync('cart') || []

    const existingItem = cart.find(cartItem => cartItem.id === item.id)
    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({
        id: item.id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: 1,
        specs: '默认规格'
      })
    }

    wx.setStorageSync('cart', cart)

    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    })
  },

  // 取消收藏
  removeFavorite(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '提示',
      content: '确定取消收藏吗？',
      success: (res) => {
        if (res.confirm) {
          // 从列表中移除
          const favorites = this.data.favorites.filter(item => item.id !== id)
          this.setData({ favorites })

          // 更新本地存储
          wx.setStorageSync('favorites', favorites)

          // 实际调用云函数
          // wx.cloud.callFunction({
          //   name: 'removeFavorite',
          //   data: { productId: id }
          // })

          wx.showToast({
            title: '已取消收藏',
            icon: 'success'
          })
        }
      }
    })
  },

  // 去逛逛
  goShopping() {
    wx.navigateTo({
      url: '/pages/product/list'
    })
  }
})
