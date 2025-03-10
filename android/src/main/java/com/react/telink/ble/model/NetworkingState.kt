package com.react.telink.ble.model

enum class NetworkingState(val desc: String) {
  IDLE("Prepared"), WAITING("Waiting"), PROVISIONING("Provisioning"), PROVISION_FAIL("Provision Fail"), PROVISION_SUCCESS(
    "Provision Success"
  ),
  BINDING("Binding"), BIND_FAIL("Bind Fail"), BIND_SUCCESS("Bind Success"), TIME_PUB_SETTING("Time Publish Setting"), TIME_PUB_SET_SUCCESS(
    "Time Publish Set Success"
  ),
  TIME_PUB_SET_FAIL("Time Publish Set Fail");
}
