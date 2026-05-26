/**
 * BLE 设备管理模块
 * 负责连接已绑定设备、读取电量/在线状态等
 */

const storage = require('./storage.js');

/**
 * 计算离线时长文案
 */
function formatOfflineTime(lastOfflineTime) {
  if (!lastOfflineTime) return '离线';
  const now = Date.now();
  const diff = now - lastOfflineTime;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚离线';
  if (minutes < 60) return '离线 ' + minutes + '分钟';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return '离线 ' + hours + '小时';
  const days = Math.floor(hours / 24);
  return '离线 ' + days + '天';
}

/**
 * 给设备对象补充 offlineText 字段
 */
function enrichDevice(device) {
  const d = Object.assign({}, device);
  if (d.status === 'online') {
    d.offlineText = '';
    delete d.lastOfflineTime;
  } else {
    d.offlineText = formatOfflineTime(d.lastOfflineTime);
  }
  return d;
}

// BLE 超时时间
const CONNECT_TIMEOUT = 8000;
const READ_TIMEOUT = 5000;

// 适配器是否已打开
let _adapterOpened = false;
// 当前已连接的设备 ID
let _connectedDeviceId = null;

/**
 * 打开蓝牙适配器（幂等，已打开则直接返回）
 */
function openAdapter() {
  if (_adapterOpened) return Promise.resolve();
  return new Promise((resolve, reject) => {
    wx.openBluetoothAdapter({
      success: () => {
        _adapterOpened = true;
        resolve();
      },
      fail: (err) => {
        // 适配器可能已经打开但状态不同步，尝试关闭后重新打开
        if (err.errCode === 10001 || err.errMsg.indexOf('already') > -1) {
          wx.closeBluetoothAdapter({
            complete: () => {
              wx.openBluetoothAdapter({
                success: () => {
                  _adapterOpened = true;
                  resolve();
                },
                fail: reject
              });
            }
          });
        } else {
          reject(err);
        }
      }
    });
  });
}

/**
 * 关闭蓝牙适配器
 */
function closeAdapter() {
  return new Promise((resolve) => {
    wx.closeBluetoothAdapter({
      success: () => {
        _adapterOpened = false;
        _connectedDeviceId = null;
        resolve();
      },
      fail: () => {
        // 即使关闭失败也重置状态，避免状态不同步
        _adapterOpened = false;
        _connectedDeviceId = null;
        resolve();
      }
    });
  });
}

/**
 * 连接 BLE 设备
 */
function createConnection(deviceId) {
  return new Promise((resolve, reject) => {
    wx.createBLEConnection({
      deviceId,
      timeout: CONNECT_TIMEOUT,
      success: (res) => {
        _connectedDeviceId = deviceId;
        resolve(res);
      },
      fail: (err) => {
        _connectedDeviceId = null;
        reject(err);
      }
    });
  });
}

/**
 * 断开 BLE 连接
 */
function closeConnection(deviceId) {
  if (!deviceId) return Promise.resolve();
  return new Promise((resolve) => {
    wx.closeBLEConnection({
      deviceId,
      success: () => {
        if (_connectedDeviceId === deviceId) {
          _connectedDeviceId = null;
        }
        resolve();
      },
      fail: () => resolve()
    });
  });
}

/**
 * 连接单个设备（自动管理断开旧连接）
 * 连接失败时会尝试先扫描再连接
 */
function connectDevice(bleDeviceId) {
  return new Promise(async (resolve, reject) => {
    try {
      // 如果已连接同一设备，直接返回
      if (_connectedDeviceId === bleDeviceId) {
        resolve();
        return;
      }
      // 先断开旧连接
      if (_connectedDeviceId) {
        await closeConnection(_connectedDeviceId);
      }
      await createConnection(bleDeviceId);
      resolve();
    } catch (firstErr) {
      // 直接连接失败，尝试扫描发现设备后再连接
      console.log('[BLE] 直接连接失败，尝试扫描后重连...', firstErr.errMsg || firstErr.message);
      try {
        await _scanAndConnect(bleDeviceId);
        resolve();
      } catch (scanErr) {
        reject(scanErr);
      }
    }
  });
}

/**
 * 扫描并连接指定设备
 */
