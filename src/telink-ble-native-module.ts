import type { BluetoothState } from './bluetooth-state';
import type { HSL } from 'colorsys';
import type { NodeInfo } from './node-info';

export interface TelinkBleNativeModule {
  /**
   * Start device scanning
   */
  startScanning(): void;

  /**
   * Stop device scanning
   */
  stopScanning(): void;

  /**
   * Initialize mesh network with existing key
   */
  initMeshService(): void;

  /**
   * Check bluetooth state
   *
   * @return {Promise<BluetoothState>}
   */
  checkBluetoothPermission(): Promise<BluetoothState>;

  /**
   * Start provisioning a device
   *
   * @param deviceUUID {string} - device UUID in hex string
   * @return {Promise<number>} - Unicast ID of device in mesh network
   */
  startProvisioning(deviceUUID: string): Promise<number>;

  /**
   * Get all bound nodes on mesh network
   */
  getNodes(): Promise<any[]>;

  /**
   * Auto connect to mesh network
   */
  autoConnect(): void;

  /**
   *
   * @param address {number} - Device mesh address
   * @param onOff {0 | 1} - Device status
   */
  setOnOff(address: number, onOff: 0 | 1): void;

  /**
   * Turn on all devices on mesh network
   */
  setAllOn(): void;

  /**
   * Turn off all devices on mesh network
   */
  setAllOff(): void;

  /**
   * Set lightness for a CTL device
   *
   * @param address {number} - Device mesh address
   * @param luminance {number} - Lightness range (0-100)
   */
  setLuminance(address: number, luminance: number): void;

  /**
   * Set temperature for a CTL device
   *
   * @param address {number} - Device mesh address
   * @param temp {number} - Temperature range (0-100)
   */
  setTemp(address: number, temp: number): void;

  /**
   * Set color for RGB device
   *
   * @param address {number} - Device mesh address
   * @param hsl {HSL} - Device HSL value
   */
  setHsl(address: number, hsl: HSL): void;

  /**
   * Add device to group
   *
   * Devices in a group should be the same type
   *
   * @param groupId {number} - Group mesh address
   * @param deviceId {number} - Device mesh address
   */
  addDeviceToGroup(groupId: number, deviceId: number): void;

  /**
   * Remove device from group
   *
   * @param groupId {number} - Group mesh address
   * @param deviceId {number} - Device mesh address
   */
  removeDeviceFromGroup(groupId: number, deviceId: number): void;

  /**
   * Add device to scene
   *
   * @param sceneId {number} - Scene Id
   * @param deviceId {number} - Device mesh address
   */
  setSceneForDevice(sceneId: number, deviceId: number): void;

  /**
   * Add device list to scene
   *
   * @param sceneId {number} - Scene Id
   * @param nodeList
   */
  setSceneForListDevice(sceneId: number, nodeList: NodeInfo[]): void;

  /**
   * Control scene
   *
   * @param sceneId {number} - Scene Id
   */
  onStartScene(sceneId: number): void;

  /**
   * Delete scene
   *
   * @param sceneId {number} - Scene Id
   */
  deleteScene(sceneId: number): void;

  /**
   * Unsubscribe a scene
   *
   * @param sceneId {number} - Scene Id
   * @param deviceId {number} - Device mesh address
   */
  removeSceneFromDevice(sceneId: number, deviceId: number): void;

  /**
   * Set scene for a scene controller button
   *
   * @param deviceId {number} - Device mesh address
   * @param mode {number} - scene controller button mode
   * @param sceneId {number} - scene id
   */
  setSceneForController(deviceId: number, mode: number, sceneId: number): void;

  /**
   * Reset node
   *
   * @param deviceId {number} - Mesh address
   */
  kickOut(deviceId: number): void;
}
