import * as repository from './sites.repository.js';

export async function listSites() {
  return repository.findAll();
}
