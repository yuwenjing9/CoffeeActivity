const app = getApp()

Page({
  data: {
    product: {
      id: 1,
      name: '经典拿铁',
      description: '精选阿拉比卡咖啡豆，搭配丝滑牛奶，呈现经典意式风味。拿铁咖啡是意式浓缩咖啡与牛奶的经典混合，奶泡绵密细腻，口感丝滑醇厚，咖啡香与奶香完美融合，适合喜欢奶香浓郁的咖啡爱好者。',
      price: 28,
      originalPrice: 35,
      sales: 1234,
      rating: 4.8,
      image: '/images/products/latte.png',
      stock: 999
    },
    selectedTemp: 'hot',
    selectedSize: 'small',
    selectedSugar: 'none',
    quantity: 1,
    cartCount: 0
  },

  onLoad(options) {
    const id = options.id || 1
    this.loadProductDetail(id)
    this.getCartCount()
  },

  onShow() {
    this.getCartCount()
  },

  // 加载商品详情
  loadProductDetail(id) {
    // 模拟数据 - 实际项目从云端获取
    const mockProducts = {
      1: {
        id: 1,
        name: '经典拿铁',
        description: '精选阿拉比卡咖啡豆，搭配丝滑牛奶，呈现经典意式风味。拿铁咖啡是意式浓缩咖啡与牛奶的经典混合，奶泡绵密细腻，口感丝滑醇厚，咖啡香与奶香完美融合，适合喜欢奶香浓郁的咖啡爱好者。',
        price: 28,
        originalPrice: 35,
        sales: 1234,
        rating: 4.8,
        image: '/images/products/latte.png'
      },
      2: {
        id: 2,
        name: '意式浓缩',
        description: '浓郁醇厚的意式浓缩，回味悠长。采用高压萃取技术，充分提取咖啡豆的精华，口感浓郁强烈，是品味纯正咖啡的首选。适合喜欢纯正咖啡味道的资深咖啡爱好者。',
        price: 18,
        originalPrice: 22,
        sales: 3200,
        rating: 4.9,
        image: '/images/products/espresso.png'
      },
      3: {
        id: 3,
        name: '卡布奇诺',
        description: '经典意式，奶泡绵密，口感丰富。卡布奇诺以其完美的奶泡著称，奶泡厚度适中，口感绵密细腻，咖啡、牛奶与奶泡的比例恰到好处，每一口都是完美的味觉体验。',
        price: 30,
        originalPrice: 36,
        sales: 3600,
        rating: 4.7,
        image: '/images/products/cappuccino.png'
      },
      4: {
        id: 4,
        name: '冰美式',
        description: '清爽提神，纯粹咖啡味。冰美式是将浓缩咖啡与冰水混合，保留了咖啡的纯正风味，口感清爽不苦涩，是夏日提神醒脑的最佳选择。适合喜欢清淡口感但又不想失去咖啡香味的朋友。',
        price: 22,
        originalPrice: 28,
        sales: 4800,
        rating: 4.6,
        image: '/images/products/americano.png'
      },
      5: {
        id: 5,
        name: '抹茶拿铁',
        description: '清爽提神，纯粹咖啡味。冰美式是将浓缩咖啡与冰水混合，保留了咖啡的纯正风味，口感清爽不苦涩，是夏日提神醒脑的最佳选择。适合喜欢清淡口感但又不想失去咖啡香味的朋友。',
        price: 30,
        originalPrice: 35,
        sales: 2900,
        rating: 4.8,
        image: '/images/products/matcha.png'
      },
      6: {
        id: 6,
        name: '摩卡咖啡',
        description: '清爽提神，纯粹咖啡味。冰美式是将浓缩咖啡与冰水混合，保留了咖啡的纯正风味，口感清爽不苦涩，是夏日提神醒脑的最佳选择。适合喜欢清淡口感但又不想失去咖啡香味的朋友。',
        price: 19,
        originalPrice: 18,
        sales: 1400,
        rating: 4.3,
        image: '/images/products/mocha.png'
      }
    }

    if (mockProducts[id]) {
      this.setData({ product: mockProducts[id] })
    }

    // 实际调用云函数
    // wx.cloud.callFunction({
    //   name: 'getProductDetail',
    //   data: { id }
    // }).then(res => {
    //   this.setData({ product: res.result })
    // })
  },

  // 获取购物车数量
  getCartCount() {
    const cart = wx.getStorageSync('cart') || []
    const count = cart.reduce((sum, item) => sum + item.quantity, 0)
    this.setData({ cartCount: count })
  },

  // 返回
  goBack() {
    wx.navigateBack()
  },

  // 跳转购物车
  goToCart() {
    wx.switchTab({
      url: '/pages/cart/cart'
    })
  },

  // 选择温度
  selectTemp(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ selectedTemp: value })
  },

  // 选择杯型
  selectSize(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ selectedSize: value })
    
    // 根据杯型调整价格
    const priceMap = {
      'small': 0,
      'medium': 3,
      'large': 6
    }
    
    const currentProduct = this.data.product
    const basePrice = currentProduct.id === 1 ? 28 : 
                      currentProduct.id === 2 ? 18 :
                      currentProduct.id === 3 ? 30 : 22
    
    this.setData({
      'product.price': basePrice + priceMap[value]
    })
  },

  // 选择糖度
  selectSugar(e) {
    const value = e.currentTarget.dataset.value
    this.setData({ selectedSugar: value })
  },

  // 减少数量
  decreaseQuantity() {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      })
    }
  },

  // 增加数量
  increaseQuantity() {
    this.setData({
      quantity: this.data.quantity + 1
    })
  },

  // 加入购物车
  addToCart() {
    const { product, selectedTemp, selectedSize, selectedSugar, quantity } = this.data
    
    // 获取购物车
    let cart = wx.getStorageSync('cart') || []
    
    // 构建购物车项
    const cartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      temp: selectedTemp,
      size: selectedSize,
      sugar: selectedSugar,
      quantity: quantity,
      selected: true
    }
    
    // 检查是否已存在相同商品（相同规格）
    const existIndex = cart.findIndex(item => 
      item.id === cartItem.id && 
      item.temp === cartItem.temp && 
      item.size === cartItem.size && 
      item.sugar === cartItem.sugar
    )
    
    if (existIndex > -1) {
      // 更新数量
      cart[existIndex].quantity += quantity
    } else {
      // 添加新商品
      cart.push(cartItem)
    }
    
    // 保存购物车
    wx.setStorageSync('cart', cart)
    
    // 更新购物车数量
    this.getCartCount()
    
    // 提示
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    })
  },

  // 立即购买
  buyNow() {
    const { product, selectedTemp, selectedSize, selectedSugar, quantity } = this.data
    
    // 构建订单项
    const orderItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      temp: selectedTemp,
      size: selectedSize,
      sugar: selectedSugar,
      quantity: quantity,
      selected: true
    }
    
    // 临时存储订单商品
    wx.setStorageSync('orderItems', [orderItem])
    
    // 跳转到确认订单页
    wx.navigateTo({
      url: '/pages/order/confirm'
    })
  }
})
