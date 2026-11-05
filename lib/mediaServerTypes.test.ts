import { describe, expect, it } from 'vitest';

import { isMediaServerType, MEDIA_SERVER_TYPE_OPTIONS } from './mediaServerTypes';

describe('media server route types', () => {
  it.each(['jellyfin', 'emby'])('accepts the supported route %s', (type) => {
    expect(isMediaServerType(type)).toBe(true);
  });

  it('keeps both server types available in the picker', () => {
    expect(MEDIA_SERVER_TYPE_OPTIONS.map((option) => option.type)).toEqual(['jellyfin', 'emby']);
  });

  it.each([undefined, '', 'unknown', 'Emby', '__proto__', 'constructor', 'toString'])(
    'rejects unsupported route value %s',
    (type) => {
      expect(isMediaServerType(type)).toBe(false);
    },
  );
});
