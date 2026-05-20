Component({
  properties: {
    steps: { type: Array, value: ['准备', '扫描', '配网', '完成'] },
    current: { type: Number, value: 1 }
  }
});
