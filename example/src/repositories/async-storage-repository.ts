import type { Group } from '../models/group';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NodeInfo } from 'react-native-telink-ble';

export class AsyncStorageRepository {
  public async saveGroups(groups: Group[]): Promise<void> {
    await AsyncStorage.setItem('groups', JSON.stringify(groups));
  }

  public async getGroups(): Promise<Group[] | []> {
    return new Promise(async (resolve) => {
      const result: string | null = await AsyncStorage.getItem('groups');
      if (result) {
        const groups: Group[] = JSON.parse(result);
        if (groups) {
          resolve(groups);
          return;
        }
      }
      resolve([]);
    });
  }

  public async removeGroups() {
    await AsyncStorage.removeItem('groups');
  }

  public async saveScene(scene: Record<number, NodeInfo[]>): Promise<void> {
    await AsyncStorage.setItem('scene', JSON.stringify(scene));
  }

  public async getScene(): Promise<Record<number, NodeInfo[]>> {
    return new Promise(async (resolve) => {
      const result: string | null = await AsyncStorage.getItem('scene');
      if (result) {
        const scene: Record<number, NodeInfo[]> = JSON.parse(result);
        if (scene) {
          resolve(scene);
          return;
        }
      }
      // @ts-ignore
      resolve(null);
    });
  }

  public async removeScene() {
    await AsyncStorage.removeItem('scene');
  }
}
export const asyncStorageRepository: AsyncStorageRepository =
  new AsyncStorageRepository();
