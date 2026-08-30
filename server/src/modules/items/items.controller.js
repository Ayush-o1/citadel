import { itemsService } from './items.service.js';
import { ok, created } from '../../utils/apiResponse.js';

export const itemsController = {
  async list(req, res) {
    const items = await itemsService.listItems();
    ok(res, items);
  },

  async get(req, res) {
    const item = await itemsService.getItem(req.params.id);
    ok(res, item);
  },

  async create(req, res) {
    const item = await itemsService.createItem(req.body);
    created(res, item);
  },

  async remove(req, res) {
    await itemsService.deleteItem(req.params.id);
    res.status(204).end();
  },
};
