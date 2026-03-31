# 首页点击问题修复说明

## 问题描述

首页的"限时优惠"和"精选推荐"区域点击后无法打开对应页面。

## 问题原因

### 1. 限时优惠区域缺少点击事件
- WXML中没有绑定 `bindtap` 事件
- JS中没有对应的事件处理函数

### 2. 商品图片路径不存在
- product/list页面引用了不存在的商品图片路径
- 缺少 `/images/products/` 目录及商品图片文件

## 修复方案

### 1. 添加限时优惠点击事件

#### WXML修改
```xml
<!-- 限时优惠 -->
<view class="promotion-section" bindtap="onPromotionTap">
  <!-- 内容 -->
</view>
```

#### JS修改
```javascript
// 限时优惠点击
onPromotionTap() {
  wx.navigateTo({
    url: '/pages/user/coupon'
  })
}
```

### 2. 创建商品图片资源

#### 创建products目录
在 `xclaw-cafe/miniprogram/images/` 下创建 `products` 目录

#### 复制商品图片
将Figma资源中的商品图片复制到products目录，并重命名：
- `16.png` → `latte.png` (经典拿铁)
- `17.png` → `espresso.png` (意式浓缩)
- `18.png` → `cappuccino.png` (卡布奇诺)
- `19.png` → `americano.png` (冰美式)
- `15.png` → `banner1.png` (Banner图)
- `20.png` → `banner2.png` (Banner图)

### 3. 修复商品列表图片路径

将不存在的图片路径替换为现有图片：
```javascript
// 修复前
image: '/images/products/machiato.png'  // 不存在
image: '/images/products/matcha.png'    // 不存在
image: '/images/products/tea.png'       // 不存在

// 修复后
image: '/images/products/latte.png'     // 使用拿铁图片
```

## 页面跳转逻辑

### 首页点击事件

| 点击区域 | 跳转页面 | 跳转方式 |
|---------|---------|---------|
| 分类图标 | 商品列表页（带分类ID） | `wx.navigateTo` |
| 限时优惠 | 优惠券页面 | `wx.navigateTo` |
| 商品卡片 | 商品详情页（带商品ID） | `wx.navigateTo` |
| 更多按钮 | 商品列表页 | `wx.switchTab` |

### 页面路径说明

所有页面都已在 `app.json` 中注册：
```json
{
  "pages": [
    "pages/index/index",
    "pages/product/list",
    "pages/product/detail",
    "pages/user/coupon"
  ]
}
```

## 测试验证

### 1. 限时优惠点击
✅ 点击限时优惠横幅 → 跳转到优惠券页面
✅ 显示可用优惠券列表

### 2. 商品点击
✅ 点击商品卡片 → 跳转到商品详情页
✅ 点击"更多"按钮 → 跳转到商品列表页

### 3. 商品列表页
✅ 商品图片正常显示
✅ 分类筛选功能正常
✅ 下拉刷新和上拉加载正常

## 相关文件

### 修改的文件
- `xclaw-cafe/miniprogram/pages/index/index.wxml` - 添加限时优惠点击事件
- `xclaw-cafe/miniprogram/pages/index/index.js` - 添加事件处理函数
- `xclaw-cafe/miniprogram/pages/product/list.js` - 修复商品图片路径

### 新增的资源文件
- `xclaw-cafe/miniprogram/images/products/latte.png`
- `xclaw-cafe/miniprogram/images/products/espresso.png`
- `xclaw-cafe/miniprogram/images/products/cappuccino.png`
- `xclaw-cafe/miniprogram/images/products/americano.png`

## 后续优化建议

1. **添加更多商品图片**：为不同商品准备专属图片
2. **图片懒加载**：优化大量图片加载性能
3. **错误处理**：添加图片加载失败的默认图片
4. **云存储**：将图片上传到云存储，使用CDN加速
