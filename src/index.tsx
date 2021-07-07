import type { HSL } from 'colorsys';
import { NativeEventEmitter, NativeModules } from 'react-native';
import { BleEvent } from './ble-event';
import type { BluetoothState } from './bluetooth-state';
import type { BoundDevice } from './bound-device';
import { NATIVE_MODULE_NAME } from './config';
import type { Device } from './device';
import type { NodeInfo } from './node-info';
import type { TelinkBleNativeModule } from './telink-ble-native-module';

const TelinkBleModule: TelinkBleNativeModule =
  NativeModules[NATIVE_MODULE_NAME];

class TelinkBle implements TelinkBleNativeModule {
  private eventEmitter: NativeEventEmitter;

  public constructor() {
    this.eventEmitter = new NativeEventEmitter();
  }

  public setOnOff(address: number, onOff: 0 | 1): void {
    TelinkBleModule.setOnOff(address, onOff);
  }

  public setAllOn(): void {
    TelinkBleModule.setAllOn();
  }

  public setAllOff(): void {
    TelinkBleModule.setAllOff();
  }

  public startScanning() {
    return TelinkBleModule.startScanning();
  }

  public stopScanning() {
    return TelinkBleModule.stopScanning();
  }

  public initMeshService() {
    TelinkBleModule.initMeshService();
  }

  public checkBluetoothPermission(): Promise<BluetoothState> {
    return TelinkBleModule.checkBluetoothPermission();
  }

  public startProvisioning(deviceUUID: string): Promise<number> {
    return TelinkBleModule.startProvisioning(deviceUUID);
  }

  public getNodes(): Promise<NodeInfo[]> {
    return TelinkBleModule.getNodes();
  }

  public autoConnect() {
    TelinkBleModule.autoConnect();
  }

  public setLuminance(address: number, luminance: number): void {
    TelinkBleModule.setLuminance(address, luminance);
  }

  public setTemp(address: number, temp: number): void {
    TelinkBleModule.setTemp(address, temp);
  }

  public setHsl(address: number, hsl: HSL): void {
    TelinkBleModule.setHsl(address, hsl);
  }

  public addDeviceToGroup(groupId: number, deviceId: number): void {
    TelinkBleModule.addDeviceToGroup(groupId, deviceId);
  }

  public removeDeviceFromGroup(groupId: number, deviceId: number): void {
    TelinkBleModule.removeDeviceFromGroup(groupId, deviceId);
  }

  public setSceneForDevice(sceneId: number, deviceId: number): void {
    TelinkBleModule.setSceneForDevice(sceneId, deviceId);
  }

  public setSceneForListDevice(sceneId: number, nodeList: NodeInfo[]): void {
    TelinkBleModule.setSceneForListDevice(sceneId, nodeList);
  }

  public onStartScene(sceneId: number): void {
    TelinkBleModule.onStartScene(sceneId);
  }

  public deleteScene(sceneId: number): void {
    TelinkBleModule.deleteScene(sceneId);
  }

  public removeSceneFromDevice(sceneId: number, deviceId: number): void {
    TelinkBleModule.removeSceneFromDevice(sceneId, deviceId);
  }

  public setSceneForController(
    deviceId: number,
    mode: number,
    sceneId: number
  ): void {
    TelinkBleModule.setSceneForController(deviceId, mode, sceneId);
  }

  public kickOut(deviceId: number): void {
    TelinkBleModule.kickOut(deviceId);
  }

  /**
   * Add BLE event listener
   * @param event {BleEvent} - BLE event
   * @param listener {(data: any) => void | Promise<void>} - callback function
   *
   * @return {() => void} - the unsubscribe function
   */
  public addEventListener(
    event: BleEvent,
    listener: (data: any) => void | Promise<void>
  ) {
    this.eventEmitter.addListener(event, listener);

    return () => {
      this.eventEmitter.removeListener(event, listener);
    };
  }

  /**
   * On device found handler
   *
   * @param listener {(device: Device) => void | Promise<void>} - device found handler function
   * @return {() => void} - function to unsubscribe
   */
  public addDeviceFoundListener(
    listener: (device: Device) => void | Promise<void>
  ): () => void {
    return this.addEventListener(BleEvent.EVENT_DEVICE_FOUND, listener);
  }

  /**
   * Scanning timeout handler
   *
   * @param listener {() => void | Promise<void>} - scanning timeout handler function
   * @return {() => void} - function to unsubscribe
   */
  public addScanningTimeoutListener(
    listener: () => void | Promise<void>
  ): () => void {
    return this.addEventListener(BleEvent.EVENT_SCANNING_TIMEOUT, listener);
  }

  public addBindingSuccessListener(
    listener: (device: BoundDevice) => void | Promise<void>
  ) {
    return this.addEventListener(BleEvent.EVENT_BINDING_SUCCESS, listener);
  }

  public addBindingFailListener(
    listener: (device: BoundDevice) => void | Promise<void>
  ) {
    return this.addEventListener(BleEvent.EVENT_BINDING_FAILED, listener);
  }
}

export default new TelinkBle();
export { BondState } from './bond-state';
export { NodeInfo } from './node-info';
export type { Device };
export { BleEvent };
