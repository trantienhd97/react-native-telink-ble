/********************************************************************************************************
 * @file NodeInfo.java
 *
 * @brief for TLSR chips
 *
 * @author telink
 * @date Sep. 30, 2010
 *
 * @par Copyright (c) 2010, Telink Semiconductor (Shanghai) Co., Ltd.
 * All rights reserved.
 *
 * The information contained herein is confidential and proprietary property of Telink
 * Semiconductor (Shanghai) Co., Ltd. and is available under the terms
 * of Commercial License Agreement between Telink Semiconductor (Shanghai)
 * Co., Ltd. and the licensee in separate contract or the terms described here-in.
 * This heading MUST NOT be removed from this file.
 *
 * Licensees are granted free, non-transferable use of the information in this
 * file under Mutual Non-Disclosure Agreement. NO WARRENTY of ANY KIND is provided.
 */
package com.react.telink.ble.model

import android.util.SparseBooleanArray
import com.telink.ble.mesh.core.MeshUtils
import com.telink.ble.mesh.core.message.MeshSigModel
import com.telink.ble.mesh.entity.CompositionData
import com.telink.ble.mesh.entity.Scheduler
import com.telink.ble.mesh.util.Arrays
import java.io.Serializable
import java.nio.ByteOrder
import java.util.*

/**
 * Created by kee on 2019/8/22.
 */
class NodeInfo : Serializable {
  /**
   * primary element unicast address
   */
  var meshAddress = 0

  /**
   * mac address
   */
  var macAddress: String? = null

  /**
   * device-uuid from scan-record when normal provision
   * or
   * device scan report when fast-provision or remote-provision
   */
  lateinit var deviceUUID: ByteArray

  /**
   * element count
   */
  var elementCnt = 0
  var bound = false
  lateinit var deviceKey: ByteArray

  /**
   * device subscription/group info
   */
  var subList: ArrayList<Int> = ArrayList()

  // device lightness
  var lum = 0

  // device temperature
  var temp = 0

  /**
   * device on off state
   * 0:off 1:on -1:offline
   */
  private var onOff = ON_OFF_STATE_OFFLINE

  /**
   * composition data
   * [com.telink.ble.mesh.core.message.config.CompositionDataStatusMessage]
   */
  var compositionData: CompositionData? = null

  // is relay enabled
  var isRelayEnable = true

  /**
   * scheduler
   */
  var schedulers: MutableList<Scheduler>? = ArrayList<Scheduler>()

  /**
   * publication
   */
  private var publishModel: PublishModel? = null

  /**
   * default bind support
   */
  var isDefaultBind = false

  /**
   * selected for UI select
   */
  var selected = false
  private val offlineCheckTask: OfflineCheckTask = object : OfflineCheckTask {
    override fun run() {
      //  TODO: Implement function OfflineCheckTask.run
    }
  }

  fun getOnOff(): Int {
    return onOff
  }

  fun setOnOff(onOff: Int) {
    this.onOff = onOff
    if (publishModel != null) {
      // TODO: Replace on-off
    }
  }

  val isPubSet: Boolean
    get() = publishModel != null

  fun getPublishModel(): PublishModel? {
    return publishModel
  }

  fun setPublishModel(model: PublishModel?) {
    publishModel = model

  }

  fun getSchedulerByIndex(index: Byte): Scheduler? {
    if (schedulers == null || schedulers!!.size == 0) {
      return null
    }
    for (scheduler in schedulers!!) {
      if (scheduler.getIndex() == index) {
        return scheduler
      }
    }
    return null
  }

  fun saveScheduler(scheduler: Scheduler) {
    if (schedulers == null) {
      schedulers = ArrayList<Scheduler>() as MutableList<Scheduler>
      schedulers!!.add(scheduler)
    } else {
      for (i in schedulers!!.indices) {
        if (schedulers!![i].getIndex() == scheduler.getIndex()) {
          schedulers!![i] = scheduler
          return
        }
      }
      schedulers!!.add(scheduler)
    }
  }

  // 0 - 15/0x0f
  fun allocSchedulerIndex(): Byte {
    if (schedulers == null || schedulers!!.size == 0) {
      return 0
    }
    outer@ for (i in 0..0x0f) {
      for (scheduler in schedulers!!) {
        if (scheduler.index.toInt() == i) {
          continue@outer
        }
      }
      return i.toByte()
    }
    return -1
  }

  val onOffDesc: String
    get() {
      if (onOff == 1) {
        return "ON"
      } else if (onOff == 0) {
        return "OFF"
      } else if (onOff == -1) {
        return "OFFLINE"
      }
      return "UNKNOWN"
    }// element address is based on primary address and increase in loop

