/********************************************************************************************************
 * @file OOBPair.java
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

import java.io.Serializable

class OOBPair : Serializable {
  /**
   * device UUID
   */
  lateinit var deviceUUID: ByteArray

  /**
   * OOB value, used when device is static-oob supported
   */
  lateinit var oob: ByteArray

  /**
   * @see .IMPORT_MODE_FILE
   *
   * @see .IMPORT_MODE_MANUAL
   */
  var importMode = 0

  /**
   * import time
   */
  var timestamp: Long = 0

  companion object {
    /**
     * manual input in OOBEditActivity
     */
    const val IMPORT_MODE_MANUAL = 0

    /**
     * batch import from valid formatted file
     */
    const val IMPORT_MODE_FILE = 1
  }
}
