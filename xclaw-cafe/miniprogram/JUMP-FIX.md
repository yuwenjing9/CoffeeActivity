# 页面跳转方法修复说明

## TabBar页面列表

根据 `app.json` 配置，以下4个页面是TabBar页面：
1. `pages/index/index` - 首页
2. `pages/cart/cart` - 购物车
3. `pages/order/list` - 订单列表
4. `pages/user/center` - 个人中心

## 跳转规则

### wx.switchTab
**用于跳转到TabBar页面**
- ✅ 只能跳转到TabBar页面
- ✅ 跳转后关闭其他所有非TabBar页面
- ✅ 不能携带参数

### wx.navigateTo
**用于跳转到非TabBar页面**
- ✅ 跳转到非TabBar页面
- ✅ 可以携带参数
- ✅ 会保留当前页面，可以返回

### wx.redirectTo
**用于关闭当前页面并跳转**
- ✅ 关闭当前页面，跳转到新页面
- ✅ 不能返回到上一页
- ✅ 适用于支付完成等场景

## 发现的问题

### ❌ 问题1：index.js - 更多按钮跳转
**位置**：`pages/index/index.js` 第102行
**错误代码**：
```javascript
wx.navigateTo({
  url: `/pages/product/list?categoryId=${id}`  // id未定义
})
```
**问题**：
1. `id` 变量未定义
2. 商品列表页不是TabBar页面，可以用navigateTo

**修复后**：
```javascript
wx.navigateTo({
  url: '/pages/product/list'  // 移除未定义的id参数
})
```

### ❌ 问题2：coupon.js - 使用优惠券跳转
**位置**：`pages/user/coupon.js` 第25行
**错误代码**：
```javascript
wx.switchTab({ url: '/pages/product/list' })
```
**问题**：商品列表页不是TabBar页面，不能用switchTab

**修复后**：
```javascript
wx.navigateTo({ url: '/pages/product/list' })
```

### ❌ 问题3：order/list.js - 去逛逛按钮跳转
**位置**：`pages/order/list.js` 第189行
**错误代码**：
```javascript
wx.switchTab({ url: '/pages/product/list' })
```
**问题**：商品列表页不是TabBar页面，不能用switchTab

**修复后**：
```javascript
wx.navigateTo({ url: '/pages/product/list' })
```

## 正确的跳转示例

### 跳转到TabBar页面（使用switchTab）
```javascript
// ✅ 跳转到首页
wx.switchTab({ url: '/pages/index/index' })

// ✅ 跳转到购物车
wx.switchTab({ url: '/pages/cart/cart' })

// ✅ 跳转到订单列表
wx.switchTab({ url: '/pages/order/list' })

// ✅ 跳转到个人中心
wx.switchTab({ url: '/pages/user/center' })
```

### 跳转到非TabBar页面（使用navigateTo）
```javascript
// ✅ 跳转到商品列表（可带参数）
wx.navigateTo({ url: '/pages/product/list' })
wx.navigateTo({ url: '/pages/product/list?categoryId=1' })

// ✅ 跳转到商品详情
wx.navigateTo({ url: `/pages/product/detail?id=${id}` })

// ✅ 跳转到优惠券页面
wx.navigateTo({ url: '/pages/user/coupon' })

// ✅ 跳转到地址管理
wx.navigateTo({ url: '/pages/user/address' })

// ✅ 跳转到订单确认页
wx.navigateTo({ url: '/pages/order/confirm' })
```

### 使用redirectTo（关闭当前页面）
```javascript
// ✅ 支付成功后跳转
wx.redirectTo({
  url: `/pages/order/pay-result?orderId=${orderId}&status=success`
})
```

## 页面跳转速查表

| 目标页面 | 页面类型 | 跳转方法 | 是否可带参数 |
|---------|---------|---------|------------|
| 首页 | TabBar | `wx.switchTab` | ❌ |
| 购物车 | TabBar | `wx.switchTab` | ❌ |
| 订单列表 | TabBar | `wx.switchTab` | ❌ |
| 个人中心 | TabBar | `wx.switchTab` | ❌ |
| 商品列表 | 普通页面 | `wx.navigateTo` | ✅ |
| 商品详情 | 普通页面 | `wx.navigateTo` | ✅ |
| 订单确认 | 普通页面 | `wx.navigateTo` | ✅ |
| 订单详情 | 普通页面 | `wx.navigateTo` | ✅ |
| 优惠券 | 普通页面 | `wx.navigateTo` | ✅ |
| 地址管理 | 普通页面 | `wx.navigateTo` | ✅ |
| 积分中心 | 普通页面 | `wx.navigateTo` | ✅ |

## 修复的文件

1. ✅ `pages/index/index.js` - 修复"更多"按钮跳转
2. ✅ `pages/user/coupon.js` - 修复"使用优惠券"跳转
3. ✅ `pages/order/list.js` - 修复"去逛逛"按钮跳转

## 测试验证

### 测试首页
1. 点击"更多"按钮 → 应跳转到商品列表页
2. 点击分类图标 → 应跳转到商品列表页（带分类参数）
3. 点击商品卡片 → 应跳转到商品详情页
4. 点击"限时优惠" → 应跳转到优惠券页面

### 测试优惠券页面
1. 点击"去使用"按钮 → 应跳转到商品列表页

### 测试订单列表页面
1. 点击"去逛逛"按钮 → 应跳转到商品列表页

## 注意事项

1. **TabBar页面只能用switchTab**
   - 不能使用navigateTo
   - 不能携带参数

2. **非TabBar页面使用navigateTo**
   - 可以携带参数
   - 页面栈最多10层

3. **redirectTo会关闭当前页面**
   - 用户无法返回
   - 适用于支付完成等场景

4. **reLaunch可以关闭所有页面**
   - 重新启动应用
   - 可以跳转到任何页面

## 常见错误

### 错误1：跳转到TabBar页面使用navigateTo
```javascript
// ❌ 错误
wx.navigateTo({ url: '/pages/cart/cart' })

// ✅ 正确
wx.switchTab({ url: '/pages/cart/cart' })
```

### 错误2：跳转到非TabBar页面使用switchTab
```javascript
// ❌ 错误
wx.switchTab({ url: '/pages/product/list' })

// ✅ 正确
wx.navigateTo({ url: '/pages/product/list' })
```

### 错误3：switchTab携带参数
```javascript
// ❌ 错误 - switchTab不支持参数
wx.switchTab({ url: '/pages/cart/cart?id=1' })

// ✅ 正确 - 不要带参数
wx.switchTab({ url: '/pages/cart/cart' })
```
