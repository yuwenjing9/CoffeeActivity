Component({
  properties: {
    visible: { type: Boolean, value: false }
  },
  data: {
    checked: true
  },
  methods: {
    onToggle() {
      this.setData({ checked: !this.data.checked });
    },
    onDisagree() {
      this.triggerEvent('disagree');
    },
    onAgree() {
      if (!this.data.checked) {
        wx.showToast({ title: '请先勾选同意协议', icon: 'none' });
        return;
      }
      this.triggerEvent('agree');
    },
    onLink(e) {
      const type = e.currentTarget.dataset.type;
      wx.navigateTo({
        url: `/pages/webview/webview?type=${type}`
      });
    },
    stop() {}
  }
});
