Component({
  data: {
    selected: 0,
    color: '#999999',
    selectedColor: '#FF7A3D',
    list: [
      {
        pagePath: '/pages/device/device',
        text: '设备',
        emoji: '🐰'
      },
      {
        pagePath: '/pages/profile/profile',
        text: '我的',
        emoji: '👤'
      }
    ]
  },
  attached() {},
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset;
      const url = data.path;
      wx.switchTab({ url });
      this.setData({ selected: data.index });
    }
  }
});
