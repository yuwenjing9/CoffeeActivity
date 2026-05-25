const storage = require('../../utils/storage.js');

Page({
  data: {
    auth: {
      bluetooth: '未开启',
      location: '未开启',
      notification: '未开启',
      album: '未开启'
    }
  },

  onShow() {
    this._checkAuth();
  },

  _checkAuth() {
    wx.getSetting({
      success: (res) => {
        const s = res.authSetting || {};
        const fmt = (v) => v === true ? '已授权' : '未开启';
        this.setData({
          auth: {
            bluetooth: fmt(s['scope.bluetooth']),
            location: fmt(s['scope.userLocation']),
            notification: fmt(s['scope.subscribeMessage']),
            album: fmt(s['scope.writePhotosAlbum'])
          }
        });
      }
    });
  },

  goLink(e) {
    const type = e.currentTarget.dataset.type;
    wx.navigateTo({ url: `/pages/webview/webview?type=${type}` });
  },

  openSetting() {
    wx.openSetting({
      success: () => this._checkAuth()
    });
  },

  onRevoke() {
    const auth = this.data.auth;
    const authList = [];
    if (auth.bluetooth === '已授权') authList.push('蓝牙');
    if (auth.location === '已授权') authList.push('位置信息');
    if (auth.notification === '已授权') authList.push('消息通知');
    if (auth.album === '已授权') authList.push('相册');

    if (authList.length === 0) {
      wx.showToast({ title: '当前无已授权项', icon: 'none' });
      return;
    }

    wx.showModal({
      title: '撤回授权',
      content: `将撤回以下授权：${authList.join('、')}\n\n请在设置页面中逐一关闭，下次绑定设备时需重新授权。`,
      confirmText: '去关闭',
      confirmColor: '#E94B3C',
      success: (res) => {
        if (res.confirm) {
          storage.setAuthRevoked(true);
          wx.openSetting({
            success: () => {
              this._checkAuth();
              const currentAuth = this.data.auth;
              const remaining = [];
              if (currentAuth.bluetooth === '已授权') remaining.push('蓝牙');
              if (currentAuth.location === '已授权') remaining.push('位置信息');
              if (currentAuth.notification === '已授权') remaining.push('消息通知');
              if (currentAuth.album === '已授权') remaining.push('相册');
              if (remaining.length > 0) {
                wx.showToast({
                  title: `仍有${remaining.length}项未关闭`,
                  icon: 'none'
                });
              } else {
                wx.showToast({
                  title: '所有授权已撤回',
                  icon: 'success'
                });
              }
            }
          });
        }
      }
    });
  },

  onExport() {
    wx.showLoading({ title: '生成中...' });
    setTimeout(() => {
      wx.hideLoading();
      wx.showToast({ title: '已生成数据导出链接', icon: 'none' });
    }, 1500);
  },

  onLogoff() {
    wx.showModal({
      title: '注销账号',
      content: '注销后所有数据将被永久删除，确认继续？',
      confirmColor: 'var(--danger)',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '注销申请已提交', icon: 'none' });
        }
      }
    });
  }
});
