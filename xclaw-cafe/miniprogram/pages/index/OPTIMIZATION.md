# 首页横向滚动问题优化说明

## 问题原因

首页出现横向滚动条的主要原因是：

1. **`.header` 的 `height: 100%`**：导致高度计算错误
2. **元素同时设置 `width: 100%` 和 `padding`**：没有使用 `box-sizing: border-box`，导致实际宽度超出屏幕
3. **缺少全局横向滚动限制**：没有在 `page` 和容器上设置 `overflow-x: hidden`

## 优化方案

### 1. 添加全局防滚动设置

在 `page` 和 `.container` 上添加：
```css
page {
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}

.container {
  overflow-x: hidden;
  box-sizing: border-box;
}
```

### 2. 修复 Header 高度

将 `height: 100%` 改为固定高度：
```css
.header {
  height: 144rpx; /* 固定高度 */
  box-sizing: border-box;
}
```

### 3. 添加 box-sizing 到所有容器

所有设置了 `width: 100%` 并带有 `padding` 的元素添加：
```css
box-sizing: border-box;
```

包括：
- `.header`
- `.banner-section`
- `.category-section`
- `.promotion-section`
- `.product-grid`
- `.tabbar`

### 4. 全局样式优化

在 `app.wxss` 中添加：
```css
page {
  overflow-x: hidden;
  width: 100%;
  box-sizing: border-box;
}
```

## 优化后的效果

✅ **横向滚动条消失**：页面宽度严格控制在屏幕范围内
✅ **布局稳定**：所有元素正确计算宽度和padding
✅ **性能提升**：减少不必要的重排和重绘
✅ **用户体验改善**：页面滚动更加流畅

## 技术要点

### box-sizing: border-box 的作用

CSS 默认的盒模型是 `content-box`，元素的宽度 = content宽度 + padding + border。
使用 `border-box` 后，元素的宽度 = 设定的宽度，padding 和 border 包含在内。

示例：
```css
/* content-box（默认） */
width: 100%;
padding: 0 35rpx;
/* 实际宽度 = 100% + 35rpx*2 = 超出屏幕！ */

/* border-box */
box-sizing: border-box;
width: 100%;
padding: 0 35rpx;
/* 实际宽度 = 100%，padding 在内部 */
```

### overflow-x: hidden 的作用

防止内容溢出导致横向滚动：
```css
overflow-x: hidden; /* 隐藏横向溢出内容 */
```

## 测试建议

1. 在微信开发者工具中检查是否有横向滚动条
2. 在真机上测试页面滚动是否流畅
3. 检查不同屏幕尺寸下的布局是否正常

## 相关文件

- `xclaw-cafe/miniprogram/pages/index/index.wxss` - 页面样式
- `xclaw-cafe/miniprogram/app.wxss` - 全局样式
