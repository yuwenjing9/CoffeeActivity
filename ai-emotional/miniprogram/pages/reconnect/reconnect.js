const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');

const STEPS = ['BLE 通道建立', 'Wi-Fi 凭证下发', '设备联网中'];

Page({
  data: {
    device: null,
    step: 1, // 1: 准备 2: 配置Wi-Fi 3: 执行 4: 成功
    scanning: false,

    ssid: 'XCloud-Home-2.4G',
    is5G: false,
    password: '',
    showPwd: false,

    provSteps: STEPS.map((label, i) => ({ label, status: i === 0 ? 'doing' : 'wait' })),
    provIdx: 0
  },

  onLoad(opt) {
    this._id = opt.id;
    const device = storage.getDeviceById(this._id);
    if (!device) {
      util.toast('设备不存在');
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    this.setData({
      device,
      ssid: device.wifi && device.wifi !== '-' ? device.wifi : 'XCloud-Home-2.4G'
    });
  },

  onUnload() {
    if (this._timer) clearTimeout(this._timer);
  },

  // 开始重新配网 → 跳转到 add-device 配网步骤
  onStartReconnect() {
    wx.redirectTo({
      url: `/pages/add-device/add-device?from=reconnect&id=${this._id}`
    });
  },

  onSsidInput(e) {
    const ssid = e.detail.value;
    this.setData({ ssid, is5G: util.is5GWifi(ssid) });
  },

  onPwdInput(e) {
    this.setData({ password: e.detail.value });
  },

  onTogglePwd() {
    this.setData({ showPwd: !this.data.showPwd });
  },

  onStart() {
    if (!this.data.ssid) return util.toast('请输入 Wi-Fi 名称');
    if (this.data.is5G) return util.toast('请切换到 2.4G Wi-Fi');
    if (!this.data.password) return util.toast('请输入 Wi-Fi 密码');
    this.setData({
      step: 3,
      provSteps: STEPS.map((label, i) => ({ label, status: i === 0 ? 'doing' : 'wait' })),
      provIdx: 0
    });
    this._run();
  },

  _run() {
    const i = this.data.provIdx;
    if (i >= STEPS.length) {
      storage.updateDevice(this._id, { wifi: this.data.ssid, status: 'online' });
      this.setData({ step: 4 });
      return;
    }
    this._timer = setTimeout(() => {
      const arr = this.data.provSteps.slice();
      arr[i].status = 'done';
      const next = i + 1;
      if (next < arr.length) arr[next].status = 'doing';
      this.setData({ provSteps: arr, provIdx: next });
      this._run();
    }, 1400);
  },

  onBack() {
    wx.navigateBack();
  }
});
