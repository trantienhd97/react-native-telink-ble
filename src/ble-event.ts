/**
 * Ble event type
 *
 * @enum {string}
 */
export enum BleEvent {
  /**
   * Listen to this device to handle new device one by one
   *
   * @type {BleEvent.EVENT_DEVICE_FOUND}
   */
  EVENT_DEVICE_FOUND = 'EVENT_DEVICE_FOUND',

  /**
   * This event happens when no more device found
   *
   * @type {BleEvent.EVENT_SCANNING_TIMEOUT}
   */
  EVENT_SCANNING_TIMEOUT = 'EVENT_SCANNING_TIMEOUT',

  /**
   * This event happens when provisioning process starts
   *
   * @type {BleEvent.EVENT_PROVISIONING_START}
   */
  EVENT_PROVISIONING_START = 'EVENT_PROVISIONING_START',

  /**
   * This event happens when provisioning process succeeded
   *
   * @type {BleEvent.EVENT_PROVISIONING_SUCCESS}
   */
  EVENT_PROVISIONING_SUCCESS = 'EVENT_PROVISIONING_SUCCESS',

  /**
   * This event happens when provisioning process failed
   *
   * @type {BleEvent.EVENT_PROVISIONING_FAILED}
   */
  EVENT_PROVISIONING_FAILED = 'EVENT_PROVISIONING_FAILED',

  /**
   * This event happens when binding process starts
   *
   * @type {BleEvent.EVENT_BINDING_START}
   */
  EVENT_BINDING_START = 'EVENT_BINDING_START',

  /**
   * This event happens when binding process success
   *
   * @type {BleEvent.EVENT_BINDING_SUCCESS}
   */
  EVENT_BINDING_SUCCESS = 'EVENT_BINDING_SUCCESS',

  /**
   * This event happens when binding process failed
   *
   * @type {BleEvent.EVENT_BINDING_FAILED}
   */
  EVENT_BINDING_FAILED = 'EVENT_BINDING_FAILED',

  EVENT_SET_GROUP_SUCCESS = 'EVENT_SET_GROUP_SUCCESS',

  EVENT_SET_GROUP_FAILED = 'EVENT_SET_GROUP_FAILED',

  EVENT_SET_SCENE_SUCCESS = 'EVENT_SET_SCENE_SUCCESS',

  EVENT_REMOVE_SCENE_SUCCESS = 'EVENT_REMOVE_SCENE_SUCCESS',

  EVENT_REMOVE_SCENE_FAIL = 'EVENT_REMOVE_SCENE_FAIL',

  EVENT_SET_SCENE_FAILED = 'EVENT_SET_SCENE_FAILED',

  EVENT_SET_TRIGGER_SUCCESS = 'EVENT_SET_TRIGGER_SUCCESS',

  EVENT_SET_TRIGGER_FAILED = 'EVENT_SET_TRIGGER_FAILED',

  EVENT_RESET_NODE_SUCCESS = 'EVENT_RESET_NODE_SUCCESS',
}
