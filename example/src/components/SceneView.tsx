import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacityProps,
  View,
} from 'react-native';
import type { NodeInfo } from 'react-native-telink-ble';
import TelinkBle from 'react-native-telink-ble';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface SceneViewProps extends TouchableOpacityProps {
  id: string;

  deviceList?: NodeInfo[];
}

export default function SceneView(props: SceneViewProps) {
  const { id } = props;

  const handleOnOff = React.useCallback(() => {
    TelinkBle.onStartScene(Number(id));
  }, [id]);

  const handleDelete = React.useCallback(() => {
    TelinkBle.deleteScene(Number(id));
  }, [id]);

  return (
    <View style={styles.container}>
      <Text>{id}</Text>
      <View style={styles.flexRow}>
        <Pressable onPress={handleOnOff} style={styles.marR16px}>
          <Text>Play</Text>
        </Pressable>
        <Pressable onPress={handleDelete}>
          <MaterialIcons name="delete" size={30} />
        </Pressable>
      </View>
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
  flexRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marR16px: {
    marginRight: 16,
  },
});