function _scanAndConnect(bleDeviceId) {
  return new Promise((resolve, reject) => {
    let found = false;
    const scanTimeout = setTimeout(() => {
      wx.stopBluetoothDevicesDiscovery({ success: () => {}, fail: () => {} });
      wx.offBluetoothDeviceFound();
      if (!found) {
        reject(new Error('扫描超时未发现设备'));
      }
    }, 5000);

    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach((d) => {
        if (d.deviceId === bleDeviceId) {
          found = true;
          clearTimeout(scanTimeout);
          wx.stopBluetoothDevicesDiscovery({ success: () => {}, fail: () => {} });
          wx.offBluetoothDeviceFound();
          // 扫描发现了设备，再尝试连接
          createConnection(bleDeviceId).then(resolve).catch(reject);
        }
      });
    });

    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      fail: (err) => {
        clearTimeout(scanTimeout);
        wx.offBluetoothDeviceFound();
        reject(err);
      }
    });
  });
}

/**
 * 获取设备服务列表
 */
function getServices(deviceId) {
  return new Promise((resolve, reject) => {
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => resolve(res.services || []),
      fail: reject
    });
  });
}

/**
 * 获取服务下的特征值列表
 */
function getCharacteristics(deviceId, serviceId) {
  return new Promise((resolve, reject) => {
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: (res) => resolve(res.characteristics || []),
      fail: reject
    });
  });
}

/**
 * 读取特征值
 */
function readCharacteristic(deviceId, serviceId, characteristicId) {
  return new Promise((resolve, reject) => {
    wx.readBLECharacteristicValue({
      deviceId,
      serviceId,
      characteristicId,
      success: resolve,
      fail: reject
    });
  });
}

/**
 * 订阅特征值变化通知
 */
function enableNotify(deviceId, serviceId, characteristicId) {
  return new Promise((resolve, reject) => {
    wx.notifyBLECharacteristicValueChange({
      deviceId,
      serviceId,
      characteristicId,
      state: true,
      success: resolve,
      fail: reject
    });
  });
}

/**
 * 读取设备电量（通过 Battery Service 0x180F / 0x2A19）
 */
function readBattery(deviceId) {
  return new Promise(async (resolve) => {
    try {
      const services = await getServices(deviceId);

      // 查找 Battery Service (0x180F)
      let batteryService = services.find(s => {
        const short = s.uuid.replace(/-/g, '').slice(4, 8).toUpperCase();
        return short === '180F';
      });

      if (!batteryService) {
        // 没有标准电池服务，尝试自定义服务中可读特征
        const customServices = services.filter(s => {
          const short = s.uuid.replace(/-/g, '').slice(4, 8).toUpperCase();
          return !['1800', '1801', '180A', '181C', '181B'].includes(short);
        });
        for (const svc of customServices) {
          try {
            const chars = await getCharacteristics(deviceId, svc.uuid);
            if (chars.find(c => c.properties.read)) {
              batteryService = svc;
              break;
            }
          } catch (e) { continue; }
        }
      }

      if (!batteryService) {
        console.log('[BLE] 设备无电池服务，跳过电量读取');
        resolve(null);
        return;
      }

      const chars = await getCharacteristics(deviceId, batteryService.uuid);

      // 优先找标准电量特征 2A19
      let batteryChar = chars.find(c => {
        const short = c.uuid.replace(/-/g, '').slice(4, 8).toUpperCase();
        return short === '2A19';
      });
      // 兜底：任何可读特征
      if (!batteryChar) {
        batteryChar = chars.find(c => c.properties.read);
      }

      if (!batteryChar) {
        resolve(null);
        return;
      }

      // 监听特征值变化（readBLECharacteristicValue 会触发此回调）
      let resolved = false;
      const done = (value) => {
        if (resolved) return;
        resolved = true;
        resolve(value);
      };

      wx.onBLECharacteristicValueChange((res) => {
        const charId = (batteryChar.uuid || batteryChar).replace(/-/g, '').toUpperCase();
        const resId = (res.characteristicId || '').replace(/-/g, '').toUpperCase();
        if (resId === charId) {
          const view = new Uint8Array(res.value);
          if (view.length > 0) {
            done(view[0]); // 电量百分比
          }
        }
      });

      // 如果有 notify 特征，先开启
      const notifyChar = chars.find(c => c.properties.notify);
      if (notifyChar) {
        try { await enableNotify(deviceId, batteryService.uuid, notifyChar.uuid); } catch (e) {}
      }

      // 读取电量
      try {
        await readCharacteristic(deviceId, batteryService.uuid, batteryChar.uuid);
        // 等待 onBLECharacteristicValueChange 回调，3 秒超时
        setTimeout(() => done(null), 3000);
      } catch (e) {
        done(null);
      }
    } catch (e) {
      console.warn('[BLE] 读取电量失败', e);
      resolve(null);
    }
  });
}

