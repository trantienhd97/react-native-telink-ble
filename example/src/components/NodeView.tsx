import React from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  View,
} from 'react-native';
import type { NodeInfo } from 'react-native-telink-ble';
import TelinkBle from 'react-native-telink-ble';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface NodeViewProps extends TouchableOpacityProps {
  node: NodeInfo;

  index: number;

  isSwitch: boolean;

  selected?: boolean;
}

export default function NodeView(props: NodeViewProps) {
  const { node, isSwitch, selected, ...restProps } = props;

  const [onOff, setOnOff] = React.useState<boolean>(false);

  const handleOnOff = React.useCallback(
    (newOnOff: boolean) => {
      TelinkBle.setOnOff(node.unicastId, newOnOff ? 1 : 0);
      setOnOff(newOnOff);
    },
    [node.unicastId]
  );

  return (
    <TouchableOpacity
      style={[styles.container, selected && styles.borderSelect]}
      {...restProps}
    >
      <View style={styles.head}>
        <MaterialIcons name="laptop" size={20} style={styles.icon} />
        <Text>MAC</Text>
      </View>
      <Text>{node.address}</Text>

      <View style={styles.deviceInfo}>
        <MaterialIcons name="tag" size={20} style={styles.icon} />
        <Text>UUID</Text>
      </View>
      <Text>{node.uuid}</Text>

      <View style={styles.deviceInfo}>
        <MaterialIcons name="tag" size={20} style={styles.icon} />
        <Text>Unicast ID</Text>
      </View>
      <Text>{node.unicastId}</Text>
      {isSwitch && <Switch value={onOff} onValueChange={handleOnOff} />}
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
  borderSelect: {
    borderColor: 'green',
    borderWidth: 2,
  },
});
