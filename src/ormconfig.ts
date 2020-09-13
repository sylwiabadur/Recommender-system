import { ConfigService } from './config/config.service';

module.exports = {
  ...new ConfigService().createTypeOrmOptions(),
  migrations: ['migration/*.ts'],
};
