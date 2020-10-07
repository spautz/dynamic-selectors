import { createDynamicSelector } from '../src';

describe('createDynamicSelector with defaults', () => {
  it('runs functions', () => {
    const state = { foo: 'bar' };
    const mySelector = createDynamicSelector((getState) => {
      return getState('foo');
    });

    expect(mySelector(state)).toEqual('bar');
  });
});
