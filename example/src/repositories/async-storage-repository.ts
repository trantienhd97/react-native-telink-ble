import type { Group } from '../models/group';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
}
export const asyncStorageRepository: AsyncStorageRepository =
  new AsyncStorageRepository();