  /**
   * get on/off model element info
   * in panel , multi on/off may exist in different element
   *
   * @return adr
   */
  val onOffEleAdrList: List<Int>?
    get() {
      if (compositionData == null) return null
      val addressList: MutableList<Int> = ArrayList()

      // element address is based on primary address and increase in loop
      var eleAdr = meshAddress
      outer@ for (element in compositionData!!.elements) {
        if (element.sigModels != null) {
          for (modelId in element.sigModels) {
            if (modelId == MeshSigModel.SIG_MD_G_ONOFF_S.modelId) {
              addressList.add(eleAdr++)
              continue@outer
            }
          }
        }
        eleAdr++
      }
      return addressList
    }

  /**
   * @param tarModelId target model id
   * @return element address: -1 err
   */
  fun getTargetEleAdr(tarModelId: Int): Int {
    if (compositionData == null) return -1
    var eleAdr = meshAddress
    for (element in compositionData!!.elements) {
      if (element.sigModels != null) {
        for (modelId in element.sigModels) {
          if (modelId == tarModelId) {
            return eleAdr
          }
        }
      }
      if (element.vendorModels != null) {
        for (modelId in element.vendorModels) {
          if (modelId == tarModelId) {
            return eleAdr
          }
        }
      }
      eleAdr++
    }
    return -1
  }// if contains lightness model

  /**
   * get lum model element
   *
   * @return lum lightness union info
   */
  val lumEleInfo: SparseBooleanArray?
    get() {
      if (compositionData == null) return null
      var eleAdr = meshAddress
      val result = SparseBooleanArray()
      for (element in compositionData!!.elements) {
        if (element.sigModels != null) {
          var levelSupport = false
          var lumSupport = false
          // if contains lightness model
          for (modelId in element.sigModels) {
            if (modelId == MeshSigModel.SIG_MD_LIGHTNESS_S.modelId) {
              lumSupport = true
            }
            if (modelId == MeshSigModel.SIG_MD_G_LEVEL_S.modelId) {
              levelSupport = true
            }
          }
          if (lumSupport) {
            result.append(eleAdr, levelSupport)
            return result
          }
        }
        eleAdr++
      }
      return null
    }// contains temperature model

  /**
   * get element with temperature model
   *
   * @return temp & isLevelSupported
   */
  val tempEleInfo: SparseBooleanArray?
    get() {
      if (compositionData == null) return null
      var eleAdr = meshAddress
      val result = SparseBooleanArray()
      for (element in compositionData!!.elements) {
        if (element.sigModels != null) {
          var levelSupport = false
          var tempSupport = false
          // contains temperature model
          for (modelId in element.sigModels) {
            if (modelId == MeshSigModel.SIG_MD_LIGHT_CTL_TEMP_S.modelId) {
              tempSupport = true
            }
            if (modelId == MeshSigModel.SIG_MD_G_LEVEL_S.modelId) {
              levelSupport = true
            }
          }
          if (tempSupport) {
            result.append(eleAdr, levelSupport)
            return result
          }
        }
        eleAdr++
      }
      return null
    }

  //            pidInfo = (compositionData.cid == 0x0211 ? String.format("%04X", compositionData.pid)
//                    : "cid-" + String.format("%02X", compositionData.cid));
  val pidDesc: String
    get() {
      var pidInfo = ""
      pidInfo = if (bound && compositionData != null) {
        return "cid-" +
          Arrays.bytesToHexString(
            MeshUtils.integer2Bytes(
              compositionData!!.cid,
              2,
              ByteOrder.LITTLE_ENDIAN
            ), ""
          ) +
          " pid-" +
          Arrays.bytesToHexString(
            MeshUtils.integer2Bytes(
              compositionData!!.pid,
              2,
              ByteOrder.LITTLE_ENDIAN
            ), ""
          )
        //            pidInfo = (compositionData.cid == 0x0211 ? String.format("%04X", compositionData.pid)
//                    : "cid-" + String.format("%02X", compositionData.cid));
      } else {
        "(unbound)"
      }
      return pidInfo
    }
  val isLpn: Boolean
    get() = compositionData != null && compositionData!!.lowPowerSupport()
  val isOffline: Boolean
    get() = onOff == ON_OFF_STATE_OFFLINE

  companion object {
    /**
     * on/off state
     */
    const val ON_OFF_STATE_ON = 1
    const val ON_OFF_STATE_OFF = 0
    const val ON_OFF_STATE_OFFLINE = -1
  }

  /**
   * default bind support
   */
  private var defaultBind = false
}
