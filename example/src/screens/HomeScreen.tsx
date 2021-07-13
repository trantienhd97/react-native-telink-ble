import type { StackScreenProps } from '@react-navigation/stack';
import type { FC } from 'react';
import React from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Checkbox } from 'react-native-paper';
import { Button, FAB } from 'react-native-paper';
import TelinkBle, { BleEvent, NodeInfo } from 'react-native-telink-ble';
import nameof from 'ts-nameof.macro';
import NodeView from '../components/NodeView';
import { DeviceControlScreen } from './DeviceControlScreen';
import DeviceScanningScreen from './DeviceScanningScreen';
import PagerView from 'react-native-pager-view';
import type { Group } from '../models/group';
import { asyncStorageRepository } from '../repositories/async-storage-repository';
import groupList from '../data/groups.json';
import GroupView from '../components/GroupView';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { showInfo } from '../helpers/toast';
import SceneView from '../components/SceneView';
import { deviceService } from '../services/device-service';

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

  const [groups, setGroups] = React.useState<Group[]>([]);

  const [handleGetDeviceState] = deviceService.useNotificationDeviceState();

  React.useEffect(() => {
    const unsubscribe = navigation?.addListener('focus', async () => {
      const groupAsync = await asyncStorageRepository.getGroups();
      if (groupAsync.length !== 0) {
        setGroups(groupAsync);
      } else {
        await asyncStorageRepository.saveGroups(groupList as Group[]);
        setGroups(await asyncStorageRepository.getGroups());
      }
    });
    return function cleanup() {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [navigation, props.navigation]);

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

  const [scene, isScene] = React.useState<boolean>(false);

  const handleToggleScene = React.useCallback(() => {
    setNodeSelected([]);
    isScene(!scene);
  }, [scene]);

  const [nodeSelected, setNodeSelected] = React.useState<NodeInfo[]>([]);

  const handleSelectNode = React.useCallback(
    (node: NodeInfo) => () => {
      let nodeList: NodeInfo[] = nodeSelected;
      if (nodeSelected.findIndex((n) => n.unicastId === node.unicastId) >= 0) {
        setNodeSelected(
          nodeList.filter((res) => res.unicastId !== node.unicastId)
        );
      } else {
        setNodeSelected(nodeList.concat([node]));
      }
    },
    [nodeSelected]
  );

  const handleSelectAll = React.useCallback(() => {
    if (nodeSelected.length !== 0 && nodeSelected.length === nodes.length) {
      setNodeSelected([]);
    } else {
      setNodeSelected(nodes);
    }
  }, [nodeSelected.length, nodes]);

  const [currentSceneId, setCurrentSceneId] = React.useState<number>();

  const handleSave = React.useCallback(
    async (count: number) => {
      const sceneAsync = await asyncStorageRepository.getScene();
      if (sceneAsync) {
        setCurrentSceneId(
          Number(Object.keys(sceneAsync)[Object.keys(sceneAsync).length - 1]) +
            1
        );
        TelinkBle.setSceneForDevice(
          currentSceneId
            ? currentSceneId
            : Number(
                Object.keys(sceneAsync)[Object.keys(sceneAsync).length - 1]
              ) + 1,
          nodeSelected[count].unicastId,
          count === nodeSelected.length - 1,
          count.toString()
        );
      } else {
        setCurrentSceneId(4153);
        TelinkBle.setSceneForDevice(
          currentSceneId ? currentSceneId : Number(4153),
          nodeSelected[count].unicastId,
          count === nodeSelected.length - 1,
          count.toString()
        );
      }
    },
    [currentSceneId, nodeSelected]
  );

  const [listScene, setListScene] =
    // @ts-ignore
    React.useState<Record<number, NodeInfo[]>>(null);

  React.useEffect(() => {
    navigation?.addListener('focus', async () => {
      const sceneAsync = await asyncStorageRepository.getScene();
      setListScene(sceneAsync);
    });
  }, [navigation]);

  React.useEffect(() => {
    return TelinkBle.addEventListener(
      BleEvent.EVENT_SET_SCENE_SUCCESS,
      async (id) => {
        if (typeof id === 'number') {
          isScene(false);
          showInfo('Success');
          const sceneAsync = await asyncStorageRepository.getScene();
          const albumMapper: Record<number, NodeInfo[]> = sceneAsync ?? {};
          if (id) {
            albumMapper[id] = nodeSelected;
          }
          await asyncStorageRepository.saveScene(albumMapper);
          setListScene(albumMapper);
          setNodeSelected([]);
        } else {
          const index = (await Number(id)) + 1;
          setTimeout(function () {
            handleSave(index);
          }, 2000);
        }
      }
    );
  }, [handleSave, nodeSelected, props.navigation]);

  React.useEffect(() => {
    return TelinkBle.addEventListener(
      BleEvent.EVENT_REMOVE_SCENE_SUCCESS,
      async (id: number) => {
        const sceneAsync = await asyncStorageRepository.getScene();
        const albumMapper: Record<number, NodeInfo[]> = {};
        if (sceneAsync) {
          for (const key in sceneAsync) {
            if (key !== id.toString()) {
              albumMapper[key] = sceneAsync[key];
            }
          }
        }
        setListScene(albumMapper);
        await asyncStorageRepository.saveScene(albumMapper);
      }
    );
  }, []);

  React.useEffect(() => {
    return TelinkBle.addEventListener(
      BleEvent.EVENT_DEVICE_STATE,
      handleGetDeviceState
    );
  }, [handleGetDeviceState]);

  return (
    <>
      <PagerView
        style={styles.pagerView}
        initialPage={0}
        showPageIndicator={true}
        transitionStyle={'curl'}
      >
        <View key="1">
          <FlatList
            style={styles.outerContainer}
            contentContainerStyle={styles.innerContainer}
            data={nodes}
            keyExtractor={(nodeInfo: NodeInfo) => nodeInfo.address}
            renderItem={({ item, index }) => {
              return (
                <>
                  <NodeView
                    isSwitch={true}
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
        </View>
        <View key="2">
          <FlatList
            style={styles.flatListView}
            data={groups}
            keyExtractor={(group: Group) => group.id.toString()}
            renderItem={({ item, index }) => {
              return <GroupView group={item} key={index} />;
            }}
          />
        </View>
        <View key="3">
          <FlatList
            style={styles.flatListView}
            data={listScene ? Object.keys(listScene) : []}
            keyExtractor={(key: string) => key}
            renderItem={({ item, index }) => {
              return <SceneView key={index} id={item} />;
            }}
            ListHeaderComponent={
              <View style={styles.lineView}>
                <Pressable
                  style={styles.addIconView}
                  onPress={handleToggleScene}
                >
                  <MaterialIcons name="add" size={20} style={styles.icon} />
                </Pressable>
              </View>
            }
            ListEmptyComponent={<View />}
          />
        </View>

        <Modal visible={scene}>
          <View style={styles.headerView}>
            <Pressable style={styles.addIconView} onPress={handleToggleScene}>
              <MaterialIcons name="clear" size={20} style={styles.icon} />
            </Pressable>
            <Text style={styles.icon}>Scene</Text>
            <Checkbox
              onPress={handleSelectAll}
              status={
                nodeSelected.length !== 0 &&
                nodeSelected.length === nodes.length
                  ? 'checked'
                  : 'unchecked'
              }
              color={'white'}
              uncheckedColor={'white'}
            />
          </View>
          <FlatList
            style={styles.outerContainer}
            contentContainerStyle={styles.innerContainer}
            data={nodes}
            keyExtractor={(nodeInfo: NodeInfo) => nodeInfo.address}
            renderItem={({ item, index }) => {
              return (
                <>
                  <NodeView
                    selected={
                      nodeSelected.findIndex(
                        (n) => n.unicastId === item.unicastId
                      ) >= 0
                    }
                    isSwitch={false}
                    node={item}
                    index={index}
                    onPress={handleSelectNode(item)}
                  />
                </>
              );
            }}
          />
          <Pressable
            style={styles.btnSaveScene}
            onPress={() => {
              handleSave(0).then(() => {});
            }}
          >
            <Text style={styles.icon}>Lưu</Text>
          </Pressable>
        </Modal>
      </PagerView>
    </>
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
  pagerView: {
    flex: 1,
  },
  itemView: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  flatListView: {
    padding: 16,
  },
  icon: {
    color: 'white',
  },
  addIconView: {
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'blue',
    width: 40,
    height: 40,
  },
  lineView: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  headerView: {
    backgroundColor: 'blue',
    height: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 16,
  },
  btnSaveScene: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 100,
    backgroundColor: 'blue',
  },
});
