module.exports = function (nodecg) {
  nodecg.Replicant('lowerthird_line1', { defaultValue: 'Your Name' });
  nodecg.Replicant('lowerthird_line2', { defaultValue: 'Your Title' });
  nodecg.Replicant('lowerthird_posBottom', { defaultValue: 40 });
  nodecg.Replicant('lowerthird_posLeft', { defaultValue: 40 });
  nodecg.Replicant('lowerthird_bgOpacity', { defaultValue: 0.7 });

  nodecg.Replicant('lowerthird_line1FontSize', { defaultValue: 28 });
  nodecg.Replicant('lowerthird_line2FontSize', { defaultValue: 20 });
  nodecg.Replicant('lowerthird_line1Color', { defaultValue: '#FFFFFF' });
  nodecg.Replicant('lowerthird_line2Color', { defaultValue: '#FFFFFF' });

  nodecg.Replicant('lowerthird_visible', { defaultValue: true });
};
