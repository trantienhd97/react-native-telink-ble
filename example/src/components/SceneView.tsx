import React from 'react';
import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacityProps,
  View,
} from 'react-native';
import type { NodeInfo } from 'react-native-telink-ble';
import TelinkBle from 'react-native-telink-ble';

interface SceneViewProps extends TouchableOpacityProps {
  id: string;

  deviceList?: NodeInfo[];
}

export default function SceneView(props: SceneViewProps) {
  const { id } = props;

  const [onOff, setOnOff] = React.useState<boolean>(false);

  const handleOnOff = React.useCallback(
    (newOnOff: boolean) => {
      TelinkBle.onStartScene(Number(id));
      setOnOff(newOnOff);
    },
    [id]
  );

  return (
    <View style={styles.container}>
      <Text>{id}</Text>
      <Switch value={onOff} onValueChange={handleOnOff} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FEF7DC',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
    borderRadius: 5,
  },
});
