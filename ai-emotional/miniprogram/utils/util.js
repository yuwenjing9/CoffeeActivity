function randomSn() {
  const chars = '0123456789ABCDEF';
  let s = 'LB';
  for (let i = 0; i < 12; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

function snTail(sn, n) {
  if (!sn) return '';
  n = n || 4;
  return sn.length > n ? sn.slice(-n) : sn;
}

function formatDate(d) {
  d = d || new Date();
  const pad = n => (n < 10 ? '0' + n : '' + n);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function is5GWifi(ssid) {
  if (!ssid) return false;
  return /5g/i.test(ssid);
}

function toast(title, icon) {
  wx.showToast({
    title: title || '',
    icon: icon || 'none',
    duration: 1800
  });
}

module.exports = {
  randomSn,
  snTail,
  formatDate,
  is5GWifi,
  toast
};