export interface DeviceState {
  type: string;

  macAddress: string;

  hue: number;

  sat: number;

  lum: number;

  tem: number;

  onOff: 0 | 1;
}
