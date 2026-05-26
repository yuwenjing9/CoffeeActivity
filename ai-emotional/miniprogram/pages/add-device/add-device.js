const storage = require('../../utils/storage.js');
const util = require('../../utils/util.js');

// 配网执行步骤
const PROVISION_STEPS = [
  'BLE 安全通道已建立',
  'Wi-Fi 凭证已下发',
  '设备联网中...',
  '服务端绑定'
];

// ========== 配网模式开关 ==========
// true = 模拟模式（无真实设备时调试用，定时器模拟配网过程）
// false = 正式模式（走真实 BLE 配网，动态发现服务和特征值）
const PROVISION_MOCK = false;

// BLE 单包最大字节数（默认 MTU 20，协商后最大 512）
const BLE_MTU = 20;

// 系统保留 Service UUID（配网时跳过这些）
const SKIP_SERVICE_UUIDS = [
  '1800', // Generic Access
  '1801', // Generic Attribute
  '180F', // Battery Service
  '180A', // Device Information
  '181C', // User Data
  '181B', // Body Composition
];

Page({
  data: {
    step: 1,
    stepLabels: ['准备', '扫描', '配网', '完成'],

    // step1 - 准备
    showBleModal: false,
    isIOS: false,

    // step3 - 扫描 / 绑定失败
    showBindFail: false,
    scanning: false,
    scanned: [],
    selectedDevice: null,

    // step4 - 配网配置
    ssid: '',
    is5G: false,
    password: '',
    showPwd: false,
    hasSavedWifi: false,
    wifiList: [],
    showWifiList: false,
    wifiScanning: false,

    // step5 - 配网执行
    provisionSteps: PROVISION_STEPS.map((label, i) => ({
      label, status: i === 0 ? 'doing' : 'wait'
    })),
    provisionIndex: 0,
    remainingSeconds: 30,
    provisionFailed: false,

    // step6 - 成功
    newDevice: null,
    nickname: '小灵兔'
  },

  onLoad(opt) {
    this.setData({ isIOS: this._isIOS() });
    this._fromReconnect = false;
    this._reconnectDeviceId = '';
    if (opt && opt.from === 'reconnect' && opt.id) {
      this._fromReconnect = true;
      this._reconnectDeviceId = opt.id;
      const device = storage.getDeviceById(opt.id);
      if (device) {
        const wifi = device.wifi && device.wifi !== '-' ? device.wifi : '';
        const selectedDevice = {
          deviceId: device.bleDeviceId || '',
          name: device.nickname || '设备',
          sn: device.sn || '',
          model: device.model || 'LingTu-Mini',
          rssi: -50,
          rssiPercent: 83,
          localName: device.nickname || '设备'
        };
        this.setData({
          step: 4,
          selectedDevice,
          ssid: wifi,
          is5G: util.is5GWifi(wifi),
          showWifiList: !wifi
        });
        wx.setNavigationBarTitle({ title: '配置 Wi-Fi' });
        // 后台尝试连接 BLE
        this._connectBleForReconnect(selectedDevice.deviceId);
        // 如果没有已保存的 Wi-Fi，直接展示 Wi-Fi 列表
        if (!wifi) {
          this._getWifiList();
        }
      }
    }
  },

  onShow() {
    let title = '添加设备';
    if (this.data.step === 1) title = '添加小伙伴';
    if (this.data.step === 4) title = '配置 Wi-Fi';
    if (this.data.step === 5 && this.data.provisionFailed) title = '配网失败';
    if (this.data.step === 6) title = '绑定成功';
    if (this.data.showBindFail) title = '绑定失败';
    wx.setNavigationBarTitle({ title });
  },

  onUnload() {
    if (this._timer) clearTimeout(this._timer);
    if (this._scanTimer) clearTimeout(this._scanTimer);
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
      this._countdownTimer = null;
    }
    this._stopBleScan();
    this._offBluetoothDeviceFound();
    this._closeWifi();
    this._closeBleConnection();
    wx.offBLECharacteristicValueChange();
  },

  // ========== 步骤 1：准备 ==========
  onReadyNext() {
    this._openBluetoothAndLocation();
  },

  _isIOS() {
    const sysInfo = wx.getSystemInfoSync();
    return (sysInfo.platform || '').toLowerCase() === 'ios' || (sysInfo.system || '').toLowerCase().includes('ios');
  },

  /**
   * 统一蓝牙+定位授权入口
   * @param {Function} onSuccess - 蓝牙和定位都就绪后的回调（不传则默认进入扫描）
   * @param {Function} onAuthDeny - 授权被拒时的回调（不传则弹引导设置弹窗）
   */
  _openBluetoothAndLocation(onSuccess, onAuthDeny) {
    const successCb = onSuccess || (() => this._enterScan());
    wx.openBluetoothAdapter({
      success: () => {
        this.setData({ showBleModal: false });
        if (this._isIOS()) {
          successCb();
        } else {
          this._ensureLocation(successCb);
        }
      },
      fail: (err) => {
        if (err.errCode === 10004 || err.errno === 103) {
          // 蓝牙未授权
          if (onAuthDeny) {
            onAuthDeny();
          } else {
            this.setData({ showBleModal: true });
          }
        } else if (err.errCode === 10001) {
          this.setData({ showBleModal: false });
          wx.showModal({
            title: '提示',
            content: '请先开启手机蓝牙',
            showCancel: false
          });
        } else {
          this.setData({ showBleModal: false });
          util.toast('蓝牙初始化失败，请检查权限');
        }
      }
    });
  },

  _ensureLocation(callback) {
    wx.authorize({
      scope: 'scope.userLocation',
      success: () => callback && callback(),
      fail: () => {
        this._guideToSetting('定位');
      }
    });
  },

  // ========== 步骤 2：蓝牙权限 ==========
  onBleAgree() {
    storage.setAuthRevoked(false);
    // 用户已同意，再次尝试蓝牙，若仍被拒则引导去设置页
    this._openBluetoothAndLocation(null, () => {
      this._guideToSetting('蓝牙');
    });
  },
  onBleDeny() {
    this.setData({ showBleModal: false });
    util.toast('未授权蓝牙，无法继续配网');
  },

  _guideToSetting(permName) {
    this.setData({ showBleModal: false });
    wx.showModal({
      title: '授权提示',
      content: `需要开启${permName}权限才能扫描和连接设备，请在设置中开启`,
      confirmText: '去设置',
      success: (res) => {
        if (res.confirm) {
          wx.openSetting({
            success: () => {
              this._openBluetoothAndLocation();
            }
          });
        } else {
          util.toast('未授权蓝牙，无法继续配网');
        }
      }
    });
  },
  _enterScan() {
    this.setData({
      showBleModal: false,
      step: 3,
      scanning: true,
      scanned: [],
      showBindFail: false
    });
    this._startBleScan();
  },

  _onDeviceBound() {
    this.setData({ showBindFail: true });
    wx.setNavigationBarTitle({ title: '绑定失败' });
  },

  onBindFailBack() {
    this.setData({ showBindFail: false, scanned: [] });
    this.onRescan();
  },

  onViewUnbindGuide() {
    wx.showModal({
      title: '解绑指引',
      content: '请联系原主人打开小伙伴小程序，进入设备详情页，点击「解绑设备」后即可重新绑定。',
      showCancel: false
    });
  },

  // ========== 蓝牙扫描 ==========
  _startBleScan() {
    this._offBluetoothDeviceFound();

    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach((d) => {
        if (!d.name || d.name === '未知设备') return;
        const device = this._parseDevice(d);
        const list = this.data.scanned.slice();
        const exists = list.findIndex(item => item.deviceId === device.deviceId);
        if (exists >= 0) {
          list[exists] = device;
        } else {
          list.push(device);
        }
        list.sort((a, b) => b.rssi - a.rssi);
        this.setData({ scanned: list });
      });
    });

    // 先获取已缓存的设备
    wx.getBluetoothDevices({
      success: (res) => {
        if (res.devices && res.devices.length > 0) {
          const list = [];
          res.devices.forEach((d) => {
            if (!d.name || d.name === '未知设备') return;
            list.push(this._parseDevice(d));
          });
          list.sort((a, b) => b.rssi - a.rssi);
          if (list.length > 0) {
            this.setData({ scanned: list });
          }
        }
      }
    });

    // 开始扫描
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: () => {
        this._scanTimer = setTimeout(() => {
          this._stopBleScan();
          // 最后再取一次
          wx.getBluetoothDevices({
            success: (res) => {
              if (res.devices && res.devices.length > 0 && this.data.scanned.length === 0) {
                const list = [];
                res.devices.forEach((d) => {
                  if (!d.name || d.name === '未知设备') return;
                  list.push(this._parseDevice(d));
                });
                list.sort((a, b) => b.rssi - a.rssi);
                this.setData({ scanned: list });
              }
            }
          });
          this.setData({ scanning: false });
        }, 12000);
      },
      fail: (err) => {
        console.warn('蓝牙扫描失败', err);
        this.setData({ scanning: false });
        util.toast('蓝牙扫描失败，请检查权限');
      }
    });
  },

  _stopBleScan() {
    wx.stopBluetoothDevicesDiscovery({ success: () => {}, fail: () => {} });
  },

  _offBluetoothDeviceFound() {
    wx.offBluetoothDeviceFound();
  },

  _parseDevice(device) {
    const name = device.name || device.localName || '未知设备';
    const rssi = device.RSSI || -60;
    const rssiPercent = Math.min(100, Math.max(0, Math.round((rssi + 100) / 60 * 100)));
    let sn = '';
    let model = 'BLE 设备';
    if (name.startsWith('LB')) {
      if (name.includes('-')) {
        const tail = name.split('-')[1] || '';
        sn = 'LB23' + tail;
        model = tail.length >= 4 ? 'LingTu-Mini Pro' : 'LingTu-Mini';
      } else {
        sn = util.randomSn();
        model = 'LingTu-Mini';
      }
    } else {
      sn = util.randomSn();
    }
    return {
      deviceId: device.deviceId,
      name: name,
      sn: sn,
      model: model,
      rssi: rssi,
      rssiPercent: rssiPercent,
      localName: device.localName || name
    };
  },

  // ========== 步骤 3：扫描 ==========
  // 从 reconnect 跳转时后台连接 BLE
  _connectBleForReconnect(bleDeviceId) {
    if (!bleDeviceId) return;
    wx.openBluetoothAdapter({
      success: () => {
        wx.createBLEConnection({
          deviceId: bleDeviceId,
          timeout: 10000,
          success: () => {
            console.log('重连 BLE 成功');
          },
          fail: (err) => {
            console.warn('重连 BLE 失败', err);
          }
        });
      },
      fail: () => {
        console.warn('重连：蓝牙适配器打开失败');
      }
    });
  },

  onRescan() {
    this.setData({ scanning: true, scanned: [] });
    this._startBleScan();
  },

  onPickDevice(e) {
    const idx = e.currentTarget.dataset.idx;
    const dev = this.data.scanned[idx];
    console.log('selectedDevice111', dev);
    if (!dev) return;

    this._stopBleScan();
    this._offBluetoothDeviceFound();
    this.setData({ scanning: false, selectedDevice: dev });

    // BLE 连接
    wx.showLoading({ title: '正在连接...', mask: true });
    wx.createBLEConnection({
      deviceId: dev.deviceId,
      timeout: 10000,
      success: () => {
        wx.hideLoading();
        // TODO: 实际应调用后端接口检查设备是否已被其他账号绑定
        // const isBound = await checkDeviceBound(dev.sn);
        // if (isBound) {
        //   wx.closeBLEConnection({ deviceId: dev.deviceId });
        //   this._onDeviceBound();
        //   return;
        // }
        this._enterWifiConfig();
        util.toast('已连接 ' + dev.name, 'success');
      },
      fail: (err) => {
        wx.hideLoading();
        console.warn('蓝牙连接失败', err);
        util.toast('连接失败，请重试');
      }
    });
  },

  // ========== 步骤 4：配网配置 ==========
  _enterWifiConfig() {
    this.setData({ step: 4 });
    wx.setNavigationBarTitle({ title: '配置 Wi-Fi' });
    this._readDeviceWifi();
  },

  // 读取设备已保存的 Wi-Fi（通过 BLE 读取，暂无则获取附近 Wi-Fi）
  _readDeviceWifi() {
    // TODO: 通过 BLE service/characteristic 读取设备已保存的 Wi-Fi
    // 目前设备端协议未实现，默认没有已保存的 Wi-Fi
    this.setData({ hasSavedWifi: false, showWifiList: true });
    this._getWifiList();
  },

  // 获取附近 Wi-Fi 列表（真实 API）
  _getWifiList() {
    this.setData({ wifiScanning: true, wifiList: [] });

    // iOS 调用 getWifiList 会跳转系统设置，先弹框提示用户
    const sysInfo = wx.getSystemInfoSync();
    const isIOS = (sysInfo.platform || '').toLowerCase() === 'ios' || (sysInfo.system || '').toLowerCase().includes('ios');
    if (isIOS) {
      wx.showModal({
        title: '获取 Wi-Fi 列表',
        content: 'iOS系统需要您手动操作：\n\n1. 点击"确定"后跳转到设置页\n2. 需要您手动进入设置中的"无线局域网"\n3. 等待Wi-Fi列表加载完成\n4. 返回小程序即可自动获取列表',
        confirmText: '确定',
        cancelText: '取消',
        success: (modalRes) => {
          if (modalRes.confirm) {
            this._doGetWifiList();
          } else {
            this.setData({ wifiScanning: false });
          }
        }
      });
      return;
    }

    this._doGetWifiList();
  },

  // 实际执行 Wi-Fi 列表获取
  _doGetWifiList() {

    // 初始化 Wi-Fi 模块
    wx.startWifi({
      success: () => {
        // 先获取当前手机连接的 Wi-Fi
        wx.getConnectedWifi({
          success: (connectedRes) => {
            const connectedWifi = connectedRes.wifi;
            this._listenWifiList(connectedWifi);
          },
          fail: () => {
            this._listenWifiList(null);
          }
        });
      },
      fail: (err) => {
        console.warn('Wi-Fi 模块初始化失败', err);
        this.setData({ wifiScanning: false });
        util.toast('Wi-Fi 初始化失败');
      }
    });
  },

  // 注册 Wi-Fi 列表监听（先移除旧监听，避免重复）
  _listenWifiList(connectedWifi) {
    // 先移除旧的监听，防止重复注册
    wx.offGetWifiList();

    wx.onGetWifiList((res) => {
      console.log('[WiFi] onGetWifiList 回调, 数量:', (res.wifiList || []).length);
      const rawList = res.wifiList || [];
      // 按 BSSID+SSID 去重
      const seen = new Set();
      const wifiList = rawList
        .filter(w => w.SSID && w.SSID.length > 0)
        .filter(w => {
          const key = w.SSID + '_' + (w.BSSID || '');
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        })
        .sort((a, b) => (b.signalStrength || 0) - (a.signalStrength || 0))
        .map(w => ({
          ssid: w.SSID,
          bssid: w.BSSID || '',
          signalStrength: w.signalStrength || 0,
          secure: w.secure,
          is5G: util.is5GWifi(w.SSID)
        }));

      // 将已连接的 Wi-Fi 排到最前面
      if (connectedWifi && connectedWifi.SSID) {
        const idx = wifiList.findIndex(w => w.ssid === connectedWifi.SSID);
        if (idx > 0) {
          const item = wifiList.splice(idx, 1)[0];
          item.connected = true;
          wifiList.unshift(item);
        } else if (idx === 0) {
          wifiList[0].connected = true;
        }
      }

      this.setData({ wifiList, wifiScanning: false });
    });

    // 获取 Wi-Fi 列表
    wx.getWifiList({
      fail: (err) => {
        console.warn('获取 Wi-Fi 列表失败', err);
        this.setData({ wifiScanning: false });
        // iOS 不支持 getWifiList，使用 getConnectedWifi 兜底
        if (connectedWifi && connectedWifi.SSID) {
          this.setData({
            wifiList: [{
              ssid: connectedWifi.SSID,
              bssid: connectedWifi.BSSID || '',
              signalStrength: 90,
              secure: true,
              is5G: util.is5GWifi(connectedWifi.SSID),
              connected: true
            }],
            wifiScanning: false
          });
        }
      }
    });
  },

  _closeWifi() {
    wx.stopWifi({ success: () => {}, fail: () => {} });
  },

  _closeBleConnection() {
    const deviceId = this.data.selectedDevice?.deviceId || this._reconnectDeviceId;
    if (deviceId) {
      wx.closeBLEConnection({ deviceId, success: () => {}, fail: () => {} });
    }
  },

  // 选择 Wi-Fi
  onSelectWifi(e) {
    const idx = e.currentTarget.dataset.idx;
    const wifi = this.data.wifiList[idx];
    if (!wifi) return;
    this.setData({
      ssid: wifi.ssid,
      is5G: wifi.is5G,
      showWifiList: false,
      password: ''
    });
  },

  // 切换 Wi-Fi
  onSwitchWifi() {
    this.setData({ showWifiList: true, password: '' });
    this._getWifiList();
  },

  onPwdInput(e) {
    this.setData({ password: e.detail.value });
  },
  onTogglePwd() {
    this.setData({ showPwd: !this.data.showPwd });
  },
  onStartProvision() {
    if (!this.data.ssid) {
      util.toast('请选择 Wi-Fi');
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
      remainingSeconds: 30,
      provisionFailed: false
    });

    this._countdownTimer = setInterval(() => {
      const rs = this.data.remainingSeconds - 1;
      if (rs <= 0) {
        clearInterval(this._countdownTimer);
        this._countdownTimer = null;
        if (this.data.provisionIndex < PROVISION_STEPS.length) {
          console.log('超时', this.data.provisionIndex < PROVISION_STEPS.length);
          this._onProvisionFail();
        }
      }
      this.setData({ remainingSeconds: rs > 0 ? rs : 0 });
    }, 1000);

    this._runProvision();
  },

  // ========== 步骤 5：配网执行 ==========
  _runProvision() {
    if (PROVISION_MOCK) {
      this._runProvisionMock();
    } else {
      this._runProvisionReal();
    }
  },

  // 模拟配网（开发调试用）
  _runProvisionMock() {
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
      this._runProvisionMock();
    }, 1500 + Math.random() * 800);
  },

  // 真实 BLE 配网
  _runProvisionReal() {
    const deviceId = this.data.selectedDevice?.deviceId;
    console.log('[配网] _runProvisionReal 开始, deviceId:', deviceId);
    if (!deviceId) {
      console.error('[配网] deviceId 为空，配网失败');
      this._onProvisionFail();
      return;
    }

    // 步骤0: BLE 安全通道已建立（在 onPickDevice 已完成连接）
    this._markStepDone(0);

    // 步骤1~3: 发现服务 → 下发凭证 → 等待设备结果
    this._bleStartProvision(deviceId);
  },

  _markStepDone(index) {
    const arr = this.data.provisionSteps.slice();
    if (index < arr.length) {
      arr[index].status = 'done';
      if (index + 1 < arr.length) arr[index + 1].status = 'doing';
    }
    this.setData({
      provisionSteps: arr,
      provisionIndex: index + 1
    });
  },

  _bleStartProvision(deviceId) {
    console.log('[配网] _bleStartProvision 开始, deviceId:', deviceId);
    // 发现 Wi-Fi 配网服务和特征值
    this._bleDiscoverWifiService(deviceId, (err, serviceInfo) => {
      if (err) {
        console.error('[配网] 发现 BLE 服务失败', err);
        this._onProvisionFail();
        return;
      }
      console.log('[配网] 发现服务成功:', serviceInfo);
      const { serviceId, writeChar, notifyChar } = serviceInfo;
      this._wifiServiceId = serviceId;
      this._wifiWriteChar = writeChar;
      this._wifiNotifyChar = notifyChar;

      // 开启 notify 监听设备返回
      this._bleEnableNotify(deviceId, serviceId, notifyChar, (err2) => {
        if (err2) {
          console.error('[配网] 开启 BLE notify 失败', err2);
          this._onProvisionFail();
          return;
        }
        console.log('[配网] notify 开启成功，先注册回调再发送凭证');

        // 先注册回调，避免设备快速回复时漏收 notify
        this._bleWaitProvisionResult((err4, result) => {
          if (err4 || !result || !result.success) {
            console.error('[配网] 设备配网失败', err4, result);
            this._onProvisionFail();
            return;
          }

          this._markStepDone(2);
          this._markStepDone(3);
          this._onProvisionDone();
        });

        // 再发送 Wi-Fi 凭证
        this._bleSendWifiCredentials(deviceId, serviceId, writeChar, (err3) => {
          if (err3) {
            console.error('[配网] 发送 Wi-Fi 凭证失败', err3);
            this._onProvisionFail();
            return;
          }

          console.log('[配网] Wi-Fi 凭证发送成功，等待设备返回结果');
          this._markStepDone(1);
        });
      });
    });
  },

  _bleDiscoverWifiService(deviceId, callback) {
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => {
        const services = res.services || [];
        if (services.length === 0) {
          callback(new Error('设备未暴露任何 BLE 服务'));
          return;
        }

        // 过滤掉系统保留服务，逐个扫描自定义服务
        const customServices = services.filter(s => {
          const short = s.uuid.replace(/-/g, '').slice(4, 8).toUpperCase();
          return !SKIP_SERVICE_UUIDS.includes(short);
        });

        const candidates = customServices.length > 0 ? customServices : services;
        this._scanServiceChars(deviceId, candidates, 0, null, callback);
      },
      fail: (err) => callback(err)
    });
  },

  // 递归扫描每个服务的特征值，找到含 write + notify 的服务
  _scanServiceChars(deviceId, services, idx, best, callback) {
    if (idx >= services.length) {
      if (best) {
        callback(null, best);
      } else {
        callback(new Error('未找到配网服务（需要同时含 write 和 notify 特征值）'));
      }
      return;
    }

    const svc = services[idx];
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId: svc.uuid,
      success: (charRes) => {
        const chars = charRes.characteristics || [];
        const writeChar = chars.find(c => c.properties.write || c.properties.writeNoResponse);
        const notifyChar = chars.find(c => c.properties.notify);

        if (writeChar && notifyChar) {
          // 找到同时有 write + notify 的服务，直接使用
          console.log('[配网] 发现配网服务:', svc.uuid, 'write:', writeChar.uuid, 'notify:', notifyChar.uuid);
          callback(null, {
            serviceId: svc.uuid,
            writeChar: writeChar.uuid,
            notifyChar: notifyChar.uuid
          });
        } else {
          // 继续扫描下一个服务
          this._scanServiceChars(deviceId, services, idx + 1, best, callback);
        }
      },
      fail: () => {
        this._scanServiceChars(deviceId, services, idx + 1, best, callback);
      }
    });
  },

  _bleEnableNotify(deviceId, serviceId, characteristicId, callback) {
    wx.onBLECharacteristicValueChange((res) => {
      this._onBleProvisionNotify(res);
    });
    wx.notifyBLECharacteristicValueChange({
      deviceId,
      serviceId,
      characteristicId,
      state: true,
      success: () => callback(null),
      fail: (err) => callback(err)
    });
  },

  _bleSendWifiCredentials(deviceId, serviceId, characteristicId, callback) {
    // 数据格式可根据设备协议调整（JSON / protobuf / 自定义二进制）
    const payload = JSON.stringify({
      ssid: this.data.ssid,
      password: this.data.password,
      security: 'WPA2'
    });
    console.log('[配网] 发送凭证 payload:', payload);
    const buffer = this._stringToArrayBuffer(payload);
    const totalLen = buffer.byteLength;
    let offset = 0;

    const sendNext = () => {
      if (offset >= totalLen) {
        console.log('[配网] 所有数据包发送完毕');
        callback(null);
        return;
      }
      const chunk = buffer.slice(offset, Math.min(offset + BLE_MTU, totalLen));
      wx.writeBLECharacteristicValue({
        deviceId,
        serviceId,
        characteristicId,
        value: chunk,
        success: () => {
          offset += BLE_MTU;
          setTimeout(sendNext, 50);
        },
        fail: (err) => {
          console.error('[配网] writeBLECharacteristicValue 失败', err);
          callback(err);
        }
      });
    };
    sendNext();
  },

  _bleWaitProvisionResult(callback) {
    console.log('[配网] 开始等待设备返回配网结果...');
    this._provisionCallback = callback;
  },

  _onBleProvisionNotify(res) {
    const value = this._arrayBufferToString(res.value);
    console.log('[配网] BLE notify 收到数据:', value);
    let result;
    try {
      result = JSON.parse(value);
    } catch (e) {
      result = { code: -1, msg: value };
    }
    if (this._provisionCallback) {
      const cb = this._provisionCallback;
      this._provisionCallback = null;
      if (result.code === 0 || result.success === true) {
        cb(null, { success: true });
      } else {
        cb(null, { success: false, reason: result.msg || result.reason || '配网失败' });
      }
    }
  },

  _stringToArrayBuffer(str) {
    const buf = new ArrayBuffer(str.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < str.length; i++) {
      view[i] = str.charCodeAt(i) & 0xff;
    }
    return buf;
  },

  _arrayBufferToString(buf) {
    const view = new Uint8Array(buf);
    let str = '';
    for (let i = 0; i < view.length; i++) {
      str += String.fromCharCode(view[i]);
    }
    return str;
  },

  _onProvisionDone() {
    if (this._countdownTimer) {
      clearInterval(this._countdownTimer);
      this._countdownTimer = null;
    }

    const dev = this.data.selectedDevice;
    if (!dev) return;

    const newDevice = {
      id: 'd' + Date.now(),
      nickname: '小灵兔',
      sn: dev.sn || util.randomSn(),
      model: dev.model || 'LingTu-Mini',
      bleDeviceId: dev.deviceId || '',
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

  _onProvisionFail() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
    this.setData({ provisionFailed: true });
    wx.setNavigationBarTitle({ title: '配网失败' });
  },

  onRetryProvision() {
    this.setData({
      provisionFailed: false,
      step: 4,
      password: '',
      showWifiList: false
    });
    wx.setNavigationBarTitle({ title: '配置 Wi-Fi' });
  },

  onViewHelp() {
    wx.showModal({
      title: '配网帮助',
      content: '1. 请检查 Wi-Fi 密码是否正确\n2. 将设备靠近路由器 1 米以内\n3. 尝试重启路由器后再进行配网',
      showCancel: false
    });
  },

  // ========== 步骤 6：成功 ==========
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },
  onFinish() {
    if (this._fromReconnect && this._reconnectDeviceId) {
      // 从 reconnect 进入，更新已有设备
      storage.updateDevice(this._reconnectDeviceId, {
        wifi: this.data.ssid,
        status: 'online'
      });
      util.toast('配网成功', 'success');
      setTimeout(() => {
        wx.navigateBack({ delta: 2 });
      }, 600);
    } else {
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
  }
});
