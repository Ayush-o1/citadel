import { itemsRepository } from './items.repository.js';
import { ApiError } from '../../utils/apiResponse.js';

// Business logic lives here, separate from HTTP (controller) and SQL
// (repository). For most hackathon CRUD this layer stays thin — that's fine.
export const itemsService = {
  listItems() {
    return itemsRepository.findAll();
  },

  async getItem(id) {
    const item = await itemsRepository.findById(id);
    if (!item) {
      throw new ApiError(404, `Item ${id} not found`);
    }
    return item;
  },

  createItem(data) {
    return itemsRepository.create(data);
  },

  async deleteItem(id) {
    const deleted = await itemsRepository.remove(id);
    if (!deleted) {
      throw new ApiError(404, `Item ${id} not found`);
    }
  },
};
