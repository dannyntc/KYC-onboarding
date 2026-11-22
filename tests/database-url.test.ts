import {expect,it} from 'vitest';
import {databaseUrl} from '../src/lib/database-url';
it('preserves Prisma 6 relative database paths and leaves absolute URLs unchanged',()=>{
 expect(databaseUrl('file:./dev.db','/project')).toBe('file:/project/prisma/dev.db');
 expect(databaseUrl('file:/tmp/test.db','/project')).toBe('file:/tmp/test.db');
});
