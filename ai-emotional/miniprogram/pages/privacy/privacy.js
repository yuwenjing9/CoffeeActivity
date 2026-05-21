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
    wx.showModal({
      title: '撤回授权',
      content: '将撤回所有授权，下次使用需重新授权',
      success: (res) => {
        if (res.confirm) {
          this.openSetting();
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
