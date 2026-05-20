const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');

const STEPS = [
  '服务端解除绑定',
  '通知设备执行擦除',
  '清除本地用户数据',
  '恢复出厂状态'
];

const CLEAN_ITEMS = [
  'Wi-Fi 网络配置',
  '用户绑定关系',
  '个性化偏好设置',
  '本地陪伴对话记录',
  '情绪记忆数据'
];

Page({
  data: {
    device: null,
    steps: STEPS.map((label, i) => ({ label, status: i === 0 ? 'doing' : 'wait' })),
    idx: 0,
    showForce: false,
    elapsed: 0,
    success: false,
    cleanItems: CLEAN_ITEMS
  },

  onLoad(opt) {
    this._id = opt.id;
    const device = storage.getDeviceById(this._id);
    if (!device) {
      util.toast('设备不存在');
      setTimeout(() => wx.navigateBack(), 600);
      return;
    }
    this.setData({ device });
    this._run();
    this._startTimer();
  },

  onShow() {
    wx.setNavigationBarTitle({
      title: this.data.success ? '解绑完成' : '解绑中'
    });
  },

  onUnload() {
    if (this._t) clearTimeout(this._t);
    if (this._timer) clearInterval(this._timer);
  },

  _startTimer() {
    this._timer = setInterval(() => {
      const e = this.data.elapsed + 1;
      this.setData({ elapsed: e });
      if (e >= 60 && !this.data.success) {
        this.setData({ showForce: true });
      }
    }, 1000);
  },

  _run() {
    const i = this.data.idx;
    if (i >= STEPS.length) {
      this._done();
      return;
    }
    const delay = i === 1 ? 3000 : 1500 + Math.random() * 500;
    this._t = setTimeout(() => {
      const arr = this.data.steps.slice();
      arr[i].status = 'done';
      const next = i + 1;
      if (next < arr.length) arr[next].status = 'doing';
      this.setData({ steps: arr, idx: next });
      this._run();
    }, delay);
  },

  _done() {
    storage.removeDevice(this._id);
    this.setData({ success: true });
    if (this._timer) clearInterval(this._timer);
    wx.setNavigationBarTitle({ title: '解绑完成' });
  },

  onForce() {
    wx.showModal({
      title: '强制解绑',
      content: '强制解绑后设备本地数据可能未被清除，是否继续？',
      success: (res) => {
        if (res.confirm) {
          if (this._t) clearTimeout(this._t);
          this._done();
        }
      }
    });
  },

  onBack() {
    wx.switchTab({ url: '/pages/device/device' });
  }
});
