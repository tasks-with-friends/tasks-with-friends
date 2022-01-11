import { RealTime } from './real-time';

const noop = () => {
  // This space intentionally left blonk
};

export class NullRealTime implements RealTime {
  trigger(): Promise<Response> {
    return Promise.resolve({
      headers: {
        append: noop,
        delete: noop,
        get: () => null,
        has: () => false,
        set: noop,
        forEach: noop,
      },
      ok: true,
      redirected: false,
      status: 200,
      statusText: 'OK',
      type: 'basic',
      url: '',
      clone: (): Response => {
        throw new Error();
      },

      body: null,
      bodyUsed: false,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      blob: () => Promise.resolve(new Blob()),
      formData: () =>
        Promise.resolve({
          append: noop,
          delete: noop,
          get: () => null,
          getAll: () => [],
          has: () => false,
          set: noop,
          forEach: noop,
        }),
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    });
  }
}
