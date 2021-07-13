import React from 'reactn';
import type { DeviceState } from '../../../src/device-state';
import { showInfo } from '../helpers/toast';

export class DeviceService {
  useNotificationDeviceState(): [(state: DeviceState) => void] {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const handleGetDeviceState = React.useCallback((state: DeviceState) => {
      if (state) {
        if (state?.type === 'hsl') {
          showInfo(
            `Thiết bị ${state?.macAddress} đã thay đổi hue: ${state?.hue} lum: ${state.lum} sat ${state.sat}`
          );
        } else {
          if (state?.type === 'tem') {
            showInfo(
              `Thiết bị ${state?.macAddress} đã thay đổi temp: ${state?.tem}`
            );
          } else {
            if (state?.type === 'lum') {
              showInfo(
                `Thiết bị ${state?.macAddress} đã thay đổi lum: ${state?.lum}`
              );
            } else {
              if (state?.type === 'onOff') {
                showInfo(
                  `Thiết bị ${state?.macAddress} đã ${
                    state?.onOff === 0 ? 'off' : 'on'
                  }`
                );
              } else {
                showInfo(`Thiết bị ${state?.macAddress} đã ${state?.type}`);
              }
            }
          }
        }
      }
    }, []);

    return [handleGetDeviceState];
  }
}

export const deviceService: DeviceService = new DeviceService();
