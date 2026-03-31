Page({
  data: {
    categories: [
      { id: 'all', name: '全部' },
      { id: 1, name: '咖啡' },
      { id: 2, name: '茶饮' },
      { id: 3, name: '轻食' },
      { id: 4, name: '套餐' }
    ],
    currentCategory: 'all',
    sortType: 'default',
    priceAsc: true,
    products: [],
    allProducts: [], // 存储所有商品用于搜索
    searchKeyword: '', // 搜索关键词
    cartCount: 0,
    page: 1,
    hasMore: true,
    isLoading: false
  },

  // 防抖定时器
  searchTimer: null,

  onLoad(options) {
    // 如果有分类ID参数，设置当前分类
    if (options.categoryId) {
      this.setData({
        currentCategory: parseInt(options.categoryId)
      })
    }
    this.loadProducts()
    this.getCartCount()
  },

  onShow() {
    this.getCartCount()
  },

  onPullDownRefresh() {
    this.setData({ page: 1, products: [] })
    this.loadProducts()
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.isLoading) {
      this.loadMore()
    }
  },

  // 加载商品
  loadProducts() {
    this.setData({ isLoading: true })

    // 模拟数据 - 实际项目中应该从云端获取
    const mockProducts = [
      { id: 1, name: '招牌拿铁', price: 28, sales: 5200, image: '/images/products/latte.png', tags: ['热销'], categoryId: 1, description: '浓郁咖啡香，丝滑奶泡' },
      { id: 2, name: '冰美式', price: 22, sales: 4800, image: '/images/products/americano.png', tags: [], categoryId: 1, description: '清爽提神，纯粹咖啡味' },
      { id: 3, name: '卡布奇诺', price: 30, sales: 3600, image: '/images/products/cappuccino.png', tags: ['推荐'], categoryId: 1, description: '经典意式，奶泡绵密' },
      { id: 4, name: '焦糖玛奇朵', price: 32, sales: 2900, image: '/images/products/latte.png', tags: [], categoryId: 1, description: '焦糖香甜，层次丰富' },
      { id: 5, name: '意式浓缩', price: 18, sales: 3200, image: '/images/products/espresso.png', tags: ['新品'], categoryId: 1, description: '浓郁醇厚，回味悠长' },
      { id: 6, name: '红茶拿铁', price: 26, sales: 2800, image: '/images/products/latte.png', tags: [], categoryId: 2, description: '红茶香浓，奶香四溢' },
      { id: 7, name: '抹茶拿铁', price: 28, sales: 3500, image: '/images/products/latte.png', tags: ['推荐'], categoryId: 2, description: '日式抹茶，清新怡人' },
      { id: 8, name: '香草拿铁', price: 30, sales: 2400, image: '/images/products/latte.png', tags: [], categoryId: 1, description: '香草甜美，口感丝滑' },
      { id: 9, name: '摩卡咖啡', price: 32, sales: 2600, image: '/images/products/cappuccino.png', tags: [], categoryId: 1, description: '巧克力与咖啡的完美融合' },
      { id: 10, name: '燕麦拿铁', price: 30, sales: 3100, image: '/images/products/latte.png', tags: ['新品'], categoryId: 1, description: '燕麦奶香，健康美味' }
    ]

    // 存储所有商品
    this.setData({ allProducts: mockProducts })

    // 根据分类筛选
    let filtered = this.data.currentCategory === 'all'
      ? mockProducts
      : mockProducts.filter(p => p.categoryId === this.data.currentCategory)

    this.setData({
      products: filtered,
      isLoading: false,
      hasMore: false // 模拟数据一次性加载完
    })

    wx.stopPullDownRefresh()

    // 实际调用云函数
    // wx.cloud.callFunction({
    //   name: 'getProducts',
    //   data: { categoryId: this.data.currentCategory, page: this.data.page }
    // }).then(res => {
    //   this.setData({
    //     products: res.result.list,
    //     allProducts: res.result.list,
    //     isLoading: false
    //   })
    // })
  },

  // 加载更多
  loadMore() {
    this.setData({ page: this.data.page + 1 })
    this.loadProducts()
  },

  // 切换分类
  switchCategory(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      currentCategory: id,
      page: 1,
      products: []
    }, () => {
      this.loadProducts()
    })
  },

  // 改变排序
  changeSort(e) {
    const type = e.currentTarget.dataset.type
    if (type === 'price' && this.data.sortType === 'price') {
      this.setData({ priceAsc: !this.data.priceAsc }, () => {
        this.sortProducts()
      })
    } else {
      this.setData({ sortType: type }, () => {
        this.sortProducts()
      })
    }
  },

  // 排序商品
  sortProducts() {
    const { products, sortType, priceAsc } = this.data
    let sorted = [...products]

    if (sortType === 'sales') {
      sorted.sort((a, b) => b.sales - a.sales)
    } else if (sortType === 'price') {
      sorted.sort((a, b) => priceAsc ? a.price - b.price : b.price - a.price)
    }

    this.setData({ products: sorted })
  },

  // 搜索输入 - 实时搜索（防抖）
  onSearchInput(e) {
    const keyword = e.detail.value.trim()
    
    // 更新搜索关键词
    this.setData({ searchKeyword: keyword })

    // 清除之前的定时器
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }

    // 如果关键词为空，显示所有商品
    if (!keyword) {
      this.filterProducts()
      return
    }

    // 防抖：延迟300ms执行搜索
    this.searchTimer = setTimeout(() => {
      this.searchProducts(keyword)
    }, 300)
  },

  // 搜索商品
  searchProducts(keyword) {
    const { allProducts, currentCategory } = this.data
    const lowerKeyword = keyword.toLowerCase()

    // 先按分类筛选
    let filtered = currentCategory === 'all'
      ? allProducts
      : allProducts.filter(p => p.categoryId === currentCategory)

    // 再按关键词搜索（搜索名称和描述）
    const searchResults = filtered.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(lowerKeyword)
      const descMatch = product.description && product.description.toLowerCase().includes(lowerKeyword)
      const tagMatch = product.tags && product.tags.some(tag => tag.toLowerCase().includes(lowerKeyword))
      
      return nameMatch || descMatch || tagMatch
    })

    // 更新商品列表
    this.setData({ products: searchResults })

    // 如果没有搜索结果，显示提示
    if (searchResults.length === 0) {
      wx.showToast({
        title: '未找到相关商品',
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 筛选商品（用于分类切换或清空搜索）
  filterProducts() {
    const { allProducts, currentCategory } = this.data

    let filtered = currentCategory === 'all'
      ? allProducts
      : allProducts.filter(p => p.categoryId === currentCategory)

    this.setData({ products: filtered })
  },

  // 清空搜索
  clearSearch() {
    this.setData({ searchKeyword: '' })
    this.filterProducts()
  },

  // 商品详情
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

    // 构建购物车项（与详情页格式一致）
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      temp: 'hot',        // 默认热饮
      size: 'medium',     // 默认中杯
      sugar: 'standard',  // 默认标准糖
      quantity: 1,
      selected: true
    }

    // 检查是否已存在相同商品（相同规格）
    const existIndex = cart.findIndex(cartItem => 
      cartItem.id === item.id && 
      cartItem.temp === 'hot' && 
      cartItem.size === 'medium' && 
      cartItem.sugar === 'standard'
    )

    if (existIndex > -1) {
      // 更新数量
      cart[existIndex].quantity += 1
    } else {
      // 添加新商品
      cart.push(cartItem)
    }

    wx.setStorageSync('cart', cart)
    this.getCartCount()

    wx.showToast({
      title: '加入购物车成功',
      icon: 'success'
    })
  },

  // 获取购物车数量
  getCartCount() {
    const cart = wx.getStorageSync('cart') || []
    const count = cart.reduce((sum, item) => sum + item.quantity, 0)
    this.setData({ cartCount: count })
  },

  // 跳转购物车
  goToCart() {
    wx.switchTab({ url: '/pages/cart/cart' })
  }
})
