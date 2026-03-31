Page({
  data: {
    cartItems: [],
    invalidItems: [],
    recommendProducts: [
      { id: 5, name: '抹茶拿铁', price: 30, sales: 3600, image: '/images/products/matcha.png' },
      { id: 6, name: '摩卡咖啡', price: 32, sales: 2900, image: '/images/products/mocha.png' }
    ],
    isAllSelected: false,
    totalPrice: 0,
    selectedCount: 0
  },

  onLoad() {
    this.loadCartData()
  },

  onShow() {
    this.loadCartData()
  },

  // 加载购物车数据
  loadCartData() {
    const cart = wx.getStorageSync('cart') || []
    console.log('cart',cart);
    // 规格中文映射
    const tempMap = { hot: '热饮', cold: '冰饮' }
    const sizeMap = { small: '小杯', medium: '中杯', large: '大杯' }
    const sugarMap = { none: '不加糖', little: '少糖', standard: '标准', more: '多糖' }

    const cartItems = cart.map(item => {
      // 拼接规格文本
      const specs = [tempMap[item.temp], sizeMap[item.size], sugarMap[item.sugar]]
        .filter(Boolean)
        .join(' · ')
      return {
        ...item,
        specs: specs || '',
        selected: item.selected !== false
      }
    })
    this.setData({ cartItems }, () => {
      this.calculateTotal()
    })
    this.checkAllSelected()
  },

  // 选择商品
  toggleSelect(e) {
    const index = e.currentTarget.dataset.index
    const key = `cartItems[${index}].selected`
    this.setData({
      [key]: !this.data.cartItems[index].selected
    }, () => {
      this.checkAllSelected()
      this.calculateTotal()
    })
  },

  // 全选
  toggleSelectAll() {
    const isAllSelected = !this.data.isAllSelected
    const cartItems = this.data.cartItems.map(item => ({
      ...item,
      selected: isAllSelected
    }))
    this.setData({
      cartItems,
      isAllSelected
    }, () => {
      this.calculateTotal()
    })
  },

  // 检查是否全选
  checkAllSelected() {
    const isAllSelected = this.data.cartItems.length > 0 && 
                          this.data.cartItems.every(item => item.selected)
    this.setData({ isAllSelected })
  },

  // 计算总价
  calculateTotal() {
    const selectedItems = this.data.cartItems.filter(item => item.selected)
    const totalPrice = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const selectedCount = selectedItems.reduce((sum, item) => sum + item.quantity, 0)
    this.setData({ totalPrice, selectedCount })
  },

  // 修改数量
  changeQuantity(e) {
    const { index, delta } = e.currentTarget.dataset
    const item = this.data.cartItems[index]
    const newQuantity = item.quantity + parseInt(delta)
    
    if (newQuantity < 1) {
      wx.showModal({
        title: '提示',
        content: '确定删除该商品吗？',
        success: (res) => {
          if (res.confirm) {
            this.deleteItem(e)
          }
        }
      })
      return
    }
    
    const key = `cartItems[${index}].quantity`
    this.setData({ [key]: newQuantity }, () => {
      this.saveCart()
      this.calculateTotal()
    })
  },

  // 删除商品
  deleteItem(e) {
    const index = e.currentTarget.dataset.index
    const cartItems = this.data.cartItems.filter((_, i) => i !== index)
    this.setData({ cartItems }, () => {
      this.saveCart()
      this.checkAllSelected()
      this.calculateTotal()
    })
  },

  // 保存购物车
  saveCart() {
    wx.setStorageSync('cart', this.data.cartItems)
  },

  // 清空失效商品
  clearInvalid() {
    this.setData({ invalidItems: [] })
  },

  // 结算
  checkout() {
    if (this.data.selectedCount === 0) {
      wx.showToast({ title: '请选择商品', icon: 'none' })
      return
    }
    
    const selectedItems = this.data.cartItems.filter(item => item.selected)
    wx.setStorageSync('orderConfirmData', {
      items: selectedItems,
      totalAmount: this.data.totalPrice,
      from: 'cart'
    })
    
    wx.navigateTo({
      url: '/pages/order/confirm'
    })
  },

  // 去逛逛
  goShopping() {
    wx.navigateTo({
      url: '/pages/product/list'
    })
  },

  // 商品详情
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/product/detail?id=${id}`
    })
  },
})
