import { Connection, Model, connect } from 'mongoose';
import { UsersService } from './users.service';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import { User, UserSchema } from './entity/users.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './entity/users.entity';

describe('UserService', () => {
  let userService: UsersService;
  let mongoServer: MongoMemoryServer;
  let mongoConnection: Connection;
  let userModel: Model<User>;

  beforeAll(async () => {
    mongoServer = new MongoMemoryServer();
    await mongoServer.start();
    const uri = await mongoServer.getUri();
    mongoConnection = (await connect(uri)).connection;

    userModel = mongoConnection.model(User.name, UserSchema);

    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true })],
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    userService = module.get<UsersService>(UsersService);
  });

  afterAll(async () => {
    await mongoConnection.dropDatabase();
    await mongoConnection.close();
    await mongoServer.stop();
  });

  describe('create', () => {
    afterEach(async () => {
      await mongoConnection.dropDatabase();
    });
    it('should create a new user', async () => {
      const user: CreateUserDto = {
        name: 'test',
        email: 'test@test.com',
        password: 'test',
        rol: UserRole.SUPERADMIN,
      };

      const response = await userService.create(user);
      expect(response._id).not.toBeNull();
    });
  });
});
