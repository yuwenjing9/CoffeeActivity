Component({
  properties: {
    device: { type: Object, value: {} }
  },
  computed: {},
  methods: {
    onTap() {
      this.triggerEvent('tap', { device: this.data.device });
    },
    snTail(sn) {
      if (!sn) return '';
      return sn.length > 4 ? sn.slice(-4) : sn;
    },
    offlineText(device) {
      if (!device || device.status === 'online') return '';
      if (!device.lastOfflineTime) return '离线';
      const now = Date.now();
      const diff = now - device.lastOfflineTime;
      const minutes = Math.floor(diff / 60000);
      if (minutes < 1) return '刚刚离线';
      if (minutes < 60) return '离线 ' + minutes + '分钟';
      const hours = Math.floor(minutes / 60);
      if (hours < 24) return '离线 ' + hours + '小时';
      const days = Math.floor(hours / 24);
      return '离线 ' + days + '天';
    }
  }
});
