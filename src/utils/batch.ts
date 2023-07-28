const _ = require('lodash');

export const batchEach = async(list: Array<any>, batchSize: number, method: Function) => {
  const chunks = _.chunk(list, batchSize);
  for (var i = 0; i < chunks.length; i++) {
    await method(chunks[i], i);
  }
}