# 首页图标尺寸修复说明

## 修复日期
2026-03-19

## 问题描述
首页的精选推荐图标和限时优惠部分图标尺寸与设计稿不符，没有正确还原设计稿。

## 修复内容

### 1. 限时优惠区域图标

#### 限时优惠图标（3.svg）
- **修复前**：`width: 30rpx; height: 30rpx;`
- **修复后**：`width: 21rpx; height: 21rpx;`
- **依据**：Figma设计稿中的实际尺寸约为10.5px，换算为小程序rpx单位为21rpx

#### 箭头图标（4.svg）
- **修复前**：`width: 30rpx; height: 30rpx;`
- **修复后**：`width: 14rpx; height: 14rpx;`
- **依据**：Figma设计稿中的实际尺寸约为7px，换算为小程序rpx单位为14rpx

### 2. 精选推荐区域图标

#### 精选推荐图标（5.svg）
- **修复前**：`width: 30rpx; height: 30rpx;`
- **修复后**：`width: 17.5rpx; height: 17.5rpx;`
- **依据**：Figma设计稿中的实际尺寸约为8.75px，换算为小程序rpx单位为17.5rpx

#### 更多箭头图标（6.svg）
- **修复前**：`width: 30rpx; height: 30rpx;`
- **修复后**：`width: 10.5rpx; height: 10.5rpx;`
- **依据**：Figma设计稿中的实际尺寸约为5.25px，换算为小程序rpx单位为10.5rpx

### 3. 商品评分星星图标

#### 星星图标（7.svg - 10.svg）
- **当前尺寸**：`width: 14rpx; height: 14rpx;`
- **状态**：✅ 已符合设计稿
- **依据**：Figma设计稿中的实际尺寸约为7px，换算为小程序rpx单位为14rpx

## 尺寸换算规则

在小程序开发中，尺寸换算规则为：
- **Figma设计稿（750px宽度）→ 小程序rpx**：1px ≈ 1rpx
- **本设计稿（378px宽度）→ 小程序rpx**：1px ≈ 2rpx

## 修改文件

- `xclaw-cafe/miniprogram/pages/index/index.wxss`

## 验证方法

1. 打开微信开发者工具
2. 查看首页的限时优惠区域
3. 查看首页的精选推荐区域
4. 确认图标大小与设计稿一致

## 注意事项

1. SVG图标在小程序中可能需要设置颜色，如果图标颜色不对，请检查SVG文件内部的fill属性
2. 如果图标仍然显示不正确，可以尝试使用image标签的mode属性调整显示方式
3. 确保SVG文件已正确复制到`/images`目录

## 相关资源文件

所有图标资源已从Figma设计稿导出并复制到：
- `xclaw-cafe/miniprogram/images/3.svg` - 限时优惠图标
- `xclaw-cafe/miniprogram/images/4.svg` - 箭头图标
- `xclaw-cafe/miniprogram/images/5.svg` - 精选推荐图标
- `xclaw-cafe/miniprogram/images/6.svg` - 更多箭头图标
- `xclaw-cafe/miniprogram/images/7.svg` - 星星图标（第1个商品）
- `xclaw-cafe/miniprogram/images/8.svg` - 星星图标（第2个商品）
- `xclaw-cafe/miniprogram/images/9.svg` - 星星图标（第3个商品）
- `xclaw-cafe/miniprogram/images/10.svg` - 星星图标（第4个商品）
