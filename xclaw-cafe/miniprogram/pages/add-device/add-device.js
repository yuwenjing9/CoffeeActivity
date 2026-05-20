const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');

// mock 扫描到的设备
const MOCK_SCANNED = [
  { name: 'LB-A1F3', sn: 'LB23061847A1F3', rssi: -42, model: 'LingTu-Mini Pro' },
  { name: 'LB-7C29', sn: 'LB23061850B7C29', rssi: -58, model: 'LingTu-Mini' }
];

// 配网执行步骤
const PROVISION_STEPS = [
  'BLE 安全通道已建立',
  'Wi-Fi 凭证已下发',
  '设备联网中...',
  '服务端绑定'
];

Page({
  data: {
    // 当前大步骤 1-6
    step: 1,
    stepLabels: ['准备', '扫描', '配网', '完成'],

    // step1 - 准备
    // step2 - 蓝牙权限弹层
    showBleModal: false,

    // step3 - 扫描
    scanning: false,
    scanned: [],
    selectedDevice: null,

    // step4 - 配网配置
    ssid: 'XCloud-Home-2.4G',
    is5G: false,
    password: '',
    showPwd: false,

    // step5 - 配网执行
    provisionSteps: PROVISION_STEPS.map((label, i) => ({
      label, status: i === 0 ? 'doing' : 'wait'
    })),
    provisionIndex: 0,
    remainingSeconds: 30,

    // step6 - 成功
    newDevice: null,
    nickname: '小灵兔'
  },

  onShow() {
    let title = '添加设备';
    if (this.data.step === 1) title = '添加小伙伴';
    if (this.data.step === 4) title = '配置 Wi-Fi';
    if (this.data.step === 6) title = '绑定成功';
    wx.setNavigationBarTitle({ title });
  },

  onUnload() {
    if (this._timer) clearTimeout(this._timer);
    if (this._scanTimer) clearTimeout(this._scanTimer);
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
      this._countdownTimer = null;
    }
  },

  // 大步骤映射到指示器
  _siStep(step) {
    if (step <= 2) return 1;
    if (step === 3) return 2;
    if (step <= 5) return 3;
    return 4;
  },

  // ========== 步骤 1：准备 ==========
  onReadyNext() {
    this.setData({ showBleModal: true });
  },

  // ========== 步骤 2：蓝牙权限 ==========
  onBleAgree() {
    // mock 调用 wx.openBluetoothAdapter
    wx.openBluetoothAdapter({
      success: () => {
        this._enterScan();
      },
      fail: () => {
        // 开发者工具/未开启蓝牙时也允许 mock 继续，便于演示
        this._enterScan();
      }
    });
  },
  onBleDeny() {
    this.setData({ showBleModal: false });
    util.toast('未授权蓝牙，无法继续配网');
  },
  _enterScan() {
    this.setData({
      showBleModal: false,
      step: 3,
      scanning: true,
      scanned: []
    });
    // mock 2 秒后返回扫描结果
    this._scanTimer = setTimeout(() => {
      this.setData({
        scanning: false,
        scanned: MOCK_SCANNED
      });
    }, 2000);
  },

  // ========== 步骤 3：扫描 ==========
  onRescan() {
    this.setData({ scanning: true, scanned: [] });
    this._scanTimer = setTimeout(() => {
      this.setData({ scanning: false, scanned: MOCK_SCANNED });
    }, 1500);
  },
  onPickDevice(e) {
    const idx = e.currentTarget.dataset.idx;
    const dev = this.data.scanned[idx];
    this.setData({
      selectedDevice: dev,
      step: 4,
      is5G: util.is5GWifi(this.data.ssid)
    });
  },

  // ========== 步骤 4：配置 Wi-Fi ==========
  onSsidInput(e) {
    const ssid = e.detail.value;
    this.setData({ ssid, is5G: util.is5GWifi(ssid) });
  },

  // 切换 Wi-Fi（mock：弹出提示）
  onSwitchWifi() {
    util.toast('请在手机系统设置中切换 Wi-Fi');
  },
  onPwdInput(e) {
    this.setData({ password: e.detail.value });
  },
  onTogglePwd() {
    this.setData({ showPwd: !this.data.showPwd });
  },
  onStartProvision() {
    if (!this.data.ssid) {
      util.toast('请输入 Wi-Fi 名称');
      return;
    }
    if (this.data.is5G) {
      util.toast('请切换到 2.4G Wi-Fi');
      return;
    }
    if (!this.data.password) {
      util.toast('请输入 Wi-Fi 密码');
      return;
    }

    // 清理旧倒计时
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
      this._countdownTimer = null;
    }

    this.setData({
      step: 5,
      provisionSteps: PROVISION_STEPS.map((label, i) => ({
        label, status: i === 0 ? 'doing' : 'wait'
      })),
      provisionIndex: 0,
      remainingSeconds: 30
    });

    // 启动30秒倒计时
    this._countdownTimer = setInterval(() => {
      const rs = this.data.remainingSeconds - 1;
      if (rs <= 0) {
        clearInterval(this._countdownTimer);
        this._countdownTimer = null;
      }
      this.setData({ remainingSeconds: rs > 0 ? rs : 0 });
    }, 1000);

    this._runProvision();
  },

  // ========== 步骤 5：配网执行 ==========
  _runProvision() {
    const i = this.data.provisionIndex;
    if (i >= PROVISION_STEPS.length) {
      this._onProvisionDone();
      return;
    }
    this._timer = setTimeout(() => {
      const arr = this.data.provisionSteps.slice();
      arr[i].status = 'done';
      const nextIdx = i + 1;
      if (nextIdx < arr.length) arr[nextIdx].status = 'doing';
      this.setData({
        provisionSteps: arr,
        provisionIndex: nextIdx
      });
      this._runProvision();
    }, 1500 + Math.random() * 800);
  },

  _onProvisionDone() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
      this._countdownTimer = null;
    }

    const dev = this.data.selectedDevice || MOCK_SCANNED[0];
    const newDevice = {
      id: 'd' + Date.now(),
      nickname: '小灵兔',
      sn: dev.sn || util.randomSn(),
      model: dev.model || 'LingTu-Mini',
      fw: '2.4.3',
      status: 'online',
      battery: 100,
      wifi: this.data.ssid,
      wifiRssi: 4,
      temp: 23,
      activeDate: util.formatDate(),
      avatar: '🐰'
    };
    this.setData({ step: 6, newDevice, nickname: newDevice.nickname });
    wx.setNavigationBarTitle({ title: '绑定成功' });
  },

  // ========== 步骤 6：成功 ==========
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },
  onFinish() {
    const dev = Object.assign({}, this.data.newDevice, {
      nickname: this.data.nickname || '小灵兔'
    });
    storage.addDevice(dev);
    util.toast('绑定成功', 'success');
    setTimeout(() => {
      wx.redirectTo({
        url: `/pages/device-detail/device-detail?id=${dev.id}`
      });
    }, 600);
  }
});
