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
    }
  }
});