/**
 * 批量检查所有已绑定设备的在线状态和电量
 * 通过 BLE 逐个连接设备，连接成功即为在线
 * @returns {Promise<Array>} - 返回更新后的设备列表
 */
function checkAllDevices() {
  return new Promise(async (resolve) => {
    const devices = storage.getDevices() || [];
    if (devices.length === 0) {
      resolve([]);
      return;
    }

    const results = [];

    try {
      await openAdapter();
    } catch (e) {
      console.warn('[BLE] 打开蓝牙适配器失败，所有设备标记为离线', e);
      devices.forEach(d => {
        const offline = Object.assign({}, d, { status: 'offline' });
        if (d.status === 'online' || !d.lastOfflineTime) {
          offline.lastOfflineTime = Date.now();
        }
        results.push(enrichDevice(offline));
      });
      storage.setDevices(results);
      resolve(results);
      return;
    }

    for (const device of devices) {
      if (!device.bleDeviceId) {
        const offline = Object.assign({}, device, { status: 'offline' });
        if (device.status === 'online' || !device.lastOfflineTime) {
          offline.lastOfflineTime = Date.now();
        }
        results.push(enrichDevice(offline));
        continue;
      }

      try {
        await connectDevice(device.bleDeviceId);
        console.log('[BLE] 设备在线:', device.nickname, device.bleDeviceId);

        // 在线，尝试读取电量
        const battery = await readBattery(device.bleDeviceId);
        const updated = Object.assign({}, device, { status: 'online' });
        delete updated.lastOfflineTime;
        if (battery !== null && battery !== undefined) {
          updated.battery = battery;
          console.log('[BLE] 电量:', battery + '%');
        }
        results.push(enrichDevice(updated));
      } catch (e) {
        console.log('[BLE] 设备离线:', device.nickname, e.errMsg || e.message);
        const offline = Object.assign({}, device, { status: 'offline' });
        // 只在从在线变离线时记录时间
        if (device.status === 'online' || !device.lastOfflineTime) {
          offline.lastOfflineTime = Date.now();
        }
        results.push(enrichDevice(offline));
      }
    }

    // 清理：断开最后的连接，关闭适配器
    if (_connectedDeviceId) {
      await closeConnection(_connectedDeviceId);
    }
    await closeAdapter();

    // 保存更新后的设备数据
    storage.setDevices(results);
    resolve(results);
  });
}

/**
 * 刷新单个设备的 BLE 状态并更新 storage
 * @param {string} deviceId - 内部设备 ID
 * @returns {Promise<Object|null>} - 更新后的设备对象
 */
function refreshDevice(deviceId) {
  return new Promise(async (resolve) => {
    const device = storage.getDeviceById(deviceId);
    if (!device || !device.bleDeviceId) {
      resolve(device);
      return;
    }

    try {
      await openAdapter();
      await connectDevice(device.bleDeviceId);

      const battery = await readBattery(device.bleDeviceId);
      const patch = { status: 'online' };
      delete patch.lastOfflineTime;
      if (battery !== null && battery !== undefined) {
        patch.battery = battery;
      }

      await closeConnection(device.bleDeviceId);
      await closeAdapter();

      const updated = storage.updateDevice(deviceId, patch);
      resolve(enrichDevice(updated));
    } catch (e) {
      console.log('[BLE] 设备离线:', device.nickname, e.errMsg || e.message);

      await closeAdapter();

      const patch = { status: 'offline' };
      if (device.status === 'online' || !device.lastOfflineTime) {
        patch.lastOfflineTime = Date.now();
      }
      const updated = storage.updateDevice(deviceId, patch);
      resolve(enrichDevice(updated));
    }
  });
}

module.exports = {
  openAdapter,
  closeAdapter,
  createConnection,
  closeConnection,
  connectDevice,
  getServices,
  getCharacteristics,
  readCharacteristic,
  enableNotify,
  readBattery,
  checkAllDevices,
  refreshDevice
};
