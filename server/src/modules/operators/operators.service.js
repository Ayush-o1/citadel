import * as repository from './operators.repository.js';

export async function listOperators() {
  return repository.findAll();
}
