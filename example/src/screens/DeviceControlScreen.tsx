import Slider from '@react-native-community/slider';
import type { StackScreenProps } from '@react-navigation/stack';
import { hex2Hsl, HSV, hsv2Hex } from 'colorsys';
import type { FC } from 'react';
import React from 'reactn';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { ColorPicker } from 'react-native-color-picker';
import { Checkbox } from 'react-native-paper';
import TelinkBle, { BleEvent, NodeInfo } from 'react-native-telink-ble';
import nameof from 'ts-nameof.macro';
import type { Group } from '../models/group';
import groupList from '../../src/data/groups.json';
import { asyncStorageRepository } from '../repositories/async-storage-repository';

interface DeviceControlParams {
  node: NodeInfo;
}

interface DeviceControlProps
  extends StackScreenProps<Record<string, DeviceControlParams>> {}

export const DeviceControlScreen: FC<DeviceControlProps> = (
  props: DeviceControlProps
) => {
  const { node } = props.route.params;
  const [, setColor] = React.useState<string>('#FFFFFF');

  const [group, isGroup] = React.useState<boolean>(false);

  const [groups, setGroups] = React.useState<Group[]>([]);

  React.useEffect(() => {
    const unsubscribe = props.navigation.addListener('focus', async () => {
      const groupAsync = await asyncStorageRepository.getGroups();
      if (groupAsync.length !== 0) {
        setGroups(groupAsync);
      } else {
        await asyncStorageRepository.saveGroups(groupList as Group[]);
        setGroups(await asyncStorageRepository.getGroups());
      }
    });
    return function cleanup() {
      unsubscribe();
    };
  }, [props.navigation]);

  const handleChangeColor = React.useCallback(
    (c: HSV) => {
      const h = c.h;
      const s = c.s * 100;
      const v = c.v * 100;
      const hex = hsv2Hex({ h, s, v });
      const hsl = hex2Hsl(hex);
      setColor(hex);
      TelinkBle.setHsl(node.unicastId, hsl);
    },
    [node.unicastId]
  );

  React.useEffect(() => {
    return TelinkBle.addEventListener(BleEvent.EVENT_RESET_NODE_SUCCESS, () => {
      props.navigation.goBack();
    });
  }, [props.navigation]);

  React.useEffect(() => {
    return TelinkBle.addEventListener(
      BleEvent.EVENT_SET_GROUP_SUCCESS,
      async (idG: number) => {
        const result: Group[] = await groups.map((g) => {
          return g.id === idG
            ? { ...g, state: g.state === 'Active' ? 'InActive' : 'Active' }
            : g;
        });

        await asyncStorageRepository.saveGroups(result);

        setGroups(await asyncStorageRepository.getGroups());
      }
    );
  }, [groups, node.unicastId]);

  React.useEffect(() => {
    return TelinkBle.addEventListener(BleEvent.EVENT_SET_GROUP_FAILED, () => {
      console.log('fail');
    });
  }, [props.navigation]);

  const handleKickOut = React.useCallback(() => {
    TelinkBle.kickOut(node.unicastId);
  }, [node.unicastId]);

  const handleOpenGroup = React.useCallback(() => {
    isGroup(true);
  }, []);

  const handleCloseGroup = React.useCallback(() => {
    isGroup(false);
  }, []);

  const handleAddGroup = React.useCallback(
    (groupId: number) => () => {
      TelinkBle.addDeviceToGroup(groupId, node.unicastId);
    },
    [node.unicastId]
  );

  const handleRemoveDeviceFromGroup = React.useCallback(
    (groupId: number) => () => {
      TelinkBle.removeDeviceFromGroup(groupId, node.unicastId);
    },
    [node.unicastId]
  );

  return (
    <>
      {group ? (
        <>
          <Pressable onPress={handleCloseGroup} style={styles.btnView}>
            <Text style={styles.textWhite}>Group</Text>
          </Pressable>
          <FlatList
            style={styles.flatListView}
            data={groups}
            keyExtractor={(group: Group) => group.id.toString()}
            renderItem={({ item, index }) => {
              const status =
                groups.find((g) => g.id === item.id)?.state === 'Active';
              return (
                <View style={styles.itemView} key={index}>
                  <Text>{item.name}</Text>
                  <Checkbox
                    onPress={
                      status
                        ? handleRemoveDeviceFromGroup(item.id)
                        : handleAddGroup(item.id)
                    }
                    status={status ? 'checked' : 'unchecked'}
                  />
                </View>
              );
            }}
          />
        </>
      ) : (
        <>
          <Pressable onPress={handleOpenGroup} style={styles.btnView}>
            <Text style={styles.textWhite}>Group</Text>
          </Pressable>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#000000"
            onValueChange={(value: number) => {
              TelinkBle.setLuminance(node.unicastId, value);
            }}
          />
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={100}
            minimumTrackTintColor="#FFFFFF"
            maximumTrackTintColor="#000000"
            onValueChange={(value: number) => {
              TelinkBle.setTemp(node.unicastId, value);
            }}
          />
          <ColorPicker
            onColorChange={handleChangeColor}
            style={styles.picker}
          />

          <View style={styles.bTNView}>
            <Pressable style={styles.bTNKickOff} onPress={handleKickOut}>
              <Text style={styles.btnText}>Kick Off</Text>
            </Pressable>
          </View>
        </>
      )}
    </>
  );
};

DeviceControlScreen.displayName = nameof(DeviceControlScreen);

const styles = StyleSheet.create({
  slider: {
    width: '100%',
    height: 40,
  },
  picker: {
    width: '100%',
    aspectRatio: 1,
  },
  bTNView: {
    marginTop: 30,
    padding: 16,
  },
  bTNKickOff: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
    backgroundColor: 'red',
    padding: 16,
  },
  btnText: {
    color: 'white',
  },
  btnView: {
    marginTop: 16,
    backgroundColor: 'blue',
    width: 100,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 5,
  },
  textWhite: {
    color: 'white',
  },
  itemView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  flatListView: {
    padding: 16,
  },
});
