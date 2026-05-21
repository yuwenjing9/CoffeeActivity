const app = getApp();
const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');

// 生成默认昵称（微信用户_xxx）
function genDefaultNickName() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 5; i++) {
    s += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return '微信用户_' + s;
}

Page({
  data: {
    statusBarHeight: 20,
    agreed: true,
    showProtocol: false,
    logining: false,

    // 授权弹窗
    showAuth: false,
    wxNickName: '',     // 弹窗里展示的默认昵称
    code: ''
  },

  onLoad() {
    // 已登录 → 直接进设备页（拦截重复登录）
    if (app.isLogin()) {
      wx.switchTab({ url: '/pages/device/device' });
      return;
    }
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight
    });
    if (!app.globalData.hasAgreedProtocol) {
      this.setData({ showProtocol: true });
    }
  },

  onToggleAgree() {
    this.setData({ agreed: !this.data.agreed });
  },

  onLink(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({
      url: `/pages/webview/webview?type=${type}`
    });
  },

  onProtocolAgree() {
    storage.setProtocolAgreed(true);
    app.globalData.hasAgreedProtocol = true;
    this.setData({ showProtocol: false });
  },

  onProtocolDisagree() {
    wx.showModal({
      title: '提示',
      content: '不同意协议将无法使用本服务，是否退出？',
      confirmText: '退出',
      success: (res) => {
        if (res.confirm) {
          wx.exitMiniProgram && wx.exitMiniProgram({ fail: () => {} });
        }
      }
    });
  },

  // 微信一键登录 → 拿 code → 弹授权弹窗
  onLogin() {
    if (!app.globalData.hasAgreedProtocol) {
      this.setData({ showProtocol: true });
      return;
    }
    if (!this.data.agreed) {
      util.toast('请阅读并同意协议');
      return;
    }
    if (this.data.logining) return;

    wx.login({
      success: (res) => {
        this.setData({
          code: res.code,
          wxNickName: genDefaultNickName(),
          showAuth: true
        });
      },
      fail: () => {
        util.toast('登录失败，请重试');
      }
    });
  },

  // 拒绝授权
  onAuthDeny() {
    if (this.data.logining) return;
    this.setData({ showAuth: false });
    util.toast('已拒绝授权');
  },

  // 允许授权 → 写入用户信息（先只有昵称，头像由"我的"页面去采集）→ 进入设备页
  onAuthAllow() {
    if (this.data.logining) return;
    this.setData({ logining: true });

    const { code, wxNickName } = this.data;

    setTimeout(() => {
      const user = {
        nickName: wxNickName,
        avatarUrl: '',                      // 头像稍后在「我的」页点击采集
        openId: 'mock_openid_' + Date.now(),
        code: code
      };
      storage.setUserInfo(user);
      app.globalData.userInfo = user;

      this.setData({ logining: false, showAuth: false });
      util.toast('登录成功', 'success');
      setTimeout(() => {
        wx.switchTab({ url: '/pages/device/device' });
      }, 600);
    }, 400);
  }
});
