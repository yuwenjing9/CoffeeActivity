const MAP = {
  user: '用户协议',
  privacy: '隐私政策',
  help: '帮助中心',
  collect: '个人信息明示清单',
  share: '第三方信息共享清单',
  perm: '应用权限说明',
  cookie: 'Cookie 使用说明',
  changelog: '更新日志',
  oss: '开源许可'
};

Page({
  data: {
    title: '协议',
    type: 'user'
  },

  onLoad(opt) {
    const type = opt.type || 'user';
    const title = MAP[type] || '协议';
    this.setData({ type, title });
    wx.setNavigationBarTitle({ title });
  }
});
