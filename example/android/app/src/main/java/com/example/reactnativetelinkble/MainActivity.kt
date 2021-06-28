package com.example.reactnativetelinkble

import com.react.telink.ble.BleActivity
import android.app.Activity

class MainActivity : BleActivity() {
  /**
   * Returns the name of the main component registered from JavaScript.
   * This is used to schedule rendering of the component.
   */
  override fun getMainComponentName(): String {
    return "TelinkBleExample"
  }
}
