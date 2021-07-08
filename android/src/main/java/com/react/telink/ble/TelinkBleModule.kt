package com.react.telink.ble

import android.os.Handler
import android.util.SparseBooleanArray
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.react.telink.ble.helpers.toHexString
import com.react.telink.ble.model.*
import com.telink.ble.mesh.core.MeshUtils
import com.telink.ble.mesh.core.access.BindingBearer
import com.telink.ble.mesh.core.message.MeshMessage
import com.telink.ble.mesh.core.message.MeshSigModel
import com.telink.ble.mesh.core.message.config.*
import com.telink.ble.mesh.core.message.generic.OnOffSetMessage
import com.telink.ble.mesh.core.message.lighting.CtlTemperatureSetMessage
import com.telink.ble.mesh.core.message.lighting.HslSetMessage
import com.telink.ble.mesh.core.message.lighting.LightnessSetMessage
import com.telink.ble.mesh.core.message.scene.SceneDeleteMessage
import com.telink.ble.mesh.core.message.scene.SceneRecallMessage
import com.telink.ble.mesh.core.message.scene.SceneStoreMessage
import com.telink.ble.mesh.entity.*
import com.telink.ble.mesh.foundation.Event
import com.telink.ble.mesh.foundation.EventListener
import com.telink.ble.mesh.foundation.MeshService
import com.telink.ble.mesh.foundation.event.BindingEvent
import com.telink.ble.mesh.foundation.event.ProvisioningEvent
import com.telink.ble.mesh.foundation.event.ScanEvent
import com.telink.ble.mesh.foundation.event.StatusNotificationEvent
import com.telink.ble.mesh.foundation.parameter.AutoConnectParameters
import com.telink.ble.mesh.foundation.parameter.BindingParameters
import com.telink.ble.mesh.foundation.parameter.ProvisioningParameters
import com.telink.ble.mesh.foundation.parameter.ScanParameters
import com.telink.ble.mesh.util.Arrays
import com.telink.ble.mesh.util.MeshLogger

