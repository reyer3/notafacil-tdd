// src/module-alias.ts
import moduleAlias from 'module-alias';
import * as path from 'path';

moduleAlias.addAliases({
    '@domain': path.join(__dirname, 'domain'),
    '@application': path.join(__dirname, 'application'),
    '@infrastructure': path.join(__dirname, 'infrastructure'),
    '@test': path.join(__dirname, '../test')
});