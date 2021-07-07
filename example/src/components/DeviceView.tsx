import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import type { Device } from 'react-native-telink-ble';
import TelinkBle, { BleEvent } from 'react-native-telink-ble';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export enum ScanState {
  init,
  provisioning,
  provsionFail,
  binding,
  success,
  fail,
}

interface DeviceViewProps extends TouchableOpacityProps {
  device: Device;

  index: number;
}

let listSuccess: string[] = [];

export default function DeviceView(props: DeviceViewProps) {
  const { device, ...restProps } = props;

  const [state, setState] = React.useState<ScanState>(ScanState.init);

  const [currentMacAddress, setCurrentMacAddress] = React.useState<string>();

  const handleProvision = React.useCallback(() => {
    TelinkBle.startProvisioning(device.uuid).then(() => {
      setState(ScanState.provisioning);
      setCurrentMacAddress(device.address);
    });
  }, [device.address, device.uuid]);

  React.useEffect(() => {
    return TelinkBle.addEventListener(
      BleEvent.EVENT_PROVISIONING_SUCCESS,
      (macAddress: string) => {
        setCurrentMacAddress(macAddress);
        if (!listSuccess.includes(macAddress)) {
          listSuccess.push(macAddress);
        }
        setState(ScanState.binding);
      }
    );
  }, []);

  React.useEffect(() => {
    return TelinkBle.addEventListener(
      BleEvent.EVENT_PROVISIONING_FAILED,
      (result: boolean) => {
        if (result) {
          setState(ScanState.provsionFail);
        }
      }
    );
  }, []);

  React.useEffect(() => {
    return TelinkBle.addEventListener(BleEvent.EVENT_BINDING_SUCCESS, () => {
      setState(ScanState.success);
    });
  }, []);

  React.useEffect(() => {
    return TelinkBle.addBindingFailListener(() => {
      setState(ScanState.fail);
    });
  }, []);

  const success: boolean =
    listSuccess.includes(device.address) &&
    (state === ScanState.success || state === ScanState.provsionFail);

  const textWhite: boolean =
    currentMacAddress === device?.address &&
    (state === ScanState.success || state === ScanState.fail);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        success && styles.bgSuccess,
        state === ScanState.fail && styles.bgFail,
      ]}
      {...restProps}
      onPress={handleProvision}
    >
      <View style={styles.head}>
        <MaterialIcons
          name="laptop"
          size={20}
          style={[styles.icon, textWhite ? styles.textWhite : styles.textBlack]}
        />
        <Text style={[textWhite ? styles.textWhite : styles.textBlack]}>
          MAC
        </Text>
      </View>
      <Text style={[textWhite ? styles.textWhite : styles.textBlack]}>
        {device.address}
      </Text>

      <View style={styles.deviceInfo}>
        <MaterialIcons
          name="tag"
          size={20}
          style={[styles.icon, textWhite ? styles.textWhite : styles.textBlack]}
        />
        <Text style={[textWhite ? styles.textWhite : styles.textBlack]}>
          UUID
        </Text>
      </View>
      <Text style={[textWhite ? styles.textWhite : styles.textBlack]}>
        {device.uuid}
      </Text>

      <View style={styles.deviceInfo}>
        <MaterialIcons
          name="tag"
          size={20}
          style={[styles.icon, textWhite ? styles.textWhite : styles.textBlack]}
        />
        <Text style={[textWhite ? styles.textWhite : styles.textBlack]}>
          DeviceType
        </Text>
      </View>
      <Text style={[textWhite ? styles.textWhite : styles.textBlack]}>
        {device.scanRecord.split(':').slice(49, 52).join(':')}
      </Text>
      {state !== ScanState.init && currentMacAddress === device?.address && (
        <Text
          style={[
            textWhite && styles.textWhite,
            currentMacAddress === device?.address &&
              state === ScanState.binding &&
              styles.textOrange,
          ]}
        >
          {state === ScanState.provisioning &&
            currentMacAddress === device?.address &&
            'provisioning...'}
          {state === ScanState.provsionFail &&
            currentMacAddress === device?.address &&
            'provisioning fail'}
          {state === ScanState.binding &&
            currentMacAddress === device?.address &&
            'binding...'}
          {success && 'Success'}
          {state === ScanState.fail &&
            currentMacAddress === device?.address &&
            'Fail'}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 16,
    marginRight: 16,
    marginTop: 8,
    marginBottom: 8,
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 16,
    paddingRight: 16,
    borderRadius: 8,
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    overflow: 'hidden',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  icon: {
    marginRight: 12,
  },
  deviceInfo: {
    flexGrow: 1,
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 4,
  },
  bgSuccess: {
    backgroundColor: 'green',
  },
  bgFail: {
    backgroundColor: 'red',
  },
  textWhite: {
    color: 'white',
  },
  textBlack: {
    color: 'black',
  },
  textOrange: {
    color: 'orange',
  },
});
