import { Hello } from '../src/index';

test('my Hello', () => {
  expect(Hello('raw')).toBe('raw hello');
});
