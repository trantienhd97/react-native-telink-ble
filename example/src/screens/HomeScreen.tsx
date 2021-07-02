import type { StackScreenProps } from '@react-navigation/stack';
import type { FC } from 'react';
import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Button, FAB } from 'react-native-paper';
import TelinkBle, { NodeInfo } from 'react-native-telink-ble';
import nameof from 'ts-nameof.macro';
import NodeView from '../components/NodeView';
import { DeviceControlScreen } from './DeviceControlScreen';
import DeviceScanningScreen from './DeviceScanningScreen';

export const HomeScreen: FC<Partial<StackScreenProps<any>>> = (
  props: Partial<StackScreenProps<any>>
) => {
  const { navigation } = props;

  const [nodes, setNodes] = React.useState<NodeInfo[]>([]);

  React.useEffect(() => {
    return navigation?.addListener('focus', () => {
      TelinkBle.autoConnect();
    });
  }, [navigation]);

  const handleNavigateToDeviceControl = React.useCallback(
    (node: NodeInfo) => () => {
      navigation?.navigate(DeviceControlScreen.displayName!, {
        node,
      });
    },
    [navigation]
  );

  React.useEffect(() => {
    return navigation?.addListener('focus', () => {
      TelinkBle.getNodes().then(setNodes);
    });
  }, [navigation]);

  return (
    <FlatList
      style={styles.outerContainer}
      contentContainerStyle={styles.innerContainer}
      data={nodes}
      keyExtractor={(nodeInfo: NodeInfo) => nodeInfo.address}
      renderItem={({ item, index }) => {
        return (
          <>
            <NodeView
              node={item}
              index={index}
              onPress={handleNavigateToDeviceControl(item)}
            />
          </>
        );
      }}
      ListHeaderComponent={
        <>
          <FAB
            style={styles.fab}
            small
            icon="plus"
            onPress={() => {
              navigation?.navigate(DeviceScanningScreen.displayName!);
            }}
          />
          <View style={styles.actions}>
            <Button
              onPress={() => {
                TelinkBle.getNodes().then((newNodes: NodeInfo[]) => {
                  setNodes(newNodes);
                  console.log(newNodes);
                });
              }}
            >
              Get nodes
            </Button>
            <Button
              onPress={() => {
                TelinkBle.setAllOn();
              }}
            >
              All on
            </Button>
            <Button
              onPress={() => {
                TelinkBle.setAllOff();
              }}
            >
              All off
            </Button>
          </View>
        </>
      }
    />
  );
};

HomeScreen.displayName = nameof(HomeScreen);

export default HomeScreen;

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    height: '100%',
    flex: 1,
  },
  innerContainer: {
    width: '100%',
    minHeight: '100%',
  },
  fab: {
    margin: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100000,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  actions: {
    flexDirection: 'row',
  },
});
