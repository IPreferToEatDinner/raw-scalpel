import { Hello } from '../index';

test('my Hello', () => {
  expect(Hello('raw')).toBe('raw hello');
});
