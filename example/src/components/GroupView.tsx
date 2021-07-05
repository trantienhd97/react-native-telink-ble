import {
  StyleSheet,
  Switch,
  Text,
  TouchableOpacityProps,
  View,
} from 'react-native';
import TelinkBle from 'react-native-telink-ble';
import React from 'react';
import type { Group } from '../models/group';

interface GroupViewProps extends TouchableOpacityProps {
  group: Group;
}

export default function GroupView(props: GroupViewProps) {
  const { group } = props;

  const [onOff, setOnOff] = React.useState<boolean>(false);

  const handleOnOff = React.useCallback(
    (newOnOff: boolean) => {
      if (!newOnOff) {
        TelinkBle.setOnOff(group.id, 0);
      } else {
        TelinkBle.setOnOff(group.id, 1);
      }
      setOnOff(newOnOff);
    },
    [group.id]
  );

  return (
    <View>
      <View style={styles.itemView}>
        <Text>{group.name}</Text>
        <Switch value={onOff} onValueChange={handleOnOff} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  flatListView: {
    padding: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});
