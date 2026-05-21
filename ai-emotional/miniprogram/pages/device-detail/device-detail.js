const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');

Page({
  data: {
    device: null,
    editingName: false,
    nameDraft: '',
    showUnbindSheet: false,
    unbindChecked: false
  },

  onLoad(opt) {
    this._id = opt.id;
  },
  onShow() {
    this._reload();
  },

  _reload() {
    const device = storage.getDeviceById(this._id);
    if (!device) {
      util.toast('设备不存在');
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    this.setData({ device, nameDraft: device.nickname });
  },

  // 复制 SN
  onCopySn() {
    wx.setClipboardData({ data: this.data.device.sn });
  },

  // 编辑昵称
  onEditName() {
    this.setData({ editingName: true, nameDraft: this.data.device.nickname });
  },
  onNameInput(e) {
    this.setData({ nameDraft: e.detail.value });
  },
  onSaveName() {
    const name = (this.data.nameDraft || '').trim();
    if (!name) return util.toast('昵称不能为空');
    storage.updateDevice(this._id, { nickname: name });
    this.setData({ editingName: false });
    this._reload();
    util.toast('已保存', 'success');
  },
  onCancelName() {
    this.setData({ editingName: false });
  },

  // 重新配网
  onReconnect() {
    wx.navigateTo({ url: `/pages/reconnect/reconnect?id=${this._id}` });
  },

  // 重启设备 mock
  onReboot() {
    wx.showModal({
      title: '重启设备',
      content: '确定要重启该设备吗？',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '正在重启…' });
          setTimeout(() => {
            wx.hideLoading();
            util.toast('已发送重启指令', 'success');
          }, 1500);
        }
      }
    });
  },

  // 解绑流程
  onUnbind() {
    this.setData({ showUnbindSheet: true, unbindChecked: false });
  },
  onCloseUnbind() {
    this.setData({ showUnbindSheet: false });
  },
  onToggleUnbindCheck() {
    this.setData({ unbindChecked: !this.data.unbindChecked });
  },
  onConfirmUnbind() {
    if (!this.data.unbindChecked) {
      return util.toast('请先勾选已知晓风险');
    }
    this.setData({ showUnbindSheet: false });
    wx.redirectTo({
      url: `/pages/unbind/unbind?id=${this._id}`
    });
  },

  // 固件升级 mock
  onUpgrade() {
    wx.showModal({
      title: '升级固件',
      content: `检测到新版本 ${this.data.device.fwNew}，是否升级？`,
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '正在升级…' });
          setTimeout(() => {
            storage.updateDevice(this._id, { fw: this.data.device.fwNew, fwNew: null });
            this._reload();
            wx.hideLoading();
            util.toast('升级成功', 'success');
          }, 2000);
        }
      }
    });
  }
});