class TelinkBleModule :
  ReactContextBaseJavaModule, EventListener<String?>, MeshAutoConnect {
  override fun getName(): String {
    return "TelinkBle"
  }

  private var context: ReactApplicationContext? = null

  private var isPubSetting = false

  private var isScanning = false

  var sceneList: List<Scene>? = null

  private var deleteIndex = 0

  private var tarScene: Scene? = null

  private var mHandler: Handler? = null

  private var deviceInfo: NodeInfo? = null

  private val allGroups: List<GroupInfo>? = null

  private var selectedAdrList: ArrayList<SettingModel>? = null

  private var groupAddress = 0

  private var deviceAddress = 0

  private var modelIndex = 0

  private var opType = 0

  private var settingIndex = 0

  private var scene: Scene? = null

  private val models = MeshSigModel.getDefaultSubList()

  fun setHandler(handler: Handler) {
    mHandler = handler
  }

  private val eventEmitter: DeviceEventManagerModule.RCTDeviceEventEmitter
    get() = context!!.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)


  private var lumEleInfo: SparseBooleanArray? = null
  private var tempEleInfo: SparseBooleanArray? = null
  private var hslElementAddress: Int? = null

  constructor(reactContext: ReactApplicationContext) : super(reactContext) {
    instance = this
    context = reactContext

    application?.addEventListener(ProvisioningEvent.EVENT_TYPE_PROVISION_BEGIN, this)
    application?.addEventListener(ProvisioningEvent.EVENT_TYPE_PROVISION_SUCCESS, this)
    application?.addEventListener(ProvisioningEvent.EVENT_TYPE_PROVISION_FAIL, this)
    application?.addEventListener(BindingEvent.EVENT_TYPE_BIND_SUCCESS, this)
    application?.addEventListener(BindingEvent.EVENT_TYPE_BIND_FAIL, this)
    application?.addEventListener(ScanEvent.EVENT_TYPE_SCAN_TIMEOUT, this)
    application?.addEventListener(ScanEvent.EVENT_TYPE_DEVICE_FOUND, this)
    application?.addEventListener(ModelPublicationStatusMessage::class.java.name, this)
  }

  companion object {
    private var application: ReactMeshApplication? = null

    fun setApplication(app: ReactMeshApplication) {
      application = app
    }

    /**
     * Singleton instance of this module
     */
    private var instance: TelinkBleModule? = null

    /**
     * Get singleton instance of this module
     */
    fun getInstance(): TelinkBleModule? {
      return instance
    }
  }

  @ReactMethod
  fun getNodes(promise: Promise) {
    val nodes = application!!.getMeshInfo().nodes
    val result = WritableNativeArray()
    if (nodes != null) {
      for (node in nodes) {
        if (node.onOffDesc != "OFFLINE") {
          val nodeInfo = WritableNativeMap()
          nodeInfo.putString("uuid", node.deviceUUID.toHexString())
          nodeInfo.putString("address", node.macAddress)
          nodeInfo.putInt("unicastId", node.meshAddress)
          nodeInfo.putBoolean("bound", node.bound)
          nodeInfo.putString("pidDesc", node.pidDesc)
          nodeInfo.putString("onOffDesc", node.onOffDesc)
          nodeInfo.putString("deviceKey", "${node.deviceKey}")
          nodeInfo.putInt("elementCnt", node.elementCnt)
          nodeInfo.putBoolean("isDefaultBind", node.isDefaultBind)
          nodeInfo.putInt("lum", node.lum)
          nodeInfo.putInt("temp", node.temp)
          result.pushMap(nodeInfo)
        }
      }
      promise.resolve(result)
      return
    }
    promise.resolve(result)
  }

  @ReactMethod
  fun setOnOff(address: Int, onOff: Int) {
    val rspMax: Int = application!!.getMeshInfo().onlineCountInAll
    val appKeyIndex: Int = application!!.getMeshInfo().defaultAppKeyIndex
    val onOffSetMessage = OnOffSetMessage.getSimple(
      address,
      appKeyIndex,
      onOff,
      !AppSettings.ONLINE_STATUS_ENABLE,
      if (!AppSettings.ONLINE_STATUS_ENABLE) rspMax else 0
    )
    MeshService.getInstance().sendMeshMessage(onOffSetMessage)
  }

  @ReactMethod
  fun addDeviceToGroup(groupId: Int, deviceId: Int) {
    deviceInfo = application!!.getMeshInfo().getDeviceByMeshAddress(deviceId)
    groupAddress = groupId
    deviceAddress = deviceId
    opType = 0;
    modelIndex = 0
    setNextModel()
  }

  @ReactMethod
  fun removeDeviceFromGroup(groupId: Int, deviceId: Int) {
    deviceInfo = application!!.getMeshInfo().getDeviceByMeshAddress(deviceId)
    groupAddress = groupId
    deviceAddress = deviceId
    opType = 1
    setNextModel()
  }

  private fun setNextModel() {
    val eleAdr = deviceInfo!!.getTargetEleAdr(models[modelIndex].modelId)
    if (eleAdr == -1) {
      eventEmitter.emit(EVENT_SET_GROUP_FAILED, true)
      return
    }
    val groupingMessage: MeshMessage = ModelSubscriptionSetMessage.getSimple(deviceAddress, opType, eleAdr, groupAddress, models[modelIndex].modelId, true)
    if (!MeshService.getInstance().sendMeshMessage(groupingMessage)) {
      eventEmitter.emit(EVENT_SET_GROUP_FAILED, true)
    } else {
      if (opType == 0) {
        deviceInfo!!.subList.add(groupAddress)
      } else {
        deviceInfo!!.subList.remove((groupAddress as Int?)!!)
      }
      application!!.getMeshInfo().saveOrUpdate(context)
      context!!.currentActivity!!.runOnUiThread(Runnable {
        eventEmitter.emit(EVENT_SET_GROUP_SUCCESS, groupAddress)
      })
    }
  }

  @ReactMethod
  fun setSceneForDevice(sceneId: Int, deviceId: Int, end: Boolean, deviceIndex: String) {
    val sceneTaget = application!!.getMeshInfo().scenes?.find { it.id == sceneId }

    if (sceneTaget != null) {
      scene = sceneTaget
    } else {
      scene = Scene()
      scene!!.id = sceneId
    }

    val meshInfo = application!!.getMeshInfo()
    var adr: Int
    deviceInfo = application!!.getMeshInfo().getDeviceByMeshAddress(deviceId)
    val node = meshInfo.nodes?.find {
      it.meshAddress == deviceInfo!!.meshAddress
    }

    var state: Scene.SceneState? = Scene.SceneState()
    if (node != null) {
      state?.address = node.meshAddress
      state?.onOff = node.getOnOff()
      state?.lum = node.lum
      state?.temp = node.temp
    }

    if (state != null) {
      scene!!.states.add(state)
      application!!.getMeshInfo().saveOrUpdate(context)
    }

    if (node != null) {
      if (node.getOnOff() === -1) {
      }
    }

    if (node != null) {
      adr = node.getTargetEleAdr(MeshSigModel.SIG_MD_SCENE_S.modelId)
      if (adr == -1) {
      }

       var settingModel =  SettingModel(adr, true)

      val appKeyIndex: Int = application!!.getMeshInfo().getDefaultAppKeyIndex()

      val meshMessage: MeshMessage
      meshMessage = if (settingModel.add) {
        SceneStoreMessage.getSimple(settingModel.address,
          appKeyIndex,
          scene!!.id,
          true, 1)
      } else {
        SceneDeleteMessage.getSimple(settingModel.address,
          appKeyIndex,
          scene!!.id,
          true, 1)
      }
      if (MeshService.getInstance().sendMeshMessage(meshMessage)) {
        application!!.getMeshInfo().scenes.add(scene!!)
        application!!.getMeshInfo().saveOrUpdate(context)
        if (end) {
          eventEmitter.emit(EVENT_SET_SCENE_SUCCESS, scene!!.id)
        }  else {
          eventEmitter.emit(EVENT_SET_SCENE_SUCCESS, deviceIndex)
        }
      } else {
        eventEmitter.emit(EVENT_SET_SCENE_FAILED, scene!!.id)
      }

    }
  }

  @ReactMethod
  fun setSceneForListDevice(sceneId: Int, nodeList: ReadableArray) {
    scene = Scene()
    scene!!.id = sceneId
    selectedAdrList = ArrayList()
    val meshInfo = application!!.getMeshInfo()
    if (nodeList != null) {
      var adr: Int
      for (i in 0 until nodeList.size()) {
        val deviceInfo = nodeList.getMap(i)
        val node = meshInfo.nodes?.find {
          it.meshAddress == deviceInfo!!.getInt("unicastId")
        }

         var state: Scene.SceneState? = Scene.SceneState()
        if (node != null) {
          state?.address = node.meshAddress
          state?.onOff = node.getOnOff()
          state?.lum = node.lum
          state?.temp = node.temp
        }

        if (state != null) {
          scene!!.states.add(state)
        }

        if (node != null) {
          if (node.getOnOff() === -1) {
            continue
          }
        }

        if (node != null) {
          adr = node.getTargetEleAdr(MeshSigModel.SIG_MD_SCENE_S.modelId)
          if (adr == -1) {
            continue
          }

          selectedAdrList!!.add(SettingModel(adr, true))
        }

      }
    }
    if (selectedAdrList!!.size == 0) {
    } else {
      settingIndex = 0
      setNextAddress()
    }
  }

  private fun setNextAddress() {
    if (settingIndex > selectedAdrList!!.size - 1) {
      return
    }
    val model = selectedAdrList!![settingIndex]

    val appKeyIndex: Int = application!!.getMeshInfo().getDefaultAppKeyIndex()
    if (settingIndex < selectedAdrList!!.size) {
      settingIndex++
      setNextAddress()
    }
    val meshMessage: MeshMessage
    meshMessage = if (model.add) {
      SceneStoreMessage.getSimple(model.address,
        appKeyIndex,
        scene!!.id,
        true, 1)
    } else {
      SceneDeleteMessage.getSimple(model.address,
        appKeyIndex,
        scene!!.id,
        true, 1)
    }
    if (MeshService.getInstance().sendMeshMessage(meshMessage)) {
      eventEmitter.emit(EVENT_SET_SCENE_SUCCESS, scene!!.id)
      application!!.getMeshInfo().scenes.add(scene!!)
      application!!.getMeshInfo().saveOrUpdate(context)
    } else {
      eventEmitter.emit(EVENT_SET_SCENE_FAILED, scene!!.id)
    }
  }

  private val cmdTimeoutCheckTask = Runnable {
    settingIndex++
    setNextAddress()
  }

  @ReactMethod
  fun onStartScene(sceneId: Int) {
//                MeshService.getInstance().cmdSceneRecall(0xFFFF, 0, sceneList.get(position).id, 0, null);
    val appKeyIndex: Int = application!!.getMeshInfo().getDefaultAppKeyIndex()
    val recallMessage = SceneRecallMessage.getSimple(0xFFFF,
      appKeyIndex, sceneId, false, 0)
    MeshService.getInstance().sendMeshMessage(recallMessage)
  }

  @ReactMethod
  fun removeSceneFromDevice(sceneId: Int, deviceId: Int) {
  }

  @ReactMethod
  private fun deleteScene(sceneId: Int) {
     sceneList = application!!.getMeshInfo().scenes
    var success: Boolean? = null
    val sceneTaget = application!!.getMeshInfo().scenes?.find { it.id == sceneId }
    if (sceneTaget != null) {
      for (sta in sceneTaget?.states) {
        val deviceInfo: NodeInfo? = application!!.getMeshInfo().getDeviceByMeshAddress(sta?.address!!)
        if (deviceInfo != null && sceneTaget.id == sceneId) {
          if (deviceInfo.getOnOff() === -1) {
          } else {
            val eleAdr = deviceInfo?.getTargetEleAdr(MeshSigModel.SIG_MD_SCENE_S.modelId)
            val appKeyIndex: Int = application!!.getMeshInfo().getDefaultAppKeyIndex()
            val deleteMessage = eleAdr?.let {
              SceneDeleteMessage.getSimple(it,
                appKeyIndex,
                sceneTaget!!.id,
                true, 1)
            }
            success = MeshService.getInstance().sendMeshMessage(deleteMessage)
          }
        }
      }
    }
    if (success == true) {
      eventEmitter.emit(EVENT_REMOVE_SCENE_SUCCESS, sceneId)
    } else {
      eventEmitter.emit(EVENT_REMOVE_SCENE_FAILED, sceneId)
    }
  }

  @ReactMethod
  fun setSceneForController(deviceId: Int, mode: Int, sceneId: Int) {
  }

  @ReactMethod
  fun kickOut(deviceId: Int) {
    // send reset message
    val cmdSent =
      MeshService.getInstance().sendMeshMessage(NodeResetMessage(deviceId))
    val kickDirect = deviceId == MeshService.getInstance().directConnectedNodeAddress
    if (cmdSent || !kickDirect) {
      eventEmitter.emit(EVENT_RESET_NODE_SUCCESS, true)
//      Timer("SettingUp", false).schedule(3000) {
////        MeshService.getInstance().removeDevice(deviceId)
//
//      }

//      mHandler!!.postDelayed(
//        {
//          onKickOutFinish(deviceId)
//        },
//        3 * 1000L
//      )
    }
  }

  private fun onKickOutFinish(deviceId: Int) {
    mHandler!!.removeCallbacksAndMessages(null)
    MeshService.getInstance().removeDevice(deviceId)
    application!!.getMeshInfo().removeDeviceByMeshAddress(deviceId)
    application!!.getMeshInfo().saveOrUpdate(context)
    eventEmitter.emit(EVENT_RESET_NODE_SUCCESS, true)
  }

  @ReactMethod
  fun setLuminance(address: Int, lum: Int) {
    val meshInfo = application!!.getMeshInfo()
    val node = meshInfo.nodes?.find {
      it.meshAddress == address
    }
    if (node !== null) {
      lumEleInfo = node.lumEleInfo
      val message = LightnessSetMessage.getSimple(
        lumEleInfo!!.keyAt(0),
        meshInfo.defaultAppKeyIndex,
        UnitConvert.lum2lightness(lum),
        false,
        0
      )
      MeshService.getInstance().sendMeshMessage(message)
    }
  }

  @ReactMethod
  fun setTemp(address: Int, temp: Int) {
    val meshInfo = application!!.getMeshInfo()
    val node = meshInfo.nodes?.find {
      it.meshAddress == address
    }
    if (node !== null) {
      tempEleInfo = node.tempEleInfo
      val temperatureSetMessage = CtlTemperatureSetMessage.getSimple(
        tempEleInfo!!.keyAt(0),
        meshInfo.defaultAppKeyIndex,
        UnitConvert.temp100ToTemp(temp),
        0,
        false,
        0
      )
      MeshService.getInstance().sendMeshMessage(temperatureSetMessage)
    }
  }

  @ReactMethod
  fun setHsl(address: Int, hsl: ReadableMap) {
    val meshInfo = application!!.getMeshInfo()
    val node = meshInfo.nodes?.find {
      it.meshAddress == address
    }
    if (node !== null) {
      hslElementAddress = node.getTargetEleAdr(MeshSigModel.SIG_MD_LIGHT_HSL_S.modelId)
      val hue = hsl.getInt("h") * 65535 / 360
      val sat = hsl.getInt("s") * 65535 / 100
      val lum = hsl.getInt("l") * 65535 / 100
      val hslSetMessage = HslSetMessage.getSimple(
        hslElementAddress!!, meshInfo.getDefaultAppKeyIndex(),
        lum,
        hue,
        sat,
        false,
        0
      )
      MeshService.getInstance().sendMeshMessage(hslSetMessage)
    }
  }

  @ReactMethod
  fun setAllOff() {
    setOnOff(0xFFFF, 0)
  }

  @ReactMethod
  fun setAllOn() {
    setOnOff(0xFFFF, 1)
  }

  /**
   * found by bluetooth scan
   */
  private var devices: ArrayList<NetworkingDevice> = ArrayList()

  /**
   * @param state target state,
   * @return processing device
   */
  private fun getCurrentDevice(state: NetworkingState): NetworkingDevice? {
    for (device in devices) {
      if (device.state === state) {
        return device
      }
    }
    return null
  }

  private val timePubSetTimeoutTask =
    Runnable { onTimePublishComplete(false, "time pub set timeout") }

  override fun performed(event: Event<String?>?) {
    if (event!!.type == ProvisioningEvent.EVENT_TYPE_PROVISION_BEGIN) {
      onProvisionStart(event as ProvisioningEvent)
    } else if (event.type == ProvisioningEvent.EVENT_TYPE_PROVISION_SUCCESS) {
      onProvisionSuccess(event as ProvisioningEvent)
    } else if (event.type == ScanEvent.EVENT_TYPE_SCAN_TIMEOUT) {
      eventEmitter.emit(EVENT_SCANNING_TIMEOUT, null)
      autoConnect()
    } else if (event.type == ProvisioningEvent.EVENT_TYPE_PROVISION_FAIL) {
      onProvisionFail(event as ProvisioningEvent)

      // provision next when provision failed
      // TODO: provision next device
    } else if (event.type == BindingEvent.EVENT_TYPE_BIND_SUCCESS) {
      onKeyBindSuccess(event as BindingEvent)
    } else if (event.type == BindingEvent.EVENT_TYPE_BIND_FAIL) {
      onKeyBindFail(event as BindingEvent)
      // TODO: provision next
    } else if (event.type == ScanEvent.EVENT_TYPE_DEVICE_FOUND) {
      val device = (event as ScanEvent).advertisingDevice
      onDeviceFound(device)
    } else if (event.type == ModelPublicationStatusMessage::class.java.name) {
      MeshLogger.d("pub setting status: $isPubSetting")
      if (!isPubSetting) {
        return
      }
      mHandler!!.removeCallbacks(timePubSetTimeoutTask)
      val statusMessage =
        (event as StatusNotificationEvent).notificationMessage.statusMessage as ModelPublicationStatusMessage
      if (statusMessage.status.toInt() == ConfigStatus.SUCCESS.code) {
        onTimePublishComplete(true, "time pub set success")
      } else {
        onTimePublishComplete(false, "time pub set status err: " + statusMessage.status)
        MeshLogger.log("publication err: " + statusMessage.status)
      }
    }
  }

  private fun onProvisionSuccess(event: ProvisioningEvent) {
    val remote = event.provisioningDevice
    val pvDevice = getCurrentDevice(NetworkingState.PROVISIONING)
    if (pvDevice == null) {
      MeshLogger.d("pv device not found when provision success")
      return
    }
    pvDevice.state = NetworkingState.BINDING
    pvDevice.addLog(NetworkingDevice.TAG_PROVISION, "success")
    val nodeInfo = pvDevice.nodeInfo
    val elementCnt = remote.deviceCapability.eleNum.toInt()
    nodeInfo.elementCnt = elementCnt
    nodeInfo.deviceKey = remote.deviceKey
    val mesh = application!!.getMeshInfo()
    mesh.insertDevice(nodeInfo)
    mesh.provisionIndex += elementCnt
    mesh.saveOrUpdate(context)


    // check if private mode opened
    val privateMode = SharedPreferenceHelper.isPrivateMode(context!!)

    // check if device support fast bind
    var defaultBound = false
    if (privateMode && remote.deviceUUID != null) {
      val device: PrivateDevice? = PrivateDevice.filter(remote.deviceUUID)
      if (device != null) {
        MeshLogger.d("private device")
        val cpsData: ByteArray = device.getCpsData()
        nodeInfo.compositionData = CompositionData.from(cpsData)
        defaultBound = true
      } else {
        MeshLogger.d("private device null")
      }
    }
    nodeInfo.isDefaultBind = defaultBound
    pvDevice.addLog(NetworkingDevice.TAG_BIND, "action start")
    val appKeyIndex: Int = application!!.getMeshInfo().defaultAppKeyIndex
    val bindingDevice = BindingDevice(nodeInfo.meshAddress, nodeInfo.deviceUUID, appKeyIndex)
    bindingDevice.isDefaultBound = defaultBound
    bindingDevice.bearer = BindingBearer.GattOnly
    MeshService.getInstance().startBinding(BindingParameters(bindingDevice))
    eventEmitter.emit(EVENT_PROVISIONING_SUCCESS, pvDevice.nodeInfo.macAddress)
  }

  private fun onKeyBindFail(event: BindingEvent) {
    val deviceInList = getCurrentDevice(NetworkingState.BINDING) ?: return
    deviceInList.state = NetworkingState.BIND_FAIL
    deviceInList.addLog(NetworkingDevice.TAG_BIND, "failed - " + event.desc)
    // TODO: emit to JS
    application!!.getMeshInfo().saveOrUpdate(context)
  }

  private fun onProvisionFail(event: ProvisioningEvent) {
//        ProvisioningDevice deviceInfo = event.getProvisioningDevice();
    val pvDevice = getCurrentDevice(NetworkingState.PROVISIONING)
    if (pvDevice == null) {
      MeshLogger.d("pv device not found when failed")
      return
    }
    pvDevice.state = NetworkingState.PROVISION_FAIL
    pvDevice.addLog(NetworkingDevice.TAG_PROVISION, event.desc)
    eventEmitter.emit(EVENT_PROVISIONING_FAILED, true)
  }

  private fun onProvisionStart(event: ProvisioningEvent) {
    val pvDevice: NetworkingDevice = getCurrentDevice(NetworkingState.PROVISIONING) ?: return
    pvDevice.addLog(NetworkingDevice.TAG_PROVISION, "begin")
    eventEmitter.emit(EVENT_PROVISIONING_START, pvDevice.nodeInfo.macAddress)
  }

  private fun onTimePublishComplete(success: Boolean, desc: String) {
    if (!isPubSetting) return
    MeshLogger.d("pub set complete: $success -- $desc")
    isPubSetting = false
    val pvDevice = getCurrentDevice(NetworkingState.TIME_PUB_SETTING)
    if (pvDevice == null) {
      MeshLogger.d("pv device not found pub set success")
      return
    }
    pvDevice.addLog(NetworkingDevice.TAG_PUB_SET, if (success) "success" else "failed : $desc")
    pvDevice.state =
      if (success) NetworkingState.TIME_PUB_SET_SUCCESS else NetworkingState.TIME_PUB_SET_FAIL
    pvDevice.addLog(NetworkingDevice.TAG_PUB_SET, desc)
    // TODO: Emit to JS
    application?.getMeshInfo()!!.saveOrUpdate(context)
    // TODO: provision next device
  }

  @ReactMethod
  fun stopScanning() {
    isScanning = false
    MeshService.getInstance().stopScan()
    autoConnect()
  }

  @ReactMethod
  fun startProvisioning(uuid: String, promise: Promise) {
    if (isScanning) {
      stopScanning()
    }
    val processingDevice: NetworkingDevice? = devices.find {
      it.nodeInfo.deviceUUID.toHexString() == uuid
    }
    if (processingDevice !== null) {
      val address: Int = application!!.getMeshInfo().provisionIndex
      MeshLogger.d("alloc address: $address")
      if (!MeshUtils.validUnicastAddress(address)) {
        // enable UI
        return
      }
      val deviceUUID = processingDevice.nodeInfo.deviceUUID
      val provisioningDevice = ProvisioningDevice(
        processingDevice.bluetoothDevice,
        processingDevice.nodeInfo.deviceUUID,
        address
      )
      processingDevice.state = NetworkingState.PROVISIONING
      processingDevice.addLog(
        NetworkingDevice.TAG_PROVISION,
        "action start -> 0x" + String.format("%04X", address)
      )
      processingDevice.nodeInfo.meshAddress = address
      // TODO: emit to JS

      // check if oob exists
      val oob: ByteArray? =
        application!!.getMeshInfo().getOOBByDeviceUUID(deviceUUID)
      if (oob != null) {
        provisioningDevice.authValue = oob
      } else {
        val autoUseNoOOB = SharedPreferenceHelper.isNoOOBEnable(context!!)
        provisioningDevice.isAutoUseNoOOB = autoUseNoOOB
      }
      val provisioningParameters = ProvisioningParameters(provisioningDevice)
      MeshService.getInstance().startProvisioning(provisioningParameters)
      promise.resolve(address)
      return
    }
    // TODO: make error ctant
    promise.reject("DEVICE_UNAVAILABLE")
  }

  private fun getNextWaitingDevice(): NetworkingDevice? {
    for (device in devices) {
      if (device.state === NetworkingState.WAITING) {
        return device
      }
    }
    return null
  }

  @ReactMethod
  private fun startScanning() {
    devices = ArrayList()
    val parameters = ScanParameters.getDefault(false, false)
    parameters.setScanTimeout((10 * 1000).toLong())
    MeshService.getInstance().startScan(parameters)
  }

  private fun onKeyBindSuccess(event: BindingEvent) {
    val remote = event.bindingDevice
    val pvDevice = getCurrentDevice(NetworkingState.BINDING)
    if (pvDevice == null) {
      MeshLogger.d("pv device not found when bind success")
      return
    }
    pvDevice.addLog(NetworkingDevice.TAG_BIND, "success")
    pvDevice.nodeInfo.bound = true
    // if is default bound, composition data has been valued ahead of binding action
    if (!remote.isDefaultBound) {
      pvDevice.nodeInfo.compositionData = remote.compositionData
    }
    if (setTimePublish(pvDevice)) {
      pvDevice.state = NetworkingState.TIME_PUB_SETTING
      pvDevice.addLog(NetworkingDevice.TAG_PUB_SET, "action start")
      isPubSetting = true
      MeshLogger.d("waiting for time publication status")
    } else {
      // no need to set time publish
      pvDevice.state = NetworkingState.BIND_SUCCESS
      // TODO: provision new device
    }
    application!!.getMeshInfo().saveOrUpdate(context)
    eventEmitter.emit(EVENT_BINDING_SUCCESS, true)
  }

  /**
   * set time publish after
   *
   * @param networkingDevice target
   * @return
   */
  private fun setTimePublish(networkingDevice: NetworkingDevice): Boolean {
    val modelId = MeshSigModel.SIG_MD_TIME_S.modelId
    val pubEleAdr = networkingDevice.nodeInfo.getTargetEleAdr(modelId)
    return if (pubEleAdr != -1) {
      val period = 30 * 1000
      val pubAdr = 0xFFFF
      val appKeyIndex: Int = application?.getMeshInfo()!!.getDefaultAppKeyIndex()
      val modelPublication = ModelPublication.createDefault(
        pubEleAdr,
        pubAdr,
        appKeyIndex,
        period.toLong(),
        modelId,
        true
      )
      val publicationSetMessage =
        ModelPublicationSetMessage(networkingDevice.nodeInfo.meshAddress, modelPublication)
      val result = MeshService.getInstance().sendMeshMessage(publicationSetMessage)
      if (result) {
        mHandler!!.removeCallbacks(timePubSetTimeoutTask)
        mHandler!!.postDelayed(timePubSetTimeoutTask, (5 * 1000).toLong())
      }
      result
    } else {
      false
    }
  }

  private fun onDeviceFound(advertisingDevice: AdvertisingDevice) {
    val serviceData = MeshUtils.getMeshServiceData(advertisingDevice.scanRecord, true)
    if (serviceData == null || serviceData.size < 16) {
      MeshLogger.log("serviceData error", MeshLogger.LEVEL_ERROR)
      return
    }
    val uuidLen = 16
    val deviceUUID = ByteArray(uuidLen)
    System.arraycopy(serviceData, 0, deviceUUID, 0, uuidLen)
    if (deviceExists(deviceUUID)) {
      MeshLogger.d("device exists")
      return
    }
    val nodeInfo = NodeInfo()
    nodeInfo.meshAddress = -1
    nodeInfo.deviceUUID = deviceUUID
    nodeInfo.macAddress = advertisingDevice.device.address
    val processingDevice = NetworkingDevice(nodeInfo)
    processingDevice.bluetoothDevice = advertisingDevice.device
    processingDevice.state = NetworkingState.IDLE
    processingDevice.addLog(NetworkingDevice.TAG_SCAN, "device found")
    devices.add(processingDevice)

    val bleDevice = WritableNativeMap()
    bleDevice.putInt("rssi", advertisingDevice.rssi)
    bleDevice.putString("scanRecord", advertisingDevice.scanRecord.toHexString())
    bleDevice.putString("uuid", deviceUUID.toHexString())
    bleDevice.putString("name", advertisingDevice.device.name)
    bleDevice.putString("address", advertisingDevice.device.address)
    bleDevice.putInt("type", advertisingDevice.device.type)
    bleDevice.putString(
      "deviceClass",
      advertisingDevice.device.bluetoothClass.deviceClass.toString()
    )
    bleDevice.putString(
      "majorDeviceClass",
      "${advertisingDevice.device.bluetoothClass.majorDeviceClass}"
    )
    bleDevice.putString("bluetoothClass", advertisingDevice.device.bluetoothClass.toString())
    bleDevice.putInt("bondState", advertisingDevice.device.bondState)
    eventEmitter.emit(EVENT_DEVICE_FOUND, bleDevice)
  }

  /**
   * only find in unprovisioned list
   *
   * @param deviceUUID deviceUUID in unprovisioned scan record
   */
  private fun deviceExists(deviceUUID: ByteArray): Boolean {
    for (device in devices) {
      if (device.state === NetworkingState.IDLE && Arrays.equals(
          deviceUUID,
          device.nodeInfo.deviceUUID
        )
      ) {
        return true
      }
    }
    return false
  }

  @ReactMethod
  override fun autoConnect() {
    MeshService.getInstance().autoConnect(AutoConnectParameters())
  }

  internal class SettingModel(var address: Int, var add: Boolean)
}
