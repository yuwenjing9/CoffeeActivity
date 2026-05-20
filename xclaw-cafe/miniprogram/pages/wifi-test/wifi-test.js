Page({
  data: {
    platform: '',
    SDKVersion: '',
    wxVersion: '',
    isWifiStarted: false,
    connectedWifi: null,
    wifiList: [],
    logs: []
  },

  onLoad() {
    try {
      const sys = wx.getSystemInfoSync();
      this.setData({
        platform: (sys.platform || '').toLowerCase(),
        SDKVersion: sys.SDKVersion || '-',
        wxVersion: sys.version || '-'
      });
      this.addLog(`系统: ${this.data.platform}, 微信版本: ${this.data.wxVersion}, 基础库: ${this.data.SDKVersion}`);
    } catch (e) {
      this.addLog('获取系统信息失败');
    }
  },

  onUnload() {
    if (this.data.isWifiStarted) {
      wx.offGetWifiList && wx.offGetWifiList();
      wx.stopWifi && wx.stopWifi({});
    }
  },

  addLog(msg) {
    const time = new Date();
    const pad = n => String(n).padStart(2, '0');
    const t = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
    const logs = this.data.logs.concat(`[${t}] ${msg}`);
    this.setData({ logs: logs.slice(-200) });
  },

  // 1. 初始化 WiFi 模块
  startWifi() {
    if (this.data.isWifiStarted) return;
    wx.startWifi({
      success: () => {
        this.setData({ isWifiStarted: true });
        this.addLog('startWifi 成功');
        wx.onGetWifiList && wx.onGetWifiList((res) => {
          const list = (res && res.wifiList) || [];
          this.setData({ wifiList: list });
          this.addLog(`onGetWifiList 回调，数量=${list.length}`);
        });
      },
      fail: (err) => {
        this.addLog('startWifi 失败: ' + JSON.stringify(err));
      }
    });
  },

  // 2. 获取周边 WiFi
  getWifiList() {
    if (!this.data.isWifiStarted) {
      this.addLog('请先初始化 WiFi 模块');
      return;
    }
    if (this.data.platform === 'ios') {
      wx.showModal({
        title: '提示',
        content: '即将跳转到系统设置，请进入"无线局域网"页面以获取Wi-Fi列表',
        confirmText: '去设置',
        success: (res) => {
          if (res.confirm) this._doGetWifiList();
        }
      });
      return;
    }
    this._doGetWifiList();
  },

  _doGetWifiList() {
    wx.getWifiList({
      success: () => {
        this.addLog('getWifiList 调用成功，等待 onGetWifiList 回调...');
      },
      fail: (err) => {
        this.addLog('getWifiList 失败: ' + JSON.stringify(err));
      }
    });
  },

  // 3. 获取当前已连接 WiFi
  getConnectedWifi() {
    if (!this.data.isWifiStarted) {
      this.addLog('请先初始化 WiFi 模块');
      return;
    }
    wx.getConnectedWifi({
      success: (res) => {
        this.setData({ connectedWifi: res.wifi });
        this.addLog('getConnectedWifi 成功: ' + (res.wifi && res.wifi.SSID));
      },
      fail: (err) => {
        this.addLog('getConnectedWifi 失败: ' + JSON.stringify(err));
      }
    });
  },

  // 停止 WiFi 模块
  stopWifi() {
    if (!this.data.isWifiStarted) return;
    wx.stopWifi({
      success: () => {
        this.setData({ isWifiStarted: false, wifiList: [], connectedWifi: null });
        this.addLog('stopWifi 成功');
      },
      fail: (err) => {
        this.addLog('stopWifi 失败: ' + JSON.stringify(err));
      }
    });
  },

  // 清空日志
  clearLogs() {
    this.setData({ logs: [] });
  }
});
